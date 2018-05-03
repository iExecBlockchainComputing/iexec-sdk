const Debug = require('debug');
const cli = require('commander');
const fetch = require('node-fetch');
const semver = require('semver');
const isDocker = require('is-docker');
const { Spinner, handleError } = require('./cli-helper');
const packageJSON = require('../package.json');

const debug = Debug('iexec:upgrade');
const NODEJS_UPGRADE_CMD = 'npm -g i iexec';
const DOCKER_UPGRADE_CMD = 'docker pull iexechub/iexec-sdk';
cli.parse(process.argv);

async function upgrade() {
  const spinner = Spinner();
  try {
    spinner.start('updating the iExec SDK...');

    const { versions } = await fetch('https://registry.npmjs.org/iexec').then(res => res.json());
    const latestVersion = Object.keys(versions)[
      Object.keys(versions).length - 1
    ];
    debug('latestVersion', latestVersion);
    const currentVersion = packageJSON.version;
    debug('currentVersion', currentVersion);
    const isOutdated = semver.gt(latestVersion, currentVersion);

    if (isOutdated) {
      const upgradeCMD = isDocker() ? DOCKER_UPGRADE_CMD : NODEJS_UPGRADE_CMD;
      spinner.info(`SDK update available ${currentVersion} →  ${latestVersion}, Run "${upgradeCMD}" to update\n`);
      throw Error('You need the latest version of the iExec SDK before starting the project upgrade');
    }
    spinner.succeed(`You have the latest version of iExec SDK → ${currentVersion}`);

    spinner.start(`upgrading iExec project ${__dirname}...`);
    spinner.succeed(`iExec project ${__dirname} upgrade successfull`);
  } catch (error) {
    handleError(error, 'upgrade', spinner);
  }
}

module.exports = upgrade;
