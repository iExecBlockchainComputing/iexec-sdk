#!/usr/bin/env node

const cli = require('commander');
const wallet = require('../../common/modules/wallet');
const {
  Keystore,
  createAndSave,
  importPrivateKeyAndSave,
} = require('../utils/keystore');
const {
  formatEth,
  formatRLC,
  NULL_ADDRESS,
} = require('../../common/utils/utils');
const {
  nRlcAmountSchema,
  weiAmountSchema,
} = require('../../common/utils/validator');
const {
  addGlobalOptions,
  addWalletCreateOptions,
  computeWalletCreateOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  computeTxOptions,
  checkUpdate,
  handleError,
  help,
  Spinner,
  option,
  desc,
  prompt,
  pretty,
  info,
  getPropertyFormChain,
} = require('../utils/cli-helper');
const { loadChain, connectKeystore } = require('../utils/chains');

const objName = 'wallet';

cli.name('iexec wallet').usage('<command> [options]');

const create = cli.command('create');
addGlobalOptions(create);
addWalletCreateOptions(create);
create
  .option(...option.forceCreate())
  .description(desc.createWallet())
  .action(async (cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const force = cmd.force || false;
      const walletOptions = await computeWalletCreateOptions(cmd);
      const res = await createAndSave({ force, ...walletOptions });
      spinner.succeed(
        `Your wallet address is ${res.address}\nWallet saved in "${
          res.fileName
        }":\n${pretty(res.wallet)}`,
        { raw: res },
      );
      spinner.warn('You must backup your wallet file in a safe place!');
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const importPk = cli.command('import <privateKey>');
addGlobalOptions(importPk);
addWalletCreateOptions(importPk);
importPk
  .option(...option.forceCreate())
  .description(desc.importWallet())
  .action(async (privateKey, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const force = cmd.force || false;
      const walletOptions = await computeWalletCreateOptions(cmd);
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
      handleError(error, cli, cmd);
    }
  });

const show = cli.command('show [address]');
addGlobalOptions(show);
addWalletLoadOptions(show);
show
  .option(...option.chain())
  .option(...option.showPrivateKey())
  .description(desc.showObj(objName, 'address'))
  .action(async (address, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);

    const walletOptions = await computeWalletLoadOptions(cmd);
    const keystore = Keystore({
      ...walletOptions,
      ...((address || !cmd.showPrivateKey) && { isSigner: false }),
    });

    let userWallet;
    let userWalletAddress;
    let displayedWallet;
    try {
      if (!address) {
        if (cmd.showPrivateKey) {
          userWallet = await keystore.load();
          userWalletAddress = userWallet.address;
          displayedWallet = {
            ...(cmd.showPrivateKey
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

      if (!userWalletAddress && !address) throw Error('Missing address or wallet');

      const chain = await loadChain(cmd.chain, { spinner });
      // show address balance
      const addressToShow = address || userWalletAddress;
      spinner.start(info.checkBalance(''));
      const balances = await wallet.checkBalances(
        chain.contracts,
        addressToShow,
      );
      const displayBalances = {
        ether: chain.contracts.isNative ? undefined : formatEth(balances.wei),
        RLC: formatRLC(balances.nRLC),
      };
      spinner.succeed(
        `Wallet ${chain.name} balances [${chain.id}]:${pretty(
          displayBalances,
        )}`,
        {
          raw: {
            balance: {
              ...displayBalances,
              nRLC: balances.nRLC.toString(),
              wei: chain.contracts.isNative
                ? undefined
                : balances.wei.toString(),
              ETH: displayBalances.ether, // for legacy compatibility
            },
            ...(!address && displayedWallet && { wallet: displayedWallet }),
          },
        },
      );
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const getEth = cli.command('getETH');
addGlobalOptions(getEth);
addWalletLoadOptions(getEth);
getEth
  .option(...option.chain())
  .description(desc.getETH())
  .action(async (cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore({ ...walletOptions, isSigner: false });
      const [[address], chain] = await Promise.all([
        keystore.accounts(),
        loadChain(cmd.chain, { spinner }),
      ]);
      spinner.info(`Using wallet ${address}`);
      spinner.start(`Requesting test ether from ${chain.name} faucets...`);
      const faucetsResponses = await wallet.getETH(chain.name, address);
      const responsesString = faucetsResponses.reduce(
        (accu, curr) => accu.concat(
          '- ',
          curr.name,
          ' :',
          curr.response.error
            ? pretty(curr.response, { keysColor: 'red', stringColor: 'red' })
            : pretty(curr.response),
        ),
        '',
      );
      spinner.succeed(`Faucets responses:\n${responsesString}`, {
        raw: { faucetsResponses },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const getRlc = cli.command('getRLC');
addGlobalOptions(getRlc);
addWalletLoadOptions(getRlc);
getRlc
  .option(...option.chain())
  .description(desc.getRLC())
  .action(async (cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore({ ...walletOptions, isSigner: false });
      const [[address], chain] = await Promise.all([
        keystore.accounts(),
        loadChain(cmd.chain, { spinner }),
      ]);
      spinner.info(`Using wallet ${address}`);
      spinner.start(`Requesting ${chain.name} faucet for test RLC...`);
      const faucetsResponses = await wallet.getRLC(chain.name, address);
      const responsesString = faucetsResponses.reduce(
        (accu, curr) => accu.concat(
          '- ',
          curr.name,
          ' :',
          curr.response.error
            ? pretty(curr.response, { keysColor: 'red', stringColor: 'red' })
            : pretty(curr.response),
        ),
        '',
      );
      spinner.succeed(`Faucets responses:\n${responsesString}`, {
        raw: { faucetsResponses },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const sendETH = cli.command('sendETH <amount> [unit]');
addGlobalOptions(sendETH);
addWalletLoadOptions(sendETH);
sendETH
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.force())
  .option(...option.to())
  .description(desc.sendETH())
  .action(async (amount, unit, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const weiAmount = await weiAmountSchema({
        defaultUnit: 'ether',
      }).validate([amount, unit]);
      const walletOptions = await computeWalletLoadOptions(cmd);
      const txOptions = await computeTxOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [[address], chain] = await Promise.all([
        keystore.accounts(),
        loadChain(cmd.chain, { spinner }),
      ]);
      await connectKeystore(chain, keystore, { txOptions });
      if (!cmd.to) throw Error('Missing --to option');
      if (!cmd.force) {
        await prompt.transferETH(
          formatEth(weiAmount),
          chain.name,
          cmd.to,
          chain.id,
        );
      }
      const message = `${formatEth(weiAmount)} ${
        chain.name
      } ether from ${address} to ${cmd.to}`;
      spinner.start(`Sending ${message}...`);
      const txHash = await wallet.sendETH(chain.contracts, weiAmount, cmd.to);
      spinner.succeed(`Sent ${message}\n`, {
        raw: {
          amount,
          from: address,
          to: cmd.to,
          txHash,
        },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const sendRLC = cli.command('sendRLC <amount> [unit]');
addGlobalOptions(sendRLC);
addWalletLoadOptions(sendRLC);
sendRLC
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.force())
  .option(...option.to())
  .description(desc.sendRLC())
  .action(async (amount, unit, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const nRlcAmount = await nRlcAmountSchema().validate([amount, unit]);
      const walletOptions = await computeWalletLoadOptions(cmd);
      const txOptions = await computeTxOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [[address], chain] = await Promise.all([
        keystore.accounts(),
        loadChain(cmd.chain, { spinner }),
      ]);
      if (!cmd.to) throw Error('Missing --to option');
      await connectKeystore(chain, keystore, { txOptions });
      if (!cmd.force) {
        await prompt.transferRLC(
          formatRLC(nRlcAmount),
          chain.name,
          cmd.to,
          chain.id,
        );
      }
      const message = `${formatRLC(nRlcAmount)} ${
        chain.name
      } RLC from ${address} to ${cmd.to}`;
      spinner.start(`Sending ${message}...`);

      const txHash = await wallet.sendRLC(chain.contracts, nRlcAmount, cmd.to);

      spinner.succeed(`Sent ${message}\n`, {
        raw: {
          amount: nRlcAmount,
          from: address,
          to: cmd.to,
          txHash,
        },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const sweep = cli.command('sweep');
addGlobalOptions(sweep);
addWalletLoadOptions(sweep);
sweep
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.force())
  .option(...option.to())
  .description(desc.sweep())
  .action(async (cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const txOptions = await computeTxOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [[address], chain] = await Promise.all([
        keystore.accounts(),
        loadChain(cmd.chain, { spinner }),
      ]);
      await connectKeystore(chain, keystore, { txOptions });
      if (!cmd.to) throw Error('Missing --to option');
      if (!cmd.force) {
        await prompt.sweep(chain.contracts.isNative ? 'RLC' : 'ether and RLC')(
          chain.name,
          cmd.to,
          chain.id,
        );
      }
      spinner.start('Sweeping wallet...');
      const { sendNativeTxHash, sendERC20TxHash, errors } = await wallet.sweep(
        chain.contracts,
        cmd.to,
      );
      spinner.succeed(
        `Wallet swept from ${address} to ${cmd.to}\n${
          errors ? `Errors: ${errors}` : ''
        }`,
        {
          raw: {
            from: address,
            to: cmd.to,
            sendNativeTxHash,
            sendERC20TxHash,
            errors,
          },
        },
      );
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const bridgeToSidechain = cli.command('bridge-to-sidechain <amount> [unit]');
addGlobalOptions(bridgeToSidechain);
addWalletLoadOptions(bridgeToSidechain);
bridgeToSidechain
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.force())
  .description(desc.bridgeToSidechain())
  .action(async (amount, unit, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const nRlcAmount = await nRlcAmountSchema().validate([amount, unit]);
      const walletOptions = await computeWalletLoadOptions(cmd);
      const txOptions = await computeTxOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [[address], chain] = await Promise.all([
        keystore.accounts(),
        loadChain(cmd.chain, { spinner }),
      ]);
      await connectKeystore(chain, keystore, { txOptions });
      if (chain.contracts.isNative) throw Error('Cannot bridge sidechain to sidechain');
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
      if (!cmd.force) {
        await prompt.transferRLC(
          formatRLC(nRlcAmount),
          chain.name,
          `bridge contract ${bridgeAddress} (please double check the address)`,
          chain.id,
        );
      }
      const bridgedChainConfigured = !!(
        chain.bridgedNetwork
        && chain.bridgedNetwork.contracts
        && chain.bridgedNetwork.bridge
        && chain.bridgedNetwork.bridge.contract
      );
      const message = `${formatRLC(nRlcAmount)} ${
        chain.name
      } RLC to ${bridgeAddress}`;
      spinner.start(`Sending ${message}...`);
      const { sendTxHash, receiveTxHash } = await wallet.bridgeToSidechain(
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
      handleError(error, cli, cmd);
    }
  });

const bridgeToMainchain = cli.command('bridge-to-mainchain <amount> [unit]');
addGlobalOptions(bridgeToMainchain);
addWalletLoadOptions(bridgeToMainchain);
bridgeToMainchain
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.force())
  .description(desc.bridgeToMainchain())
  .action(async (amount, unit, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const nRlcAmount = await nRlcAmountSchema().validate([amount, unit]);
      const walletOptions = await computeWalletLoadOptions(cmd);
      const txOptions = await computeTxOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [[address], chain] = await Promise.all([
        keystore.accounts(),
        loadChain(cmd.chain, { spinner }),
      ]);
      await connectKeystore(chain, keystore, { txOptions });
      if (!chain.contracts.isNative) throw Error('Cannot bridge mainchain to mainchain');
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
      if (!cmd.force) {
        await prompt.transferRLC(
          formatRLC(nRlcAmount),
          chain.name,
          `bridge contract ${bridgeAddress} (please double check the address)`,
          chain.id,
        );
      }
      const bridgedChainConfigured = !!(
        chain.bridgedNetwork
        && chain.bridgedNetwork.contracts
        && chain.bridgedNetwork.bridge
        && chain.bridgedNetwork.bridge.contract
      );
      const message = `${formatRLC(nRlcAmount)} ${
        chain.name
      } RLC to ${bridgeAddress}`;
      spinner.start(`Sending ${message}...`);
      const { sendTxHash, receiveTxHash } = await wallet.bridgeToMainchain(
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
      handleError(error, cli, cmd);
    }
  });

const wrapEnterpriseRLC = cli.command('swap-RLC-for-eRLC <amount> [unit]');
addGlobalOptions(wrapEnterpriseRLC);
addWalletLoadOptions(wrapEnterpriseRLC);
wrapEnterpriseRLC
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.force())
  .description(desc.wrapEnterpriseRLC())
  .action(async (amount, unit, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const nRlcAmount = await nRlcAmountSchema().validate([amount, unit]);
      const walletOptions = await computeWalletLoadOptions(cmd);
      const txOptions = await computeTxOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [chain] = await Promise.all([loadChain(cmd.chain, { spinner })]);
      const hasEnterpriseFlavour = chain.enterpriseSwapNetwork && !!chain.enterpriseSwapNetwork.contracts;
      if (!hasEnterpriseFlavour) {
        throw Error(
          `No enterprise smart contracts found on current chain ${chain.id}`,
        );
      }

      const standardContracts = chain.contracts.flavour === 'standard'
        ? chain.contracts
        : chain.enterpriseSwapNetwork.contracts;

      const enterpriseContracts = chain.contracts.flavour === 'standard'
        ? chain.enterpriseSwapNetwork.contracts
        : chain.contracts;

      await connectKeystore({ contracts: standardContracts }, keystore, {
        txOptions,
      });
      if (!cmd.force) {
        await prompt.wrap(formatRLC(nRlcAmount), chain.id);
      }
      const message = `${formatRLC(nRlcAmount)} RLC into eRLC`;
      spinner.start(`Wrapping ${message}...`);

      const txHash = await wallet.wrapEnterpriseRLC(
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
      handleError(error, cli, cmd);
    }
  });

const unwrapEnterpriseRLC = cli.command('swap-eRLC-for-RLC <amount> [unit]');
addGlobalOptions(unwrapEnterpriseRLC);
addWalletLoadOptions(unwrapEnterpriseRLC);
unwrapEnterpriseRLC
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.force())
  .description(desc.unwrapEnterpriseRLC())
  .action(async (amount, unit, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const nRlcAmount = await nRlcAmountSchema().validate([amount, unit]);
      const walletOptions = await computeWalletLoadOptions(cmd);
      const txOptions = await computeTxOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [chain] = await Promise.all([loadChain(cmd.chain, { spinner })]);
      const hasEnterpriseFlavour = chain.enterpriseSwapNetwork && !!chain.enterpriseSwapNetwork.contracts;
      if (!hasEnterpriseFlavour) {
        throw Error(
          `No enterprise smart contracts found on current chain ${chain.id}`,
        );
      }

      const enterpriseContracts = chain.contracts.flavour === 'standard'
        ? chain.enterpriseSwapNetwork.contracts
        : chain.contracts;

      await connectKeystore({ contracts: enterpriseContracts }, keystore, {
        txOptions,
      });
      if (!cmd.force) {
        await prompt.unwrap(formatRLC(nRlcAmount), chain.id);
      }
      const message = `${formatRLC(nRlcAmount)} eRLC into RLC`;
      spinner.start(`Unwrapping ${message}...`);

      const txHash = await wallet.unwrapEnterpriseRLC(
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
      handleError(error, cli, cmd);
    }
  });

help(cli);
