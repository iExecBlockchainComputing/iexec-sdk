#!/usr/bin/env node

const Debug = require('debug');
const JSZip = require('jszip');
const cli = require('commander');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
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
  info,
  prompt,
} = require('./cli-helper');
const { loadChain } = require('./chains.js');
const tee = require('./tee.js');
const { isEmptyDir, saveTextToFile } = require('./fs');
const { Keystore } = require('./keystore');

const debug = Debug('iexec:iexec-tee');

const DOCKER_IMAGE = 'iexechub/xxxx@sha256:xxxx';

const teeFolderName = 'tee';
const secretsFolderName = '.tee-secrets';
const datasetSecretsFolderName = 'dataset';
const beneficiarySecretsFolderName = 'beneficiary';
const originalDatasetFolderName = 'original-dataset';
const encryptedDatasetFolderName = 'encrypted-dataset';
const DEFAULT_ENCRYPTED_RESULTS_NAME = 'encryptedResults.zip';
const DEFAULT_DECRYPTED_RESULTS_NAME = 'results.zip';

const spawnAsync = (bin, args) => new Promise((resolve, reject) => {
  debug('spawnAsync bin', bin);
  debug('spawnAsync args', args);
  let errorMessage = '';
  const proc = args ? spawn(bin, args) : spawn(bin);

  proc.stdout.on('data', data => console.log(`${data}`));
  proc.stderr.on('data', (data) => {
    errorMessage = errorMessage.concat('\n', data);
    debug('errorMessage', errorMessage);
    console.log(`${data}`);
  });

  proc.on('close', (code) => {
    if (code !== 0) reject(errorMessage || 'process errored');
    resolve();
  });

  proc.on('exit', (code) => {
    if (code !== 0) reject(errorMessage || 'process errored');
    resolve();
  });

  proc.on('error', () => reject(errorMessage || 'process errored'));
});

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

const AES_ALGO = 'aes-128-cbc';
const decipherAES = (secret, iv) => createDecipheriv(AES_ALGO, secret, iv);

const createTEEPaths = (cmd = {}) => {
  const datasetSecretsFolderPath = cmd.datasetKeystoredir
    || path.join(process.cwd(), secretsFolderName, datasetSecretsFolderName);
  const beneficiarySecretsFolderPath = cmd.beneficiaryKeystoredir
    || path.join(process.cwd(), secretsFolderName, beneficiarySecretsFolderName);
  const originalDatasetFolderPath = cmd.originalDatasetDir
    || path.join(process.cwd(), teeFolderName, originalDatasetFolderName);
  const encryptedDatasetFolderPath = cmd.encryptedDatasetDir
    || path.join(process.cwd(), teeFolderName, encryptedDatasetFolderName);

  const paths = {
    datasetSecretsFolderPath,
    beneficiarySecretsFolderPath,
    originalDatasetFolderPath,
    encryptedDatasetFolderPath,
  };
  debug('paths', paths);
  return paths;
};

const init = cli.command('init');
addGlobalOptions(init);
init
  .option(...option.datasetKeystoredir())
  .option(...option.beneficiaryKeystoredir())
  .option(...option.originalDatasetDir())
  .option(...option.encryptedDatasetDir())
  .description(desc.teeInit())
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      spinner.start('creating TEE folder tree structure');
      const {
        datasetSecretsFolderPath,
        beneficiarySecretsFolderPath,
        originalDatasetFolderPath,
        encryptedDatasetFolderPath,
      } = createTEEPaths();
      await Promise.all([
        fs.ensureDir(datasetSecretsFolderPath),
        fs.ensureDir(beneficiarySecretsFolderPath),
        fs.ensureDir(originalDatasetFolderPath),
        fs.ensureDir(encryptedDatasetFolderPath),
      ]);
      spinner.succeed(info.teeInit());
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const encryptDataset = cli.command('encrypt-dataset');
addGlobalOptions(encryptDataset);
encryptDataset
  .option(...option.force())
  .option(...option.datasetKeystoredir())
  .option(...option.originalDatasetDir())
  .option(...option.encryptedDatasetDir())
  .description(desc.encryptDataset())
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      const {
        datasetSecretsFolderPath,
        originalDatasetFolderPath,
        encryptedDatasetFolderPath,
      } = createTEEPaths(cmd);

      const [
        isDatasetSecretsFolderEmpty,
        isDatasetFolderEmpty,
      ] = await Promise.all([
        isEmptyDir(datasetSecretsFolderPath),
        isEmptyDir(originalDatasetFolderPath),
      ]);
      if (isDatasetFolderEmpty) {
        throw Error(
          `Input folder "${originalDatasetFolderPath}" is empty, nothing to encrypt`,
        );
      }
      if (!isDatasetSecretsFolderEmpty && !cmd.force) {
        await prompt.dirNotEmpty(datasetSecretsFolderPath);
      }

      spinner.start(`Encrypting dataset from "${originalDatasetFolderPath}"`);

      await spawnAsync('docker', [
        'run',
        '-t',
        '--rm',
        '-v',
        `${originalDatasetFolderPath}:/data`,
        '-v',
        `${encryptedDatasetFolderPath}:/data_sgx_ready`,
        '-v',
        `${datasetSecretsFolderPath}:/conf/keytag`,
        '--entrypoint',
        'sh',
        DOCKER_IMAGE,
        'dataset_encrypt.sh',
      ]);

      spinner.succeed(
        `Dataset encrypted in "${encryptedDatasetFolderPath}", you can publish the encrypted file.\nDecryption key stored in ${datasetSecretsFolderPath}, make sure to backup this file.\nOnce your dataset is published run "iexec tee push-secret --dataset <datasetAddress>" to securely share the decryption key with workers.`,
        {
          raw: {
            encryptedDatasetFolderPath,
            secretPath: datasetSecretsFolderPath,
          },
        },
      );
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const generateKeys = cli.command('generate-beneficiary-keys');
addGlobalOptions(generateKeys);
addWalletLoadOptions(generateKeys);
generateKeys
  .option(...option.force())
  .option(...option.beneficiaryKeystoredir())
  .description(desc.generateKeys())
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(
        Object.assign(walletOptions, { isSigner: false }),
      );
      const [address] = await keystore.accounts();

      const { beneficiarySecretsFolderPath } = createTEEPaths(cmd);

      spinner.info(`Generate beneficiary keys for wallet address ${address}`);
      spinner.start('Generating new beneficiary keys');

      const { privateKey, publicKey } = await new Promise((resolve, reject) => {
        generateKeyPair(
          'rsa',
          {
            modulusLength: 2048,
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
      const priKeyFileName = `${address}_key`;
      const pubKeyFileName = `${address}_key.pub`;
      await saveTextToFile(priKeyFileName, privateKey, {
        force: cmd.force,
        fileDir: beneficiarySecretsFolderPath,
      });
      await saveTextToFile(pubKeyFileName, publicKey, {
        force: cmd.force,
        fileDir: beneficiarySecretsFolderPath,
      });

      spinner.succeed(
        `Beneficiary keys pair "${priKeyFileName}" and "${pubKeyFileName}" generated in "${beneficiarySecretsFolderPath}", make sure to backup this key pair\nRun "iexec tee push-secret --beneficiary" to securely share your public key for result encryption`,
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

const decryptResults = cli.command('decrypt-results [encryptedResultsPath]');
addGlobalOptions(decryptResults);
decryptResults
  .option(...option.force())
  .option(...option.beneficiaryKeystoredir())
  .option(...option.beneficiaryKeyFile())
  .description(desc.decryptResults())
  .action(async (encryptedResultsPath, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const { beneficiarySecretsFolderPath } = createTEEPaths(cmd);

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
          `${address}_key`,
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

      spinner.start('Decrypting results');
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

      try {
        const tempResultsPath = path.join(process.cwd(), 'encryptedTemp');
        await extractFileFromZip(
          zip,
          `${rootFolder}/${encResultsFile}`,
          tempResultsPath,
        );
        const ivStream = fs.createReadStream(tempResultsPath, { end: 15 });
        const iv = await streamToBuffer(ivStream);
        debug('iv', iv);
        const encryptedResultsStream = fs.createReadStream(tempResultsPath, {
          start: 16,
        });
        await encryptedResultsStream
          .pipe(decipherAES(resultsKey, iv))
          .pipe(fs.createWriteStream(outputFile));
        try {
          await fs.remove(tempResultsPath);
        } catch (e) {
          debug(e);
        }
      } catch (error) {
        debug(error);
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

const pushSecret = cli.command('push-secret [secret]');
addGlobalOptions(pushSecret);
addWalletLoadOptions(pushSecret);
pushSecret
  .option(...option.chain())
  .option(...option.pushBeneficiarySecret())
  .option(...option.pushAppSecret())
  .option(...option.pushDatasetSecret())
  .option(...option.secretPath())
  .description(desc.pushSecret())
  .action(async (secret, cmd) => {
    const spinner = Spinner(cmd);
    try {
      debug('app', cmd.app);
      debug('dataset', cmd.dataset);
      if (
        (cmd.beneficary && cmd.app)
        || (cmd.beneficary && cmd.dataset)
        || (cmd.app && cmd.dataset)
      ) {
        throw Error(
          `Only one option is allowed (${option.pushBeneficiarySecret()[0]} | ${
            option.pushAppSecret()[0]
          } | ${option.pushDatasetSecret()[0]})`,
        );
      }

      if (!secret && !cmd.secretPath) {
        throw Error(
          'Missing argument secret or option secret-path <secretPath>',
        );
      }
      const secretToPush = secret || (await fs.readFile(cmd.secretPath, 'utf8')).trim();
      debug('secretToPush', secretToPush);

      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(Object.assign(walletOptions));
      const chain = await loadChain(cmd.chain, keystore, {
        spinner,
      });

      const { address } = await keystore.load();
      debug('address', address);
      const resourceAddress = cmd.app || cmd.dataset || address;
      debug('resourceAddress', resourceAddress);

      const { contracts, sms } = chain;
      if (!sms) throw Error(`Missing sms in chains.json for chain ${chain.id}`);
      const res = await tee.pushSecret(
        contracts,
        sms,
        address,
        resourceAddress,
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
      const keystore = Keystore(Object.assign(walletOptions));
      const chain = await loadChain(cmd.chain, keystore, {
        spinner,
      });
      const keyAddress = address || (await keystore.load()).address;
      const { sms } = chain;
      if (!sms) throw Error(`Missing sms in chains.json for chain ${chain.id}`);
      const res = await tee.checkSecret(sms, keyAddress);
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
