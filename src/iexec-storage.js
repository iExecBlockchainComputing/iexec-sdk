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
  prompt,
  Spinner,
} = require('./cli-helper');
const { loadChain } = require('./chains.js');
const secretMgtServ = require('./sms.js');
const resultProxyServ = require('./result-proxy.js');
const { getStorageTokenKeyName } = require('./secrets-utils');
const { Keystore } = require('./keystore');

const debug = Debug('iexec:iexec-storage');

const initStorage = cli.command('init [provider]');
addGlobalOptions(initStorage);
addWalletLoadOptions(initStorage);
initStorage
  .option(...option.forceUpdateSecret())
  .option(...option.storageToken())
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
      const smsURL = sms;
      const resultProxyURL = resultProxy;
      if (!smsURL) throw Error(`Missing sms in "chain.json" for chain ${chain.id}`);
      if (!resultProxyURL) {
        throw Error(
          `Missing resultProxy in "chain.json" for chain ${chain.id}`,
        );
      }
      const providerName = provider || 'default';
      const tokenKeyName = getStorageTokenKeyName(providerName);

      const tokenExists = await secretMgtServ.checkWeb2SecretExists(
        contracts,
        smsURL,
        address,
        tokenKeyName,
      );
      if (tokenExists && !cmd.forceUpdate) {
        throw Error(
          `${providerName} storage is already initialized, use ${
            option.forceUpdateSecret()[0]
          } option to update your storage token`,
        );
      }

      let token;
      if (providerName === 'default') {
        await keystore.load();
        token = await resultProxyServ.login(contracts, resultProxyURL);
      } else {
        token = cmd.token
          || (await prompt.password(`Paste your ${provider} token`, {
            useMask: true,
          }));
        await keystore.load();
      }
      const {
        isPushed,
        isUpdated,
      } = await secretMgtServ.pushWeb2Secret(
        contracts,
        smsURL,
        tokenKeyName,
        token,
        { forceUpdate: !!cmd.forceUpdate },
      );
      if (isPushed) {
        spinner.info(
          `${providerName} storage token ${isUpdated ? 'updated' : 'pushed'}`,
        );
      } else {
        throw Error('Something went wrong');
      }
      spinner.succeed('Storage initialized', {
        raw: { isInitilized: isPushed, isUpdated },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const checkStorage = cli.command('check [provider]');
addGlobalOptions(checkStorage);
addWalletLoadOptions(checkStorage);
checkStorage
  .option(...option.user())
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
      const { contracts, sms } = chain;
      const smsURL = sms;
      if (!smsURL) throw Error(`Missing sms in "chain.json" for chain ${chain.id}`);
      const providerName = provider || 'default';
      const tokenKeyName = getStorageTokenKeyName(providerName);
      const userAdress = cmd.user || address;
      spinner.info(
        `checking ${providerName} storage token for user ${userAdress}`,
      );
      const tokenExists = await secretMgtServ.checkWeb2SecretExists(
        contracts,
        smsURL,
        userAdress,
        tokenKeyName,
      );
      if (tokenExists) {
        spinner.succeed('Storage already initialized', {
          raw: { isInitilized: true },
        });
      } else {
        spinner.succeed('Storage not initialized', {
          raw: { isInitilized: false },
        });
      }
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
