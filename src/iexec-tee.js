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
} = require('./cli-helper');
const { loadChain } = require('./chains.js');
const tee = require('./tee.js');
const { isEthAddress } = require('./utils');
const { Keystore } = require('./keystore');

const debug = Debug('iexec:iexec-tee');

const teeFolderName = 'tee';
const keysFolderName = 'keys';
const inputsFolderName = 'inputs';
const encryptedOutputsFolderName = 'encryptedOutputs';
const outputsFolderName = 'outputs';

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
  const keysPath = cmd.keysFolderPath
    || path.join(process.cwd(), teeFolderName, keysFolderName);
  const inputsPath = cmd.inputsFolderPath
    || path.join(process.cwd(), teeFolderName, inputsFolderName);
  const encryptedOutputsPath = cmd.encryptedOutputsFolder
    || path.join(process.cwd(), teeFolderName, encryptedOutputsFolderName);
  const decryptedOutputPath = cmd.outputsFolderPath
    || path.join(process.cwd(), teeFolderName, outputsFolderName);
  const paths = {
    keysPath,
    inputsPath,
    encryptedOutputsPath,
    decryptedOutputPath,
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
      keysPath,
      inputsPath,
      encryptedOutputsPath,
      decryptedOutputPath,
    } = createTEEPaths();
    await Promise.all([
      fs.ensureDir(keysPath),
      fs.ensureDir(inputsPath),
      fs.ensureDir(encryptedOutputsPath),
      fs.ensureDir(decryptedOutputPath),
    ]);

    spinner.succeed(info.teeInit());
  } catch (error) {
    handleError(error, cli, cmd);
  }
});

const encryptedpush = cli.command('encryptedpush');
addGlobalOptions(encryptedpush);
encryptedpush
  .option(...option.chain())
  .option(...option.keysFolderPath())
  .option(...option.inputsFolderPath())
  .option(...option.application())
  .option(...option.secretManagementService())
  .option(...option.remoteFileSystem())
  .description(desc.encryptedpush())
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      if (!cmd.application) throw Error('missing --application option');

      const chain = await loadChain(cmd.chain, Keystore({ isSigner: false }), {
        spinner,
      });

      const { keysPath, inputsPath } = createTEEPaths(cmd);
      spinner.start(`encrypting data from ${inputsPath} and uploading`);

      let appName = cmd.application;
      if (isEthAddress(cmd.application)) {
        const appObj = await chain.contracts.getObjProps('app')(
          cmd.application,
        );
        const appParams = JSON.parse(appObj.m_appParams);
        debug('appParams', appParams);
        const [fieldName, fieldValue] = appParams.envvars
          .split(' ')
          .find(e => e.includes('XWDOCKERIMAGE'))
          .split('=');
        debug('fieldName', fieldName);
        debug('fieldValue', fieldValue);
        appName = fieldValue;
        debug('appName', appName);
      }

      const secretManagementService = [
        '--secretManagementService',
        cmd.secretManagementService,
      ];
      const remoteFileSystem = ['--remoteFileSystem', cmd.remoteFileSystem];

      await spawnAsync('docker', [
        'run',
        '-t',
        '--rm',
        '-v',
        `${keysPath}:/conf`,
        '-v',
        `${inputsPath}:/inputs`,
        'iexechub/sgx-scone:cli',
        'encryptedpush',
        '--application',
        appName,
        ...(cmd.secretManagementService ? secretManagementService : []),
        ...(cmd.remoteFileSystem ? remoteFileSystem : []),
      ]);
      spinner.succeed('data encrypted and uploaded');
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const decrypt = cli.command('decrypt');
addGlobalOptions(decrypt);
decrypt
  .option(...option.keysFolderPath())
  .option(...option.encryptedOutputsFolder())
  .option(...option.outputsFolderPath())
  .description(desc.decrypt())
  .action(async (cmd) => {
    try {
      debug('cmd', cmd);
      const spinner = Spinner(cmd);

      const {
        keysPath,
        encryptedOutputsPath,
        decryptedOutputPath,
      } = createTEEPaths(cmd);

      spinner.start('decrypting');
      await spawnAsync('docker', [
        'run',
        '-t',
        '--rm',
        '-v',
        `${keysPath}:/conf`,
        '-v',
        `${encryptedOutputsPath}:/encryptedOutputs`,
        '-v',
        `${decryptedOutputPath}:/decryptedOutputs`,
        'iexechub/sgx-scone:cli',
        'decrypt',
      ]);
      spinner.succeed(`data decrypted in folder ${decryptedOutputPath}`, {
        raw: decryptedOutputPath,
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
