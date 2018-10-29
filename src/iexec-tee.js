#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const {
  help,
  handleError,
  desc,
  option,
  Spinner,
  info,
} = require('./cli-helper');
const { loadChain } = require('./chains.js');
const { isEthAddress } = require('./utils');

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

const createSGXPaths = (cmd = {}) => {
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

cli
  .command('init')
  .description(desc.teeInit())
  .action(async () => {
    try {
      const spinner = Spinner();
      spinner.start('creating TEE folder tree structure');
      const {
        keysPath,
        inputsPath,
        encryptedOutputsPath,
        decryptedOutputPath,
      } = createSGXPaths();
      await Promise.all([
        fs.ensureDir(keysPath),
        fs.ensureDir(inputsPath),
        fs.ensureDir(encryptedOutputsPath),
        fs.ensureDir(decryptedOutputPath),
      ]);

      spinner.succeed(info.teeInit());
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command('encryptedpush')
  .option(...option.chain())
  .option(...option.keysFolderPath())
  .option(...option.inputsFolderPath())
  .option(...option.application())
  .option(...option.secretManagementService())
  .option(...option.remoteFileSystem())
  .description(desc.encryptedpush())
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      if (!cmd.application) throw Error('missing --application option');

      const chain = await loadChain(cmd.chain);

      const { keysPath, inputsPath } = createSGXPaths(cmd);
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

      await spawnAsync('docker', [
        'pull',
        'iexechub/sgx-scone:cli',
      ]);

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
      handleError(error, cli);
    }
  });

cli
  .command('decrypt')
  .option(...option.keysFolderPath())
  .option(...option.encryptedOutputsFolder())
  .option(...option.outputsFolderPath())
  .description(desc.decrypt())
  .action(async (cmd) => {
    try {
      debug('cmd', cmd);
      const spinner = Spinner();

      const {
        keysPath,
        encryptedOutputsPath,
        decryptedOutputPath,
      } = createSGXPaths(cmd);

      spinner.start('decrypting');

      await spawnAsync('docker', [
        'pull',
        'iexechub/sgx-scone:cli',
      ]);

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
      spinner.succeed(`data decrypted in folder ${decryptedOutputPath}`);
    } catch (error) {
      handleError(error, cli);
    }
  });

help(cli);
