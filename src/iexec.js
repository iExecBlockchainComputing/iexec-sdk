#!/usr/bin/env node

const cli = require('commander');
const Debug = require('debug');
const checkForUpdate = require('update-check');
const isDocker = require('is-docker');
const {
  handleError,
  help,
  Spinner,
  pretty,
  desc,
  option,
} = require('./cli-helper');
const { initIExecConf, initChainConf, saveAccountConf } = require('./fs');
const keystore = require('./keystore');
const account = require('./account');
const { loadChain } = require('./chains');
const { decodeJWTForPrint } = require('./utils');
const packageJSON = require('../package.json');

cli.description(packageJSON.description).version(packageJSON.version);
const debug = Debug('iexec');
const NODEJS_UPGRADE_CMD = 'npm -g i iexec';
const DOCKER_UPGRADE_CMD = 'docker pull iexechub/iexec-sdk';

async function main() {
  const update = await checkForUpdate(packageJSON, { interval: 10 }).catch(debug);

  if (update) {
    const upgradeCMD = isDocker() ? DOCKER_UPGRADE_CMD : NODEJS_UPGRADE_CMD;
    const spin = Spinner();
    spin.info(`iExec SDK update available ${packageJSON.version} →  ${
      update.latest
    }, Run "${upgradeCMD}" to update\n`);
  }

  cli
    .command('init')
    .option(...option.force())
    .description(desc.initObj('project'))
    .action(async (cmd) => {
      const spinner = Spinner();
      try {
        const { force } = cmd;
        const { saved, fileName } = await initIExecConf({
          force,
          strict: false,
        });
        if (fileName) {
          spinner.info(`Here is your main config "${fileName}":${pretty(saved)}`);
        }

        const chainRes = await initChainConf({ force, strict: false });
        if (chainRes.fileName) {
          spinner.info(`Here is your chain config "${chainRes.fileName}":${pretty(chainRes.saved)}`);
        }

        const walletRes = await keystore.createAndSave({
          force,
          strict: false,
        });
        if (walletRes.fileName) {
          spinner.info(`wallet saved in "${walletRes.fileName}":\n${pretty(walletRes.wallet)}`);
        }

        const [chain, keys] = await Promise.all([
          loadChain('ropsten'),
          keystore.load({ lowercase: true }),
        ]);
        const jwtoken = await account.auth(
          keys.address,
          chain.iexec,
          chain.ethjs,
        );

        const accountfileName = await saveAccountConf(
          { jwtoken },
          { force: true },
        );
        const jwtForPrint = decodeJWTForPrint(jwtoken);
        spinner.succeed(`You are logged into iExec. Login token saved into "${accountfileName}":${pretty(jwtForPrint)}`);

        spinner.succeed('iExec project is ready\n');
      } catch (error) {
        handleError(error, cli);
      }
    });

  cli.command('wallet', 'manage local ethereum wallet');

  cli.command('account', 'manage iExec account');

  cli.command('scheduler', 'interact with an iExec scheduler');

  cli.command('app', 'manage iExec apps');

  cli.command('dataset', 'manage iExec datasets');

  cli.command('category', 'manage iExec categories');

  cli.command('workerpool', 'manage iExec workerpools');

  cli.command('orderbook', 'show marketplace orderbook');

  cli.command('order', 'manage iExec marketplace orders');

  cli.command('work', 'manage iExec works');

  help(cli);
}

main();
