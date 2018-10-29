#!/usr/bin/env node

const cli = require('commander');
const Debug = require('debug');
require('babel-polyfill');
const checkForUpdate = require('update-check-es5');
const isDocker = require('is-docker');
const {
  handleError,
  help,
  Spinner,
  info,
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
  const update = await checkForUpdate(packageJSON, { interval: 10 }).catch(
    debug,
  );

  if (update) {
    const upgradeCMD = isDocker() ? DOCKER_UPGRADE_CMD : NODEJS_UPGRADE_CMD;
    const spin = Spinner();
    spin.info(
      `iExec SDK update available ${packageJSON.version} →  ${
        update.latest
      }, Run "${upgradeCMD}" to update\n`,
    );
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
          spinner.info(
            `Here is your main config "${fileName}":${pretty(saved)}`,
          );
        }

        const chainRes = await initChainConf({ force, strict: false });
        if (chainRes.fileName) {
          spinner.info(
            `Here is your chain config "${chainRes.fileName}":${pretty(
              chainRes.saved,
            )}`,
          );
        }

        const walletRes = await keystore.createAndSave({
          force,
          strict: false,
        });
        if (walletRes.fileName) {
          spinner.info(
            `wallet saved in "${walletRes.fileName}":\n${pretty(
              walletRes.wallet,
            )}`,
          );
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
        spinner.succeed(
          `You are logged into iExec. Login token saved into "${accountfileName}":${pretty(
            jwtForPrint,
          )}`,
        );

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

  cli.command('tee', 'interact with Trusted Execution Environment');

  cli.command('registry', 'interact with iExec registry');

  cli
    .command('info')
    .option(...option.chain())
    .option(...option.hub())
    .description(desc.info())
    .action(async (cmd) => {
      const spinner = Spinner();
      try {
        const chain = await loadChain(cmd.chain);
        const hubAddress = cmd.hub || chain.hub;

        spinner.start(info.checking('iExec contracts info'));

        const [
          rlcAddress,
          marketplaceAddress,
          appHubAddress,
          datasetHubAddress,
          workerPoolHubAddress,
        ] = await Promise.all([
          chain.contracts.fetchRLCAddress({
            hub: hubAddress,
          }),
          chain.contracts.fetchMarketplaceAddress({
            hub: hubAddress,
          }),
          chain.contracts.fetchAppHubAddress({
            hub: hubAddress,
          }),
          chain.contracts.fetchDatasetHubAddress({
            hub: hubAddress,
          }),
          chain.contracts.fetchWorkerPoolHubAddress({
            hub: hubAddress,
          }),
        ]);

        const iexecAddresses = {
          'hub address': hubAddress || chain.contracts.hubAddress,
          'RLC ERC20 address': rlcAddress,
          'marketplace address': marketplaceAddress,
          'app hub address': appHubAddress,
          'dataset hub address': datasetHubAddress,
          'workerPool hub address': workerPoolHubAddress,
        };
        spinner.succeed(`iExec contracts addresses:${pretty(iexecAddresses)}`);
      } catch (error) {
        handleError(error, cli);
      }
    });

  help(cli);
}

main();
