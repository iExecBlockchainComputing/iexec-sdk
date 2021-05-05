#!/usr/bin/env node

const cli = require('commander');
const secretMgtServ = require('../../common/modules/sms');
const resultProxyServ = require('../../common/modules/result-proxy');
const { getStorageTokenKeyName } = require('../../common/utils/secrets-utils');
const {
  finalizeCli,
  addGlobalOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  checkUpdate,
  handleError,
  desc,
  option,
  prompt,
  Spinner,
  getPropertyFormChain,
} = require('../utils/cli-helper');
const { loadChain, connectKeystore } = require('../utils/chains');
const { Keystore } = require('../utils/keystore');

cli.name('iexec storage').usage('<command> [options]');

const initStorage = cli.command('init [provider]');
addGlobalOptions(initStorage);
addWalletLoadOptions(initStorage);
initStorage
  .option(...option.chain())
  .option(...option.forceUpdateSecret())
  .option(...option.storageToken())
  .description(desc.initStorage())
  .action(async (provider, opts, cmd) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore(walletOptions);
      const [chain, [address]] = await Promise.all([
        loadChain(opts.chain, { spinner }),
        keystore.accounts(),
      ]);
      const { contracts } = chain;
      const smsURL = getPropertyFormChain(chain, 'sms');
      const resultProxyURL = getPropertyFormChain(chain, 'resultProxy');

      const providerName = provider || 'default';
      const tokenKeyName = getStorageTokenKeyName(providerName);

      const tokenExists = await secretMgtServ.checkWeb2SecretExists(
        contracts,
        smsURL,
        address,
        tokenKeyName,
      );
      if (tokenExists && !opts.forceUpdate) {
        throw Error(
          `${providerName} storage is already initialized, use ${
            option.forceUpdateSecret()[0]
          } option to update your storage token`,
        );
      }

      let token;
      if (providerName === 'default') {
        await connectKeystore(chain, keystore);
        token = await resultProxyServ.login(contracts, resultProxyURL);
      } else {
        token = opts.token
          || (await prompt.password(`Paste your ${provider} token`, {
            useMask: true,
          }));
        await connectKeystore(chain, keystore);
      }
      const {
        isPushed,
        isUpdated,
      } = await secretMgtServ.pushWeb2Secret(
        contracts,
        smsURL,
        tokenKeyName,
        token,
        { forceUpdate: !!opts.forceUpdate },
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
      handleError(error, cli, opts);
    }
  });

const checkStorage = cli.command('check [provider]');
addGlobalOptions(checkStorage);
addWalletLoadOptions(checkStorage);
checkStorage
  .option(...option.chain())
  .option(...option.user())
  .description(desc.checkStorage())
  .action(async (provider, opts, cmd) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore(walletOptions);
      const [chain, [address]] = await Promise.all([
        loadChain(opts.chain, { spinner }),
        keystore.accounts(),
      ]);
      const { contracts } = chain;
      const smsURL = getPropertyFormChain(chain, 'sms');
      const providerName = provider || 'default';
      const tokenKeyName = getStorageTokenKeyName(providerName);
      const userAdress = opts.user || address;
      spinner.info(
        `Checking ${providerName} storage token for user ${userAdress}`,
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
      handleError(error, cli, opts);
    }
  });

finalizeCli(cli);
