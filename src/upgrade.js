const Debug = require('debug');
const Promise = require('bluebird');
const { exec } = require('child_process');
const cli = require('commander');
const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const oraOptions = require('./oraOptions');


cli.parse(process.argv);

async function upgrade() {
  const spinner = ora(oraOptions);
  try {
    spinner.start(`upgrading iExec project...`);

    spinner.succeed(`"${dirName}" folder created, your new iexec project is inside`);
  } catch (error) {
    spinner.fail(`"iexec upgrade" failed with ${error}`);
    throw error;
  }
}

module.exports = upgrade;
