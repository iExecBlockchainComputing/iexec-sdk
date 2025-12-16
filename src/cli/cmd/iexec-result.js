#!/usr/bin/env node

import { join } from 'node:path';
import { generateKeyPair } from 'node:crypto';
import { program as cli } from 'commander';
import Debug from 'debug';
import { gt } from 'semver';
import fsExtra from 'fs-extra';
import { Buffer } from 'buffer';
import { decryptResult } from '../../common/utils/result-utils.js';
import { getResultEncryptionKeyName } from '../../common/utils/secrets-utils.js';
import { checkWeb2SecretExists } from '../../common/sms/check.js';
import { pushWeb2Secret } from '../../common/sms/push.js';
import {
  finalizeCli,
  addGlobalOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  checkUpdate,
  handleError,
  desc,
  option,
  Spinner,
  prompt,
  createEncFolderPaths,
  DEFAULT_ENCRYPTED_RESULTS_NAME,
  DEFAULT_DECRYPTED_RESULTS_NAME,
  publicKeyName,
  privateKeyName,
  getPropertyFromChain,
} from '../utils/cli-helper.js';
import { loadChain, connectKeystore } from '../utils/chains.js';
import { saveTextToFile } from '../utils/fs.js';
import { Keystore } from '../utils/keystore.js';

const { ensureDir, pathExists, readFile, exists } = fsExtra;

const debug = Debug('iexec:iexec-result');

cli.name('iexec result').usage('<command> [options]');

const generateKeys = cli
  .command('generate-encryption-keypair')
  .alias('generate-keys');
addGlobalOptions(generateKeys);
addWalletLoadOptions(generateKeys);
generateKeys
  .option(...option.force())
  .option(...option.beneficiaryKeystoredir())
  .description(desc.generateKeys())
  .action(async (opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const nodeMinVersion = 'v10.12.0';
      if (gt(nodeMinVersion, process.version)) {
        throw new Error(
          `Minimum node version to use this command is ${nodeMinVersion}, found ${process.version}`,
        );
      }
      const walletOptions = computeWalletLoadOptions(opts);
      const keystore = Keystore(
        Object.assign(walletOptions, { isSigner: false }),
      );
      const [address] = await keystore.accounts();

      const { beneficiarySecretsFolderPath } = createEncFolderPaths(opts);
      await ensureDir(beneficiarySecretsFolderPath);

      spinner.info(`Generate encryption keypair for wallet address ${address}`);
      spinner.start('Generating new keypair');

      const { privateKey, publicKey } = await new Promise((resolve, reject) => {
        generateKeyPair(
          'rsa',
          {
            modulusLength: 4096,
            publicKeyEncoding: {
              type: 'spki',
              format: 'pem',
            },
            privateKeyEncoding: {
              type: 'pkcs8',
              format: 'pem',
            },
          },
          (err, pub, pri) => {
            if (err) reject(err);
            else {
              resolve({
                privateKey: pri,
                publicKey: pub,
              });
            }
          },
        );
      });
      spinner.stop();
      const priKeyFileName = privateKeyName(address);
      const pubKeyFileName = publicKeyName(address);
      await saveTextToFile(priKeyFileName, privateKey, {
        force: opts.force,
        fileDir: beneficiarySecretsFolderPath,
      });
      await saveTextToFile(pubKeyFileName, publicKey, {
        force: true,
        fileDir: beneficiarySecretsFolderPath,
      });

      spinner.succeed(
        `Encryption keypair "${priKeyFileName}" and "${pubKeyFileName}" generated in "${beneficiarySecretsFolderPath}", make sure to backup this keypair\nRun "iexec result push-encryption-key" to securely share your public key for result encryption`,
        {
          raw: {
            secretPath: beneficiarySecretsFolderPath,
            privateKeyFile: priKeyFileName,
            publicKeyFile: pubKeyFileName,
          },
        },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const decryptResults = cli.command('decrypt [encryptedResultsPath]');
addGlobalOptions(decryptResults);
addWalletLoadOptions(decryptResults);
decryptResults
  .option(...option.force())
  .option(...option.beneficiaryKeystoredir())
  .option(...option.beneficiaryKeyFile())
  .description(desc.decryptResults())
  .action(async (encryptedResultsPath, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const { beneficiarySecretsFolderPath } = createEncFolderPaths(opts);
      const beneficiarySecretFolderExists = await pathExists(
        beneficiarySecretsFolderPath,
      );

      if (!beneficiarySecretFolderExists) {
        throw new Error(
          'Beneficiary secrets folder is missing did you forget to run "iexec results generate-encryption-keypair"?',
        );
      }

      const inputFile =
        encryptedResultsPath ||
        join(process.cwd(), DEFAULT_ENCRYPTED_RESULTS_NAME);
      const outputFile =
        opts.decryptedResultsPath ||
        join(process.cwd(), DEFAULT_DECRYPTED_RESULTS_NAME);

      const walletOptions = computeWalletLoadOptions(opts);
      const keystore = Keystore(
        Object.assign(walletOptions, { isSigner: false }),
      );

      let beneficiaryKeyPath;
      if (opts.beneficiaryKeyFile) {
        beneficiaryKeyPath = join(
          beneficiarySecretsFolderPath,
          opts.beneficiaryKeyFile,
        );
      } else {
        const [address] = await keystore.accounts();
        spinner.info(`Using beneficiary encryption key for wallet ${address}`);
        beneficiaryKeyPath = join(
          beneficiarySecretsFolderPath,
          privateKeyName(address),
        );
      }

      let beneficiaryKey;
      try {
        beneficiaryKey = await readFile(beneficiaryKeyPath, 'utf8');
      } catch (error) {
        debug(error);
        throw new Error(
          `Failed to load beneficiary encryption key from "${beneficiaryKeyPath}"`,
        );
      }

      const outputExists = await exists(outputFile);
      if (outputExists && !opts.force) await prompt.fileExists(outputFile);

      spinner.start('Decrypting results');
      const encResultsZip = await readFile(inputFile);
      const decryptedResultsZip = await decryptResult(
        encResultsZip,
        beneficiaryKey,
      );
      await saveTextToFile(outputFile, decryptedResultsZip, { force: true });
      spinner.succeed(`Results successfully decrypted in ${outputFile}`, {
        raw: {
          resultsPath: outputFile,
        },
      });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const pushSecret = cli.command('push-encryption-key').alias('push-secret');
addGlobalOptions(pushSecret);
addWalletLoadOptions(pushSecret);
pushSecret
  .option(...option.chain())
  .option(...option.forceUpdateSecret())
  .option(...option.secretPath())
  .description(desc.pushResultKey())
  .action(async (opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = computeWalletLoadOptions(opts);
      const keystore = Keystore(Object.assign(walletOptions));
      const [chain, [address]] = await Promise.all([
        loadChain(opts.chain, {
          spinner,
        }),
        keystore.accounts(),
      ]);
      await connectKeystore(chain, keystore);
      const { contracts } = chain;
      const sms = getPropertyFromChain(chain, 'sms');
      let secretFilePath;
      if (opts.secretPath) {
        secretFilePath = opts.secretPath;
      } else {
        const { beneficiarySecretsFolderPath } = createEncFolderPaths();
        secretFilePath = join(
          beneficiarySecretsFolderPath,
          publicKeyName(address),
        );
      }
      const publicKey = await readFile(secretFilePath, 'utf8');
      const secretToPush = Buffer.from(publicKey, 'utf8').toString('base64');
      const { isPushed, isUpdated } = await pushWeb2Secret(
        contracts,
        sms,
        getResultEncryptionKeyName(),
        secretToPush,
        { forceUpdate: !!opts.forceUpdate },
      );
      if (isPushed) {
        spinner.succeed('Encryption key successfully pushed', {
          raw: { isPushed, isUpdated },
        });
      } else {
        throw new Error('Something went wrong');
      }
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const checkSecret = cli
  .command('check-encryption-key [address]')
  .alias('check-secret');
addGlobalOptions(checkSecret);
addWalletLoadOptions(checkSecret);
checkSecret
  .option(...option.chain())
  .description(desc.checkSecret())
  .action(async (address, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = computeWalletLoadOptions(opts);
      const keystore = Keystore(
        Object.assign(walletOptions, { isSigner: false }),
      );
      const chain = await loadChain(opts.chain, {
        spinner,
      });
      let keyAddress;
      if (address) {
        keyAddress = address;
      } else {
        [keyAddress] = await keystore.accounts();
        spinner.info(`Checking encryption key exists for wallet ${keyAddress}`);
      }
      const { contracts } = chain;
      const sms = getPropertyFromChain(chain, 'sms');
      const secretExists = await checkWeb2SecretExists(
        contracts,
        sms,
        keyAddress,
        getResultEncryptionKeyName(),
      );
      if (secretExists) {
        spinner.succeed(`Encryption key found for address ${keyAddress}`, {
          raw: { isEncryptionKeySet: true },
        });
      } else {
        spinner.succeed(`No encryption key found for address ${keyAddress}`, {
          raw: { isEncryptionKeySet: false },
        });
      }
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

finalizeCli(cli);
