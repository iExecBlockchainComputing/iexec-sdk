#!/usr/bin/env node

import { program as cli } from 'commander';
import { checkBalances } from '../../common/wallet/balance.js';
import {
  sendETH as walletSendETH,
  sendRLC as walletSendRLC,
  sweep as walletSweep,
} from '../../common/wallet/send.js';
import {
  bridgeToSidechain as walletBridgeToSidechain,
  bridgeToMainchain as walletBridgeToMainchain,
} from '../../common/wallet/bridge.js';
import {
  wrapEnterpriseRLC as walletWrapEnterpriseRLC,
  unwrapEnterpriseRLC as walletUnwrapEnterpriseRLC,
} from '../../common/wallet/enterprise.js';
import {
  Keystore,
  createAndSave,
  importPrivateKeyAndSave,
} from '../utils/keystore.js';
import { formatEth, formatRLC } from '../../common/utils/utils.js';
import { NULL_ADDRESS } from '../../common/utils/constant.js';
import {
  nRlcAmountSchema,
  weiAmountSchema,
} from '../../common/utils/validator.js';
import {
  addGlobalOptions,
  addWalletCreateOptions,
  computeWalletCreateOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  computeTxOptions,
  checkUpdate,
  handleError,
  finalizeCli,
  Spinner,
  option,
  desc,
  prompt,
  pretty,
  info,
  getPropertyFormChain,
} from '../utils/cli-helper.js';
import { loadChain, connectKeystore } from '../utils/chains.js';
import { lookupAddress } from '../../common/ens/resolution.js';
import { ConfigurationError } from '../../common/utils/errors.js';

const objName = 'wallet';

cli.name('iexec wallet').usage('<command> [options]');

const create = cli.command('create');
addGlobalOptions(create);
addWalletCreateOptions(create);
create
  .option(...option.forceCreate())
  .description(desc.createWallet())
  .action(async (opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const force = opts.force || false;
      const walletOptions = await computeWalletCreateOptions(opts);
      const res = await createAndSave({ force, ...walletOptions });
      spinner.succeed(
        `Your wallet address is ${res.address}\nWallet saved in "${
          res.fileName
        }":\n${pretty(res.wallet)}`,
        { raw: res },
      );
      spinner.warn('You must backup your wallet file in a safe place!');
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const importPk = cli.command('import <privateKey>');
addGlobalOptions(importPk);
addWalletCreateOptions(importPk);
importPk
  .option(...option.forceCreate())
  .description(desc.importWallet())
  .action(async (privateKey, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const force = opts.force || false;
      const walletOptions = await computeWalletCreateOptions(opts);
      const res = await importPrivateKeyAndSave(privateKey, {
        force,
        ...walletOptions,
      });
      spinner.succeed(
        `Your wallet address is ${res.address}\nWallet saved in "${
          res.fileName
        }":\n${pretty(res.wallet)}`,
        { raw: res },
      );
      spinner.warn('You must backup your wallet file in a safe place!');
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const show = cli.command('show [address]');
addGlobalOptions(show);
addWalletLoadOptions(show);
show
  .option(...option.chain())
  .option(...option.showPrivateKey())
  .description(desc.showObj(objName, 'address'))
  .action(async (address, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);

    const walletOptions = await computeWalletLoadOptions(opts);
    const keystore = Keystore({
      ...walletOptions,
      ...((address || !opts.showPrivateKey) && { isSigner: false }),
    });

    let userWallet;
    let userWalletAddress;
    let displayedWallet;
    try {
      if (!address) {
        if (opts.showPrivateKey) {
          userWallet = await keystore.load();
          userWalletAddress = userWallet.address;
          displayedWallet = {
            ...(opts.showPrivateKey
              ? { privateKey: userWallet.privateKey }
              : {}),
            publicKey: userWallet.publicKey,
            address: userWallet.address,
          };
          // show user wallet
          spinner.info(`Wallet file:${pretty(displayedWallet)}`);
        } else {
          try {
            [userWalletAddress] = await keystore.accounts();
            if (userWalletAddress && userWalletAddress !== NULL_ADDRESS) {
              spinner.info(`Current wallet address ${userWalletAddress}`);
              displayedWallet = { address: userWalletAddress };
            } else {
              throw Error('Wallet file not found');
            }
          } catch (error) {
            throw Error(
              `Failed to load wallet address from keystore: ${error.message}`,
            );
          }
        }
      }

      if (!userWalletAddress && !address)
        throw Error('Missing address or wallet');

      const chain = await loadChain(opts.chain, { spinner });
      // show address balance
      const addressToShow = address || userWalletAddress;
      spinner.start(info.checkBalance(''));
      const [balances, ens] = await Promise.all([
        checkBalances(chain.contracts, addressToShow),
        lookupAddress(chain.contracts, addressToShow).catch((e) => {
          if (e instanceof ConfigurationError) {
            /** no ENS */
          } else {
            throw e;
          }
        }),
      ]);
      if (ens) {
        spinner.info(`ENS: ${ens}`);
      }
      const displayBalances = {
        ether: chain.contracts.isNative ? undefined : formatEth(balances.wei),
        RLC: formatRLC(balances.nRLC),
      };
      spinner.succeed(
        `Wallet balances [${chain.id}]:${pretty(displayBalances)}`,
        {
          raw: {
            balance: {
              ...displayBalances,
              nRLC: balances.nRLC.toString(),
              wei: chain.contracts.isNative
                ? undefined
                : balances.wei.toString(),
            },
            ...(!address && displayedWallet && { wallet: displayedWallet }),
            ens,
          },
        },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const sendETH = cli.command('send-ether <amount> [unit]').alias('sendETH'); // DEPRECATED senETH
addGlobalOptions(sendETH);
addWalletLoadOptions(sendETH);
sendETH
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .option(...option.force())
  .option(...option.to())
  .description(desc.sendETH())
  .action(async (amount, unit, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const weiAmount = await weiAmountSchema({
        defaultUnit: 'ether',
      }).validate([amount, unit]);
      const walletOptions = await computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const [[address], chain] = await Promise.all([
        keystore.accounts(),
        loadChain(opts.chain, { txOptions, spinner }),
      ]);
      await connectKeystore(chain, keystore, { txOptions });
      if (!opts.to) throw Error('Missing --to option');
      if (!opts.force) {
        await prompt.transferETH(
          formatEth(weiAmount),
          chain.name,
          opts.to,
          chain.id,
        );
      }
      const message = `${formatEth(weiAmount)} ${
        chain.name
      } ether from ${address} to ${opts.to}`;
      spinner.start(`Sending ${message}...`);
      const txHash = await walletSendETH(chain.contracts, weiAmount, opts.to);
      spinner.succeed(`Sent ${message}\n`, {
        raw: {
          amount: weiAmount,
          from: address,
          to: opts.to,
          txHash,
        },
      });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const sendRLC = cli.command('send-RLC <amount> [unit]');
addGlobalOptions(sendRLC);
addWalletLoadOptions(sendRLC);
sendRLC
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .option(...option.force())
  .option(...option.to())
  .description(desc.sendRLC())
  .action(async (amount, unit, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const nRlcAmount = await nRlcAmountSchema({
        defaultUnit: 'RLC',
      }).validate([amount, unit]);
      const walletOptions = await computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const [[address], chain] = await Promise.all([
        keystore.accounts(),
        loadChain(opts.chain, { txOptions, spinner }),
      ]);
      if (!opts.to) throw Error('Missing --to option');
      await connectKeystore(chain, keystore, { txOptions });
      if (!opts.force) {
        await prompt.transferRLC(
          formatRLC(nRlcAmount),
          chain.name,
          opts.to,
          chain.id,
        );
      }
      const message = `${formatRLC(nRlcAmount)} ${
        chain.name
      } RLC from ${address} to ${opts.to}`;
      spinner.start(`Sending ${message}...`);

      const txHash = await walletSendRLC(chain.contracts, nRlcAmount, opts.to);

      spinner.succeed(`Sent ${message}\n`, {
        raw: {
          amount: nRlcAmount,
          from: address,
          to: opts.to,
          txHash,
        },
      });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const sweep = cli.command('sweep');
addGlobalOptions(sweep);
addWalletLoadOptions(sweep);
sweep
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .option(...option.force())
  .option(...option.to())
  .description(desc.sweep())
  .action(async (opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const [[address], chain] = await Promise.all([
        keystore.accounts(),
        loadChain(opts.chain, { txOptions, spinner }),
      ]);
      await connectKeystore(chain, keystore, { txOptions });
      if (!opts.to) throw Error('Missing --to option');
      if (!opts.force) {
        await prompt.sweep(chain.contracts.isNative ? 'RLC' : 'ether and RLC')(
          chain.name,
          opts.to,
          chain.id,
        );
      }
      spinner.start('Sweeping wallet...');
      const { sendNativeTxHash, sendERC20TxHash, errors } = await walletSweep(
        chain.contracts,
        opts.to,
      );
      spinner.succeed(
        `Wallet swept from ${address} to ${opts.to}\n${
          errors ? `Errors: ${errors}` : ''
        }`,
        {
          raw: {
            from: address,
            to: opts.to,
            sendNativeTxHash,
            sendERC20TxHash,
            errors,
          },
        },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const bridgeToSidechain = cli.command('bridge-to-sidechain <amount> [unit]');
addGlobalOptions(bridgeToSidechain);
addWalletLoadOptions(bridgeToSidechain);
bridgeToSidechain
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .option(...option.force())
  .description(desc.bridgeToSidechain())
  .action(async (amount, unit, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const nRlcAmount = await nRlcAmountSchema().validate([amount, unit]);
      const walletOptions = await computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const [[address], chain] = await Promise.all([
        keystore.accounts(),
        loadChain(opts.chain, { txOptions, spinner }),
      ]);
      await connectKeystore(chain, keystore, { txOptions });
      if (chain.contracts.isNative)
        throw Error('Cannot bridge sidechain to sidechain');
      const bridgeConf = getPropertyFormChain(chain, 'bridge');
      const bridgeAddress = bridgeConf && bridgeConf.contract;
      const bridgedChainId = bridgeConf && bridgeConf.bridgedChainId;
      if (!bridgeAddress) {
        throw Error(
          `Missing bridge contract address in "chain.json" for chain ${chain.name}`,
        );
      }
      if (!bridgedChainId) {
        throw Error(
          `Missing bridge bridgedChainId in "chain.json" for chain ${chain.name}`,
        );
      }
      if (!opts.force) {
        await prompt.transferRLC(
          formatRLC(nRlcAmount),
          chain.name,
          `bridge contract ${bridgeAddress} (please double check the address)`,
          chain.id,
        );
      }
      const bridgedChainConfigured = !!(
        chain.bridgedNetwork &&
        chain.bridgedNetwork.contracts &&
        chain.bridgedNetwork.bridge &&
        chain.bridgedNetwork.bridge.contract
      );
      const message = `${formatRLC(nRlcAmount)} ${
        chain.name
      } RLC to ${bridgeAddress}`;
      spinner.start(`Sending ${message}...`);
      const { sendTxHash, receiveTxHash } = await walletBridgeToSidechain(
        chain.contracts,
        bridgeAddress,
        nRlcAmount,
        {
          sidechainBridgeAddress:
            bridgedChainConfigured && chain.bridgedNetwork.bridge.contract,
          bridgedContracts:
            bridgedChainConfigured && chain.bridgedNetwork.contracts,
        },
      );
      spinner.succeed(
        `Sent ${message} (tx: ${sendTxHash})\n${
          bridgedChainConfigured
            ? `Wallet credited on chain ${bridgedChainId} (tx: ${receiveTxHash})`
            : `Please wait for the agent to credit your wallet on chain ${bridgedChainId}`
        }`,
        {
          raw: {
            amount: nRlcAmount,
            from: address,
            to: bridgeAddress,
            sendTxHash,
            receiveTxHash,
          },
        },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const bridgeToMainchain = cli.command('bridge-to-mainchain <amount> [unit]');
addGlobalOptions(bridgeToMainchain);
addWalletLoadOptions(bridgeToMainchain);
bridgeToMainchain
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .option(...option.force())
  .description(desc.bridgeToMainchain())
  .action(async (amount, unit, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const nRlcAmount = await nRlcAmountSchema().validate([amount, unit]);
      const walletOptions = await computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const [[address], chain] = await Promise.all([
        keystore.accounts(),
        loadChain(opts.chain, { txOptions, spinner }),
      ]);
      await connectKeystore(chain, keystore, { txOptions });
      if (!chain.contracts.isNative)
        throw Error('Cannot bridge mainchain to mainchain');
      const bridgeConf = getPropertyFormChain(chain, 'bridge');
      const bridgeAddress = bridgeConf && bridgeConf.contract;
      const bridgedChainId = bridgeConf && bridgeConf.bridgedChainId;
      if (!bridgeAddress) {
        throw Error(
          `Missing bridge contract address in "chain.json" for chain ${chain.name}`,
        );
      }
      if (!bridgedChainId) {
        throw Error(
          `Missing bridge bridgedChainId in "chain.json" for chain ${chain.name}`,
        );
      }
      if (!opts.force) {
        await prompt.transferRLC(
          formatRLC(nRlcAmount),
          chain.name,
          `bridge contract ${bridgeAddress} (please double check the address)`,
          chain.id,
        );
      }
      const bridgedChainConfigured = !!(
        chain.bridgedNetwork &&
        chain.bridgedNetwork.contracts &&
        chain.bridgedNetwork.bridge &&
        chain.bridgedNetwork.bridge.contract
      );
      const message = `${formatRLC(nRlcAmount)} ${
        chain.name
      } RLC to ${bridgeAddress}`;
      spinner.start(`Sending ${message}...`);
      const { sendTxHash, receiveTxHash } = await walletBridgeToMainchain(
        chain.contracts,
        bridgeAddress,
        nRlcAmount,
        {
          mainchainBridgeAddress:
            bridgedChainConfigured && chain.bridgedNetwork.bridge.contract,
          bridgedContracts:
            bridgedChainConfigured && chain.bridgedNetwork.contracts,
        },
      );
      spinner.succeed(
        `Sent ${message} (tx: ${sendTxHash})\n${
          bridgedChainConfigured
            ? `Wallet credited on chain ${bridgedChainId} (tx: ${receiveTxHash})`
            : `Please wait for the agent to credit your wallet on chain ${bridgedChainId}`
        }`,
        {
          raw: {
            amount: nRlcAmount,
            from: address,
            to: bridgeAddress,
            sendTxHash,
            receiveTxHash,
          },
        },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const wrapEnterpriseRLC = cli.command('swap-RLC-for-eRLC <amount> [unit]');
addGlobalOptions(wrapEnterpriseRLC);
addWalletLoadOptions(wrapEnterpriseRLC);
wrapEnterpriseRLC
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .option(...option.force())
  .description(desc.wrapEnterpriseRLC())
  .action(async (amount, unit, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const nRlcAmount = await nRlcAmountSchema().validate([amount, unit]);
      const walletOptions = await computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const [chain] = await Promise.all([
        loadChain(opts.chain, { txOptions, spinner }),
      ]);
      const hasEnterpriseFlavour =
        chain.enterpriseSwapNetwork && !!chain.enterpriseSwapNetwork.contracts;
      if (!hasEnterpriseFlavour) {
        throw Error(
          `No enterprise smart contracts found on current chain ${chain.id}`,
        );
      }

      const standardContracts =
        chain.contracts.flavour === 'standard'
          ? chain.contracts
          : chain.enterpriseSwapNetwork.contracts;

      const enterpriseContracts =
        chain.contracts.flavour === 'standard'
          ? chain.enterpriseSwapNetwork.contracts
          : chain.contracts;

      await connectKeystore({ contracts: standardContracts }, keystore, {
        txOptions,
      });
      if (!opts.force) {
        await prompt.wrap(formatRLC(nRlcAmount), chain.id);
      }
      const message = `${formatRLC(nRlcAmount)} RLC into eRLC`;
      spinner.start(`Wrapping ${message}...`);

      const txHash = await walletWrapEnterpriseRLC(
        standardContracts,
        enterpriseContracts,
        nRlcAmount,
      );
      spinner.succeed(`Wrapped ${message}\n`, {
        raw: {
          amount: nRlcAmount,
          txHash,
        },
      });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const unwrapEnterpriseRLC = cli.command('swap-eRLC-for-RLC <amount> [unit]');
addGlobalOptions(unwrapEnterpriseRLC);
addWalletLoadOptions(unwrapEnterpriseRLC);
unwrapEnterpriseRLC
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .option(...option.force())
  .description(desc.unwrapEnterpriseRLC())
  .action(async (amount, unit, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const nRlcAmount = await nRlcAmountSchema().validate([amount, unit]);
      const walletOptions = await computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const [chain] = await Promise.all([
        loadChain(opts.chain, { txOptions, spinner }),
      ]);
      const hasEnterpriseFlavour =
        chain.enterpriseSwapNetwork && !!chain.enterpriseSwapNetwork.contracts;
      if (!hasEnterpriseFlavour) {
        throw Error(
          `No enterprise smart contracts found on current chain ${chain.id}`,
        );
      }

      const enterpriseContracts =
        chain.contracts.flavour === 'standard'
          ? chain.enterpriseSwapNetwork.contracts
          : chain.contracts;

      await connectKeystore({ contracts: enterpriseContracts }, keystore, {
        txOptions,
      });
      if (!opts.force) {
        await prompt.unwrap(formatRLC(nRlcAmount), chain.id);
      }
      const message = `${formatRLC(nRlcAmount)} eRLC into RLC`;
      spinner.start(`Unwrapping ${message}...`);

      const txHash = await walletUnwrapEnterpriseRLC(
        enterpriseContracts,
        nRlcAmount,
      );
      spinner.succeed(`Unwrapped ${message}\n`, {
        raw: {
          amount: nRlcAmount,
          txHash,
        },
      });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

// DEPRECATED
const sendNRLC = cli.command('sendRLC <amount> [unit]');
addGlobalOptions(sendNRLC);
addWalletLoadOptions(sendNRLC);
sendNRLC
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .option(...option.force())
  .option(...option.to())
  .description(desc.sendNRLC())
  .action(async (amount, unit, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const nRlcAmount = await nRlcAmountSchema().validate([amount, unit]);
      const walletOptions = await computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const [[address], chain] = await Promise.all([
        keystore.accounts(),
        loadChain(opts.chain, { txOptions, spinner }),
      ]);
      if (!opts.to) throw Error('Missing --to option');
      await connectKeystore(chain, keystore, { txOptions });
      if (!opts.force) {
        await prompt.transferRLC(
          formatRLC(nRlcAmount),
          chain.name,
          opts.to,
          chain.id,
        );
      }
      const message = `${formatRLC(nRlcAmount)} ${
        chain.name
      } RLC from ${address} to ${opts.to}`;
      spinner.start(`Sending ${message}...`);

      const txHash = await walletSendRLC(chain.contracts, nRlcAmount, opts.to);

      spinner.succeed(`Sent ${message}\n`, {
        raw: {
          amount: nRlcAmount,
          from: address,
          to: opts.to,
          txHash,
        },
      });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

finalizeCli(cli);
