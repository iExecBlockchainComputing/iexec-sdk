#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const semver = require('semver');
const fs = require('fs-extra');
const path = require('path');
const { generateKeyPair } = require('crypto');
const {
  help,
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
} = require('./cli-helper');
const { loadChain } = require('./chains.js');
const secretMgtServ = require('./sms.js');
const { getResultEncryptionKeyName } = require('./secrets-utils');
const { saveTextToFile } = require('./fs');
const { Keystore } = require('./keystore');
const { decryptResult } = require('./utils');

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
  .action(async (cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const nodeMinVersion = 'v10.12.0';
      if (semver.gt(nodeMinVersion, process.version)) {
        throw Error(
          `Minimum node version to use this command is ${nodeMinVersion}, found ${process.version}`,
        );
      }
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(
        Object.assign(walletOptions, { isSigner: false }),
      );
      const [address] = await keystore.accounts();

      const { beneficiarySecretsFolderPath } = createEncFolderPaths(cmd);
      await fs.ensureDir(beneficiarySecretsFolderPath);

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
        force: cmd.force,
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
      handleError(error, cli, cmd);
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
  .action(async (encryptedResultsPath, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const { beneficiarySecretsFolderPath } = createEncFolderPaths(cmd);
      const exists = await fs.pathExists(beneficiarySecretsFolderPath);

      if (!exists) {
        throw Error(
          'Beneficiary secrets folder is missing did you forget to run "iexec results generate-encryption-keypair"?',
        );
      }

      const inputFile = encryptedResultsPath
        || path.join(process.cwd(), DEFAULT_ENCRYPTED_RESULTS_NAME);
      const outputFile = cmd.decryptedResultsPath
        || path.join(process.cwd(), DEFAULT_DECRYPTED_RESULTS_NAME);

      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(
        Object.assign(walletOptions, { isSigner: false }),
      );

      let beneficiaryKeyPath;
      if (cmd.beneficiaryKeyFile) {
        beneficiaryKeyPath = path.join(
          beneficiarySecretsFolderPath,
          cmd.beneficiaryKeyFile,
        );
      } else {
        const [address] = await keystore.accounts();
        spinner.info(`Using beneficiary encryption key for wallet ${address}`);
        beneficiaryKeyPath = path.join(
          beneficiarySecretsFolderPath,
          privateKeyName(address),
        );
      }

      let beneficiaryKey;
      try {
        beneficiaryKey = await fs.readFile(beneficiaryKeyPath, 'utf8');
      } catch (error) {
        debug(error);
        throw Error(
          `Failed to load beneficiary encryption key from "${beneficiaryKeyPath}"`,
        );
      }

      const outputExists = await fs.exists(outputFile);
      if (outputExists && !cmd.force) await prompt.fileExists(outputFile);

      spinner.start('Decrypting results');
      const encResultsZip = await fs.readFile(inputFile);
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
      handleError(error, cli, cmd);
    }
  });

const pushSecret = cli.command('push-encryption-key').alias('push-secret');
addGlobalOptions(pushSecret);
addWalletLoadOptions(pushSecret);
pushSecret
  .option(...option.chain())
  .option(...option.secretPath())
  .option(...option.forceUpdateSecret())
  .description(desc.pushResultKey())
  .action(async (cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(Object.assign(walletOptions));
      const chain = await loadChain(cmd.chain, keystore, {
        spinner,
      });

      const { contracts, sms } = chain;
      if (!sms) throw Error(`Missing sms in "chain.json" for chain ${chain.id}`);

      const { address } = await keystore.load();
      debug('address', address);

      let secretFilePath;
      if (cmd.secretPath) {
        secretFilePath = cmd.secretPath;
      } else {
        const { beneficiarySecretsFolderPath } = createEncFolderPaths();
        secretFilePath = path.join(
          beneficiarySecretsFolderPath,
          publicKeyName(address),
        );
      }
      const secretToPush = (await fs.readFile(secretFilePath, 'utf8')).trim();
      debug('secretToPush', secretToPush);
      const {
        isPushed,
        isUpdated,
      } = await secretMgtServ.pushWeb2Secret(
        contracts,
        sms,
        getResultEncryptionKeyName(),
        secretToPush,
        { forceUpdate: !!cmd.forceUpdate },
      );
      if (isPushed) {
        spinner.succeed('Encryption key successfully pushed', {
          raw: { isPushed, isUpdated },
        });
      } else {
        throw Error('Something went wrong');
      }
    } catch (error) {
      handleError(error, cli, cmd);
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
  .action(async (address, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(
        Object.assign(walletOptions, { isSigner: false }),
      );
      const chain = await loadChain(cmd.chain, keystore, {
        spinner,
      });
      let keyAddress;
      if (address) {
        keyAddress = address;
      } else {
        [keyAddress] = await keystore.accounts();
        spinner.info(`Checking encryption key exists for wallet ${keyAddress}`);
      }
      const { contracts, sms } = chain;
      if (!sms) throw Error(`Missing sms in chain.json for chain ${chain.id}`);
      const secretExists = await secretMgtServ.checkWeb2SecretExists(
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
      handleError(error, cli, cmd);
    }
  });

help(cli);
