#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const {
  help,
  addGlobalOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  checkUpdate,
  handleError,
  desc,
  option,
  Spinner,
} = require('./cli-helper');
const { loadChain } = require('./chains.js');
const secretMgtServ = require('./sms.js');
const resultProxyServ = require('./result-proxy.js');
const { Keystore } = require('./keystore');

const debug = Debug('iexec:iexec-storage');

const initStorage = cli.command('init [provider]');
addGlobalOptions(initStorage);
addWalletLoadOptions(initStorage);
initStorage
  .option(...option.force())
  .description(desc.initStorage())
  .action(async (provider, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [chain, [address]] = await Promise.all([
        loadChain(cmd.chain, keystore, { spinner }),
        keystore.accounts(),
      ]);
      const { contracts, sms, resultProxy } = chain;
      const smsURL = sms || 'http://localhost:15000';
      const resultProxyURL = resultProxy || 'http://localhost:18089';
      if (!smsURL) throw Error(`Missing sms in "chain.json" for chain ${chain.id}`);
      if (!resultProxyURL) {
        throw Error(
          `Missing resultProxy in "chain.json" for chain ${chain.id}`,
        );
      }
      // init default storage
      await (async () => {
        const alreadyInitialized = await secretMgtServ.checkWeb2SecretExists(
          contracts,
          smsURL,
          address,
          secretMgtServ.reservedSecretKeyName.IEXEC_RESULT_IEXEC_IPFS_TOKEN,
        );
        if (alreadyInitialized) {
          spinner.info('Default storage already initialized');
          return true;
        }
        await keystore.load();
        const token = await resultProxyServ.login(contracts, resultProxyURL);
        debug('token', token);
        const isPushed = await secretMgtServ.pushWeb2Secret(
          contracts,
          smsURL,
          secretMgtServ.reservedSecretKeyName.IEXEC_RESULT_IEXEC_IPFS_TOKEN,
          token,
        );
        if (isPushed) {
          spinner.info('Default storage initialized');
          return true;
        }
        throw Error('Something went wrong');
      })();
      spinner.succeed('Storage initialized', {
        raw: {},
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
