#!/usr/bin/env node

const cli = require('commander');
const packageJSON = require('../../../package.json');
const { getChainDefaults } = require('../../common/utils/config');
const { wrapCall } = require('../../common/utils/errorWrappers');
const {
  addGlobalOptions,
  addWalletCreateOptions,
  computeWalletCreateOptions,
  checkUpdate,
  handleError,
  finalizeCli,
  Spinner,
  info,
  pretty,
  desc,
  option,
} = require('../utils/cli-helper');
const { initIExecConf, initChainConf } = require('../utils/fs');
const { createAndSave } = require('../utils/keystore');
const { loadChain } = require('../utils/chains');
const { APP, DATASET, WORKERPOOL } = require('../../common/utils/constant');

cli.description(packageJSON.description).version(packageJSON.version);
cli.name('iexec').usage('[command] [options]');

async function main() {
  const init = cli.command('init');
  addGlobalOptions(init);
  addWalletCreateOptions(init);
  init
    .option(...option.force())
    .option(...option.skipWallet())
    .description(desc.initObj('project'))
    .action(async (opts) => {
      await checkUpdate(opts);
      const spinner = Spinner(opts);
      try {
        const force = opts.force || opts.raw;
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

        let walletRes;
        if (!opts.skipWallet) {
          spinner.info('Creating your wallet file');
          const walletOptions = await computeWalletCreateOptions(opts);
          walletRes = await createAndSave({ force, ...walletOptions });
          spinner.info(
            `Your wallet address is ${
              walletRes.address
            } Wallet file saved in "${
              walletRes.fileName
            }" you must backup this file safely :\n${pretty(walletRes.wallet)}`,
          );
          spinner.warn('You must backup your wallet file in a safe place!');
        }

        const raw = {
          ...(walletRes && { walletAddress: walletRes.address }),
          ...(walletRes && { walletFile: walletRes.fileName }),
          ...(fileName && { configFile: fileName }),
          ...(chainRes && { chainConfigFile: chainRes.fileName }),
        };
        spinner.succeed('iExec project is ready\n', {
          raw,
        });
      } catch (error) {
        handleError(error, cli, opts);
      }
    });

  cli.command('wallet', 'manage local ethereum wallet');

  cli.command('account', 'manage iExec account');

  cli.command('app', 'manage iExec apps');

  cli.command('dataset', 'manage iExec datasets');

  cli.command('workerpool', 'manage iExec workerpools');

  cli.command('requester', 'commands for the requester');

  cli.command('order', 'manage iExec marketplace orders');

  cli.command('orderbook', 'show marketplace orderbook');

  cli.command('deal', 'manage iExec deals');

  cli.command('task', 'manage iExec tasks');

  cli.command('storage', 'manage remote storage');

  cli.command('result', 'manage results encryption');

  cli.command('ens', 'manage ENS names');

  cli.command('category', 'manage iExec categories');

  cli.command('registry', 'interact with iExec registry');

  const infoCmd = cli.command('info');
  addGlobalOptions(infoCmd);
  infoCmd
    .option(...option.chain())
    .description(desc.info())
    .action(async (opts) => {
      await checkUpdate(opts);
      const spinner = Spinner(opts);
      try {
        const chain = await loadChain(opts.chain, { spinner });

        const host =
          chain.host ===
          getChainDefaults({ id: chain.id, flavour: chain.flavour }).host
            ? 'default'
            : chain.host;
        spinner.info(`Ethereum host: ${host}`);

        spinner.start(info.checking('iExec contracts info'));

        const useNative = !!chain.contracts.isNative;
        const { flavour } = chain.contracts;
        const rlcAddress = useNative
          ? undefined
          : await wrapCall(chain.contracts.fetchTokenAddress());
        const [
          appRegistryAddress,
          datasetRegistryAddress,
          workerpoolRegistryAddress,
        ] = await Promise.all([
          wrapCall(chain.contracts.fetchRegistryAddress(APP)),
          wrapCall(chain.contracts.fetchRegistryAddress(DATASET)),
          wrapCall(chain.contracts.fetchRegistryAddress(WORKERPOOL)),
        ]);
        const { pocoVersion } = chain.contracts;

        const iexecAddresses = {
          'iExec PoCo version': `${pocoVersion} ${flavour}`,
          ...((useNative && {
            'native RLC': true,
          }) || { 'RLC ERC20 address': rlcAddress }),
          'iExec contract address': chain.contracts.hubAddress,
          'app registry address': appRegistryAddress,
          'dataset registry address': datasetRegistryAddress,
          'workerpool registry address': workerpoolRegistryAddress,
        };
        spinner.succeed(`iExec contracts addresses:${pretty(iexecAddresses)}`, {
          raw: {
            pocoVersion,
            host,
            hubAddress: chain.contracts.hubAddress,
            rlcAddress,
            appRegistryAddress,
            datasetRegistryAddress,
            workerpoolRegistryAddress,
            useNative,
            flavour,
          },
        });
      } catch (error) {
        handleError(error, cli, opts);
      }
    });

  finalizeCli(cli);
}

main();
