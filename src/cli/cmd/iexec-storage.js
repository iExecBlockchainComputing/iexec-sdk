#!/usr/bin/env node

import { program as cli } from 'commander';
import { checkWeb2SecretExists } from '../../common/sms/check.js';
import { pushWeb2Secret } from '../../common/sms/push.js';
import { login as resultProxyLogin } from '../../common/storage/result-proxy.js';
import { getStorageTokenKeyName } from '../../common/utils/secrets-utils.js';
import {
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
  getPropertyFromChain,
} from '../utils/cli-helper.js';
import { loadChain, connectKeystore } from '../utils/chains.js';
import { Keystore } from '../utils/keystore.js';

cli.name('iexec storage').usage('<command> [options]');

const initStorage = cli.command('init [provider]');
addGlobalOptions(initStorage);
addWalletLoadOptions(initStorage);
initStorage
  .option(...option.chain())
  .option(...option.forceUpdateSecret())
  .option(...option.storageToken())
  .description(desc.initStorage())
  .action(async (provider, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = computeWalletLoadOptions(opts);
      const keystore = Keystore(walletOptions);
      const [chain, [address]] = await Promise.all([
        loadChain(opts.chain, { spinner }),
        keystore.accounts(),
      ]);
      const { contracts } = chain;
      const smsURL = getPropertyFromChain(chain, 'sms');
      const resultProxyURL = getPropertyFromChain(chain, 'resultProxy');
      const providerName = provider || 'default';
      const tokenKeyName = getStorageTokenKeyName(providerName);
      const tokenExists = await checkWeb2SecretExists(
        contracts,
        smsURL,
        address,
        tokenKeyName,
      );
      if (tokenExists && !opts.forceUpdate) {
        throw new Error(
          `${providerName} storage is already initialized, use ${
            option.forceUpdateSecret()[0]
          } option to update your storage token`,
        );
      }

      let token;
      if (providerName === 'default') {
        await connectKeystore(chain, keystore);
        token = await resultProxyLogin(contracts, resultProxyURL);
      } else {
        token =
          opts.token ||
          (await prompt.password(`Paste your ${provider} token`, {
            useMask: true,
          }));
        await connectKeystore(chain, keystore);
      }
      const { isPushed, isUpdated } = await pushWeb2Secret(
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
        throw new Error('Something went wrong');
      }
      spinner.succeed('Storage initialized', {
        raw: { isInitialized: isPushed, isUpdated },
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
  .action(async (provider, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = computeWalletLoadOptions(opts);
      const keystore = Keystore(walletOptions);
      const [chain, [address]] = await Promise.all([
        loadChain(opts.chain, { spinner }),
        keystore.accounts(),
      ]);
      const { contracts } = chain;
      const smsURL = getPropertyFromChain(chain, 'sms');
      const providerName = provider || 'default';
      const tokenKeyName = getStorageTokenKeyName(providerName);
      const userAddress = opts.user || address;
      spinner.info(
        `Checking ${providerName} storage token for user ${userAddress}`,
      );
      const tokenExists = await checkWeb2SecretExists(
        contracts,
        smsURL,
        userAddress,
        tokenKeyName,
      );
      if (tokenExists) {
        spinner.succeed('Storage already initialized', {
          raw: { isInitialized: true },
        });
      } else {
        spinner.succeed('Storage NOT initialized', {
          raw: { isInitialized: false },
        });
      }
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

finalizeCli(cli);
