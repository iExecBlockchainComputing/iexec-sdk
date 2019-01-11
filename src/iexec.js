#!/usr/bin/env node

const cli = require('commander');
const Debug = require('debug');
require('babel-polyfill');
const checkForUpdate = require('update-check-es5');
const isDocker = require('is-docker');
const {
  addGlobalOptions,
  addWalletCreateOptions,
  computeWalletCreateOptions,
  handleError,
  help,
  Spinner,
  info,
  pretty,
  desc,
  option,
} = require('./cli-helper');
const { initIExecConf, initChainConf, saveAccountConf } = require('./fs');
const { Keystore, createAndSave } = require('./keystore');
const account = require('./account');
const { loadChain } = require('./chains');
const { decodeJWTForPrint } = require('./utils');
const packageJSON = require('../package.json');
const packagelockJSON = require('../package-lock.json');

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

  const init = cli.command('init');
  addGlobalOptions(init);
  addWalletCreateOptions(init);
  init
    .option(...option.force())
    .description(desc.initObj('project'))
    .action(async (cmd) => {
      const spinner = Spinner(cmd);
      try {
        const force = cmd.force || cmd.raw;
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

        const walletOptions = await computeWalletCreateOptions(cmd);
        const walletRes = await createAndSave(
          Object.assign({}, { force }, walletOptions),
        );
        spinner.info(
          `Your wallet address is ${walletRes.address} wallet saved in "${
            walletRes.fileName
          }" you must backup this file safely :\n${pretty(walletRes.wallet)}`,
        );

        walletOptions.walletAddress = walletRes.address;
        const keystore = Keystore(walletOptions);
        const [chain, keys] = await Promise.all([
          loadChain('ropsten', keystore, { spinner }),
          keystore.load({ lowercase: true }),
        ]);

        spinner.start(info.logging());
        const jwtoken = await account.auth(
          keys.address,
          chain.iexec,
          chain.ethjs,
        );
        spinner.stop();

        const accountfileName = await saveAccountConf(
          { jwtoken },
          { force: true },
        );
        const jwtForPrint = decodeJWTForPrint(jwtoken);
        spinner.info(
          `You are logged into iExec. Login token saved into "${accountfileName}":${pretty(
            jwtForPrint,
          )}`,
        );

        const raw = Object.assign(
          {},
          walletRes && { walletAddress: walletRes.address },
          walletRes && { walletFile: walletRes.fileName },
          fileName && { configFile: fileName },
          chainRes && { chainConfigFile: chainRes.fileName },
        );
        spinner.succeed('iExec project is ready\n', {
          raw,
        });
      } catch (error) {
        handleError(error, cli, cmd);
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

  cli.command('task', 'manage iExec tasks');

  cli.command('deal', 'manage iExec deals');

  cli.command('sgx', 'interact with Intel SGX');

  // cli.command('registry', 'interact with iExec registry');

  const infoCmd = cli.command('info');
  addGlobalOptions(infoCmd);
  infoCmd
    .option(...option.chain())
    .option(...option.hub())
    .description(desc.info())
    .action(async (cmd) => {
      const spinner = Spinner(cmd);
      try {
        const chain = await loadChain(
          cmd.chain,
          Keystore({ isSigner: false }),
          { spinner },
        );
        const hubAddress = cmd.hub || chain.hub;

        spinner.start(info.checking('iExec contracts info'));

        const [
          rlcAddress,
          clerkAddress,
          appRegistryAddress,
          datasetRegistryAddress,
          workerpoolRegistryAddress,
        ] = await Promise.all([
          chain.contracts.fetchRLCAddress({
            hub: hubAddress,
          }),
          chain.contracts.fetchClerkAddress({
            hub: hubAddress,
          }),
          chain.contracts.fetchAppRegistryAddress({
            hub: hubAddress,
          }),
          chain.contracts.fetchDatasetRegistryAddress({
            hub: hubAddress,
          }),
          chain.contracts.fetchWorkerpoolRegistryAddress({
            hub: hubAddress,
          }),
        ]);

        const pocoVersion = packagelockJSON
          && packagelockJSON.dependencies
          && packagelockJSON.dependencies['iexec-poco']
          && packagelockJSON.dependencies['iexec-poco'].version;

        const iexecAddresses = {
          'iExec PoCo version': pocoVersion,
          'hub address': hubAddress || chain.contracts.hubAddress,
          'RLC ERC20 address': rlcAddress,
          'clerk address': clerkAddress,
          'app registry address': appRegistryAddress,
          'dataset registry address': datasetRegistryAddress,
          'workerpool registry address': workerpoolRegistryAddress,
        };
        spinner.succeed(`iExec contracts addresses:${pretty(iexecAddresses)}`, {
          raw: {
            pocoVersion,
            hubAddress: hubAddress || chain.contracts.hubAddress,
            rlcAddress,
            appRegistryAddress,
            datasetRegistryAddress,
            workerpoolRegistryAddress,
          },
        });
      } catch (error) {
        handleError(error, cli, cmd);
      }
    });

  help(cli);
}

main();
