#!/usr/bin/env node

const Debug = require('debug');
const Promise = require('bluebird');
const { exec } = require('child_process');
const cli = require('commander');
const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const oraOptions = require('./oraOptions');

const execAsync = Promise.promisify(exec);
const debug = Debug('iexec:iexec-init');

const IEXEC_GITHUB = 'https://github.com/iExecBlockchainComputing/';
const SAMPLES_REPO = 'iexec-dapp-samples.git';

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

    process.chdir(dirName);
    await execAsync('npm i');
    spinner.succeed(`"${dirName}" folder created, your new iexec project is inside`);
  } catch (error) {
    spinner.fail(`"iexec init" failed with ${error}`);
  }
}
init();
