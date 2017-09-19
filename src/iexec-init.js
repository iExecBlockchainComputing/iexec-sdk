#!/usr/bin/env node

const Debug = require('debug');
const Promise = require('bluebird');
const { exec } = require('child_process');
const cli = require('commander');
const fs = require('fs-extra');
const copy = require('recursive-copy');

const execAsync = Promise.promisify(exec);
const debug = Debug('iexec:iexec-init');

const IEXEC_GITHUB = 'https://github.com/iExecBlockchainComputing/';
const SAMPLES_REPO = 'iexec-dapp-samples.git';
const ORACLE_REPO = 'iexec-oracle.git';

cli.parse(process.argv);

async function init() {
  try {
    const branchName = cli.args.length ? cli.args[0] : 'init';
    console.log(`pulling ${branchName}...`);
    debug('pulling %o...', branchName);

    await execAsync(`git clone --depth=1 -b ${branchName} ${IEXEC_GITHUB}${SAMPLES_REPO} iexec-${branchName}`);
    await fs.remove(`./${branchName}/.git`);

    await execAsync(`git clone --depth=1 ${IEXEC_GITHUB}${ORACLE_REPO} temp`);

    await copy('./temp/contracts', `./${branchName}/contracts`);
    await fs.remove('./temp');
  } catch (error) {
    console.log(`"iexec init" failed with ${error}`);
  }
}
init();
