#!/usr/bin/env node

const cli = require('commander');
const {
  addGlobalOptions,
  addWalletCreateOptions,
  computeWalletCreateOptions,
  checkUpdate,
  handleError,
  help,
  Spinner,
  info,
  pretty,
  desc,
  option,
} = require('./cli-helper');
const { initIExecConf, initChainConf } = require('./fs');
const { Keystore, createAndSave } = require('./keystore');
const { loadChain } = require('./chains');
const { getChainDefaults } = require('./config');
const { addressSchema } = require('./validator');
const { wrapCall } = require('./errorWrappers');
const packageJSON = require('../package.json');

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
    .action(async (cmd) => {
      await checkUpdate(cmd);
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

        let walletRes;
        if (!cmd.skipWallet) {
          spinner.info('Creating your wallet file');
          const walletOptions = await computeWalletCreateOptions(cmd);
          walletRes = await createAndSave(
            Object.assign({}, { force }, walletOptions),
          );
          spinner.info(
            `Your wallet address is ${
              walletRes.address
            } Wallet file saved in "${
              walletRes.fileName
            }" you must backup this file safely :\n${pretty(walletRes.wallet)}`,
          );
          spinner.warn('You must backup your wallet file in a safe place!');
        }

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

  cli.command('app', 'manage iExec apps');

  cli.command('dataset', 'manage iExec datasets');

  cli.command('workerpool', 'manage iExec workerpools');

  cli.command('category', 'manage iExec categories');

  cli.command('order', 'manage iExec marketplace orders');

  cli.command('orderbook', 'show marketplace orderbook');

  cli.command('deal', 'manage iExec deals');

  cli.command('task', 'manage iExec tasks');

  cli.command('result', 'manage results encryption');

  cli.command('storage', 'manage remote storage');

  cli.command('registry', 'interact with iExec registry');

  const infoCmd = cli.command('info');
  addGlobalOptions(infoCmd);
  infoCmd
    .option(...option.chain())
    .description(desc.info())
    .action(async (cmd) => {
      await checkUpdate(cmd);
      const spinner = Spinner(cmd);
      try {
        const chain = await loadChain(
          cmd.chain,
          Keystore({ isSigner: false }),
          { spinner },
        );

        const host = chain.host === getChainDefaults(chain.id).host
          ? 'default'
          : chain.host;
        spinner.info(`Ethereum host: ${host}`);

        spinner.start(info.checking('iExec contracts info'));
        const hubAddress = await addressSchema({
          ethProvider: chain.contracts.jsonRpcProvider,
        }).validate(chain.hub || (await chain.contracts.fetchIExecAddress()));
        const useNative = !!chain.contracts.isNative;
        const rlcAddress = useNative
          ? undefined
          : await wrapCall(
            chain.contracts.fetchRLCAddress({
              hub: hubAddress,
            }),
          );
        const [
          appRegistryAddress,
          datasetRegistryAddress,
          workerpoolRegistryAddress,
        ] = await Promise.all([
          wrapCall(
            chain.contracts.fetchAppRegistryAddress({
              hub: hubAddress,
            }),
          ),
          wrapCall(
            chain.contracts.fetchDatasetRegistryAddress({
              hub: hubAddress,
            }),
          ),
          wrapCall(
            chain.contracts.fetchWorkerpoolRegistryAddress({
              hub: hubAddress,
            }),
          ),
        ]);
        const { pocoVersion } = chain.contracts;

        const iexecAddresses = {
          'iExec PoCo version': pocoVersion,
          ...((useNative && {
            'native RLC': true,
          }) || { 'RLC ERC20 address': rlcAddress }),
          'iExec contract address': hubAddress || chain.contracts.hubAddress,
          'app registry address': appRegistryAddress,
          'dataset registry address': datasetRegistryAddress,
          'workerpool registry address': workerpoolRegistryAddress,
        };
        spinner.succeed(`iExec contracts addresses:${pretty(iexecAddresses)}`, {
          raw: {
            pocoVersion,
            host,
            hubAddress: hubAddress || chain.contracts.hubAddress,
            rlcAddress,
            appRegistryAddress,
            datasetRegistryAddress,
            workerpoolRegistryAddress,
            useNative,
          },
        });
      } catch (error) {
        handleError(error, cli, cmd);
      }
    });

  help(cli);
}

main();
