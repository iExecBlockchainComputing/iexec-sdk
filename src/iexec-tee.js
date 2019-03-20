#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
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
const { isEmptyDir } = require('./fs');
const { Keystore } = require('./keystore');

const debug = Debug('iexec:iexec-tee');

const DOCKER_IMAGE = 'iexechub/xxxx@sha256:xxxx';

const teeFolderName = 'tee';
const secretsFolderName = '.tee-secrets';
const datasetSecretsFolderName = 'dataset';
const beneficiarySecretsFolderName = 'beneficiary';
const originalDatasetFolderName = 'original-dataset';
const encryptedDatasetFolderName = 'encrypted-dataset';
const encryptedResultsFolderName = 'encrypted-results';
const decryptedResultsFolderName = 'decrypted-results';

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

const createTEEPaths = (cmd = {}) => {
  const datasetSecretsFolderPath = path.join(
    process.cwd(),
    secretsFolderName,
    datasetSecretsFolderName,
  );
  const beneficiarySecretsFolderPath = path.join(
    process.cwd(),
    secretsFolderName,
    beneficiarySecretsFolderName,
  );
  const originalDatasetFolderPath = path.join(
    process.cwd(),
    teeFolderName,
    originalDatasetFolderName,
  );
  const encryptedDatasetFolderPath = path.join(
    process.cwd(),
    teeFolderName,
    encryptedDatasetFolderName,
  );
  const encryptedResultsFolderPath = path.join(
    process.cwd(),
    teeFolderName,
    encryptedResultsFolderName,
  );
  const decryptedResultsFolderPath = path.join(
    process.cwd(),
    teeFolderName,
    decryptedResultsFolderName,
  );

  const paths = {
    datasetSecretsFolderPath,
    beneficiarySecretsFolderPath,
    originalDatasetFolderPath,
    encryptedDatasetFolderPath,
    encryptedResultsFolderPath,
    decryptedResultsFolderPath,
  };
  debug('paths', paths);
  return paths;
};

const init = cli.command('init');
addGlobalOptions(init);
init.description(desc.teeInit()).action(async (cmd) => {
  const spinner = Spinner(cmd);
  try {
    spinner.start('creating TEE folder tree structure');
    const {
      datasetSecretsFolderPath,
      beneficiarySecretsFolderPath,
      originalDatasetFolderPath,
      encryptedDatasetFolderPath,
      encryptedResultsFolderPath,
      decryptedResultsFolderPath,
    } = createTEEPaths();
    await Promise.all([
      fs.ensureDir(datasetSecretsFolderPath),
      fs.ensureDir(beneficiarySecretsFolderPath),
      fs.ensureDir(originalDatasetFolderPath),
      fs.ensureDir(encryptedDatasetFolderPath),
      fs.ensureDir(encryptedResultsFolderPath),
      fs.ensureDir(decryptedResultsFolderPath),
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
          `Input folder ${originalDatasetFolderPath} is empty, nothing to encrypt`,
        );
      }
      if (!isDatasetSecretsFolderEmpty && !cmd.force) {
        await prompt.dirNotEmpty(datasetSecretsFolderPath);
      }

      spinner.start(`Encrypting dataset from ${originalDatasetFolderPath}`);

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
        `Dataset encrypted in ${encryptedDatasetFolderPath}, you can publish the encrypted file\ndecryption key in ${datasetSecretsFolderPath}, make sure to backup this file`,
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
generateKeys
  .option(...option.force())
  .description(desc.generateKeys())
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      const { beneficiarySecretsFolderPath } = createTEEPaths(cmd);

      const isSecretsFolderEmpty = await isEmptyDir(
        beneficiarySecretsFolderPath,
      );
      if (!isSecretsFolderEmpty && !cmd.force) {
        await prompt.dirNotEmpty(beneficiarySecretsFolderPath);
      }

      spinner.start('Generating new beneficiary keys');

      await spawnAsync('docker', [
        'run',
        '-t',
        '--rm',
        '-v',
        `${beneficiarySecretsFolderPath}:/key`,
        '--entrypoint',
        'sh',
        DOCKER_IMAGE,
        'generate_key.sh',
      ]);

      spinner.succeed(
        `Beneficiary keys pair generated in ${beneficiarySecretsFolderPath}, make sure to backup this key pair\nRun "iexec tee push-secret --beneficiary" to publish your public key for result encryption`,
        {
          raw: {
            secretPath: beneficiarySecretsFolderPath,
          },
        },
      );
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const decryptResults = cli.command('decrypt-results');
addGlobalOptions(decryptResults);
decryptResults
  .option(...option.force())
  .description(desc.decryptResults())
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      const {
        beneficiarySecretsFolderPath,
        encryptedResultsFolderPath,
        decryptedResultsFolderPath,
      } = createTEEPaths(cmd);

      const [
        isBeneficiarySecretsFolderEmpty,
        isEncryptedResultsFolderEmpty,
        isDecryptedResultsFolderEmpty,
      ] = await Promise.all([
        isEmptyDir(beneficiarySecretsFolderPath),
        isEmptyDir(encryptedResultsFolderPath),
        isEmptyDir(decryptedResultsFolderPath),
      ]);

      if (isBeneficiarySecretsFolderEmpty) {
        throw Error(
          `Missing beneficiary key in ${beneficiarySecretsFolderPath}`,
        );
      }
      if (isEncryptedResultsFolderEmpty) {
        throw Error(
          `Input folder ${encryptedResultsFolderPath} is empty, nothing to decrypt`,
        );
      }
      if (!isDecryptedResultsFolderEmpty && !cmd.force) {
        await prompt.dirNotEmpty(decryptedResultsFolderPath);
      }

      spinner.start('Decrypting results');

      await spawnAsync('docker', [
        'run',
        '-t',
        '--rm',
        '-v',
        `${beneficiarySecretsFolderPath}:/privatekey`,
        '-v',
        `${encryptedResultsFolderPath}:/encrypted_results`,
        '-v',
        `${decryptedResultsFolderPath}:/decrypted_results`,
        '--entrypoint',
        'sh',
        DOCKER_IMAGE,
        'decrypt_results.sh',
      ]);

      spinner.succeed(
        `Results successfully decrypted in ${decryptedResultsFolderPath}`,
        {
          raw: {
            resultsPath: decryptedResultsFolderPath,
          },
        },
      );
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
