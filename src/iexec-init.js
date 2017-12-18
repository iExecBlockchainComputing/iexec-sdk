#!/usr/bin/env node

const Debug = require('debug');
const Promise = require('bluebird');
const { exec } = require('child_process');
const cli = require('commander');
const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const oraOptions = require('./oraOptions');
const packageJSON = require('../package.json');

const execAsync = Promise.promisify(exec);
const debug = Debug('iexec:iexec-init');
const readFileAsync = Promise.promisify(fs.readFile);
const openAsync = Promise.promisify(fs.open);
const writeAsync = Promise.promisify(fs.write);

const IEXEC_GITHUB = 'https://github.com/iExecBlockchainComputing/';
const SAMPLES_REPO = 'iexec-dapp-samples.git';
const TRUFFLE_FILE_NAME = 'truffle.js';

cli.parse(process.argv);

async function init() {
  const spinner = ora(oraOptions);
  try {
    const branchName = cli.args.length ? cli.args[0] : 'init';
    debug(`pulling ${branchName}...`);
    spinner.start(`pulling ${branchName}...`);
    const dirName = 'iexec-'.concat(branchName);

    await execAsync(`git clone --depth=1 -b ${branchName} ${IEXEC_GITHUB}${SAMPLES_REPO} ${dirName}`);
    await fs.remove(path.join(process.cwd(), dirName, '.git'));
    const truffleConfig = await readFileAsync(path.join(__dirname, TRUFFLE_FILE_NAME), 'utf8');

    const trufflePath = path.join(process.cwd(), dirName, TRUFFLE_FILE_NAME);
    const fd = await openAsync(trufflePath, 'wx').catch(() => undefined);
    if (fd !== undefined) {
      debug('writing new file');
      await writeAsync(fd, truffleConfig, 0, 'utf8');
      fs.close(fd);
    }

    process.chdir(dirName);
    debug('running', `npm i iexec-oracle-contract@${packageJSON.dependencies['iexec-oracle-contract']}`);
    await execAsync(`npm i iexec-oracle-contract@${packageJSON.dependencies['iexec-oracle-contract']}`);
    await execAsync('npm i');
    spinner.succeed(`"${dirName}" folder created, your new iexec project is inside`);
  } catch (error) {
    spinner.fail(`"iexec init" failed with ${error}`);
  }
}
init();
