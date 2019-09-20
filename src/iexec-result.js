#!/usr/bin/env node

const Debug = require('debug');
const JSZip = require('jszip');
const cli = require('commander');
const semver = require('semver');
const fs = require('fs-extra');
const path = require('path');

const { createDecipheriv, generateKeyPair, privateDecrypt } = require('crypto');
const {
  help,
  addGlobalOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  handleError,
  desc,
  option,
  Spinner,
  prompt,
  createEncFolderPaths,
} = require('./cli-helper');
const { loadChain } = require('./chains.js');
const secretMgtServ = require('./sms.js');
const { saveTextToFile } = require('./fs');
const { Keystore } = require('./keystore');

const debug = Debug('iexec:iexec-result');

const DEFAULT_ENCRYPTED_RESULTS_NAME = 'encryptedResults.zip';
const DEFAULT_DECRYPTED_RESULTS_NAME = 'results.zip';
const publicKeyName = address => `${address}_key.pub`;
const privateKeyName = address => `${address}_key`;

const streamToBuffer = stream => new Promise((resolve, reject) => {
  const buffers = [];
  stream.on('error', reject);
  stream.on('data', data => buffers.push(data));
  stream.on('end', () => resolve(Buffer.concat(buffers)));
});

const extractFileFromZip = (jszip, file, destination) => new Promise((resolve, reject) => {
  try {
    jszip
      .file(file)
      .nodeStream()
      .pipe(fs.createWriteStream(destination))
      .on('finish', () => {
        resolve();
      });
  } catch (error) {
    reject(error);
  }
});

const decipherAES = (secret, iv) => createDecipheriv('aes-256-cbc', secret, iv);

const generateKeys = cli.command('generate-keys');
addGlobalOptions(generateKeys);
addWalletLoadOptions(generateKeys);
generateKeys
  .option(...option.force())
  .option(...option.beneficiaryKeystoredir())
  .description(desc.generateKeys())
  .action(async (cmd) => {
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

      spinner.info(`Generate beneficiary keys for wallet address ${address}`);
      spinner.start('Generating new beneficiary keys');

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
        `Beneficiary keys pair "${priKeyFileName}" and "${pubKeyFileName}" generated in "${beneficiarySecretsFolderPath}", make sure to backup this key pair\nRun "iexec result push-secret" to securely share your public key for result encryption`,
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
    const spinner = Spinner(cmd);
    try {
      const { beneficiarySecretsFolderPath } = createEncFolderPaths(cmd);
      const exists = await fs.pathExists(beneficiarySecretsFolderPath);

      if (!exists) {
        throw Error(
          "Beneficiary secrets folder is missing did you forget to run 'iexec results generate-keys'?",
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
        spinner.info(`Using beneficiary key for wallet ${address}`);
        beneficiaryKeyPath = path.join(
          beneficiarySecretsFolderPath,
          privateKeyName(address),
        );
      }

      const rootFolder = 'iexec_out';
      const encKeyFile = 'encrypted_key';
      const encResultsFile = 'result.zip.aes';

      let zip;
      try {
        zip = await new JSZip().loadAsync(fs.readFile(inputFile));
      } catch (error) {
        debug(error);
        throw Error(
          `Failed to load encrypted results zip file from "${inputFile}"`,
        );
      }

      let encryptedResultsKeyArrayBuffer;
      try {
        encryptedResultsKeyArrayBuffer = await zip
          .file(`${rootFolder}/${encKeyFile}`)
          .async('arraybuffer');
      } catch (error) {
        throw Error(`Missing ${encKeyFile} file in "${inputFile}"`);
      }
      const encryptedResultsKeyBuffer = Buffer.from(
        encryptedResultsKeyArrayBuffer,
        'ArrayBuffer',
      );

      let beneficiaryKey;
      try {
        beneficiaryKey = await fs.readFile(beneficiaryKeyPath, 'utf8');
      } catch (error) {
        debug(error);
        throw Error(
          `Failed to load beneficiary key from "${beneficiaryKeyPath}"`,
        );
      }

      spinner.start('Decrypting results key');
      let resultsKey;
      try {
        resultsKey = privateDecrypt(beneficiaryKey, encryptedResultsKeyBuffer);
      } catch (error) {
        debug(error);
        throw Error(
          `Failed to decrypt results key with "${beneficiaryKeyPath}"`,
        );
      }
      debug('resultsKey', resultsKey);

      const cleanFile = async (filePath) => {
        try {
          await fs.remove(filePath);
        } catch (e) {
          debug('cleanFile', filePath, e);
        }
      };

      spinner.stop();
      const outputExists = await fs.exists(outputFile);
      if (outputExists && !cmd.force) await prompt.fileExists(outputFile);
      spinner.start('Decrypting results');
      const tempResultsPath = path.join(process.cwd(), 'encryptedTemp');
      try {
        await extractFileFromZip(
          zip,
          `${rootFolder}/${encResultsFile}`,
          tempResultsPath,
        );
        const ivStream = fs.createReadStream(tempResultsPath, {
          start: 0,
          end: 15,
        });
        const iv = await streamToBuffer(ivStream);
        debug('iv', iv);

        await new Promise((resolve, reject) => {
          const out = fs.createWriteStream(outputFile);
          out.on('close', () => resolve());
          const encryptedResultsStream = fs.createReadStream(tempResultsPath, {
            start: 16,
          });
          encryptedResultsStream
            .on('error', e => reject(new Error(`Read error: ${e}`)))
            .pipe(decipherAES(resultsKey, iv))
            .on('error', e => reject(new Error(`Decipher error: ${e}`)))
            .pipe(out)
            .on('error', e => reject(new Error(`Write error: ${e}`)));
        });
        await cleanFile(tempResultsPath);
      } catch (error) {
        debug(error);
        await Promise.all([cleanFile(tempResultsPath), cleanFile(outputFile)]);
        throw Error('Failed to decrypt results with decrypted results key');
      }

      spinner.succeed(`Results successfully decrypted in ${outputFile}`, {
        raw: {
          resultsPath: outputFile,
        },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const pushSecret = cli.command('push-secret');
addGlobalOptions(pushSecret);
addWalletLoadOptions(pushSecret);
pushSecret
  .option(...option.chain())
  .option(...option.secretPath())
  .description(desc.pushSecret())
  .action(async (cmd) => {
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
      const res = await secretMgtServ.pushSecret(
        contracts,
        sms,
        address,
        secretToPush,
      );
      if (res.hash) {
        spinner.succeed(`Secret successfully pushed (hash: ${res.hash})`, {
          raw: res,
        });
      } else {
        throw Error('Something went wrong');
      }
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const checkSecret = cli.command('check-secret [address]');
addGlobalOptions(checkSecret);
addWalletLoadOptions(checkSecret);
checkSecret
  .option(...option.chain())
  .description(desc.checkSecret())
  .action(async (address, cmd) => {
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
        spinner.info(`Checking secret for wallet ${keyAddress}`);
      }
      const { sms } = chain;
      if (!sms) throw Error(`Missing sms in chain.json for chain ${chain.id}`);
      const res = await secretMgtServ.checkSecret(sms, keyAddress);
      if (res.hash) {
        spinner.succeed(
          `Secret found for address ${keyAddress} (hash: ${res.hash})`,
          {
            raw: Object.assign(res, { isKnownAddress: true }),
          },
        );
      } else {
        spinner.succeed(`No secret found for address ${keyAddress}`, {
          raw: Object.assign(res, { isKnownAddress: false }),
        });
      }
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
