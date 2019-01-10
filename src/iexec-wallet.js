#!/usr/bin/env node

const Debug = require('debug');
const ethers = require('ethers');
const cli = require('commander');
const unit = require('ethjs-unit');
const wallet = require('./wallet');
const {
  Keystore,
  createAndSave,
  importPrivateKeyAndSave,
} = require('./keystore');
const {
  addGlobalOptions,
  addWalletCreateOptions,
  computeWalletCreateOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  handleError,
  help,
  Spinner,
  option,
  desc,
  prompt,
  pretty,
  info,
} = require('./cli-helper');
const { loadChain } = require('./chains.js');

const debug = Debug('iexec:iexec-wallet');
const objName = 'wallet';

const create = cli.command('create');
addGlobalOptions(create);
addWalletCreateOptions(create);
create
  .option(...option.forceCreate())
  .description(desc.createWallet())
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      const force = cmd.force || false;
      const walletOptions = await computeWalletCreateOptions(cmd);
      const res = await createAndSave(
        Object.assign({}, { force }, walletOptions),
      );
      spinner.succeed(
        `wallet saved in "${res.fileName}":\n${pretty(res.wallet)}`,
        { raw: res },
      );
    } catch (error) {
      handleError(error, cli, spinner);
    }
  });

const importPk = cli.command('import <privateKey>');
addGlobalOptions(importPk);
addWalletCreateOptions(importPk);
importPk
  .option(...option.forceCreate())
  .description(desc.importWallet())
  .action(async (privateKey, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const force = cmd.force || false;
      const walletOptions = await computeWalletCreateOptions(cmd);
      const res = await importPrivateKeyAndSave(
        privateKey,
        Object.assign({}, { force }, walletOptions),
      );
      spinner.succeed(
        `wallet saved in "${res.fileName}":\n${pretty(res.wallet)}`,
        { raw: res },
      );
    } catch (error) {
      handleError(error, cli, spinner);
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
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);

      let userWallet;
      let displayedWallet;
      try {
        userWallet = await keystore.load();
        displayedWallet = Object.assign(
          {},
          cmd.showPrivateKey ? { privateKey: userWallet.privateKey } : {},
          { publicKey: userWallet.publicKey, address: userWallet.address },
        );
        // show user wallet
        spinner.info(`Wallet file:${pretty(displayedWallet)}`);
      } catch (error) {
        if (error.message === 'invalid password') throw error;
      }
      if (!userWallet && !address) throw Error('Missing address or wallet');

      const chain = await loadChain(cmd.chain, keystore, { spinner });
      // show address ballance
      const addressToShow = address || userWallet.address;
      spinner.start(info.checkBalance(''));
      const balances = await wallet.checkBalances(
        chain.contracts,
        addressToShow,
      );

      const strBalances = {
        ETH: unit.fromWei(balances.wei, 'ether'),
        nRLC: balances.nRLC.toString(),
      };
      spinner.succeed(
        `Wallet ${chain.name} balances [${chain.id}]:${pretty(strBalances)}`,
        {
          raw: Object.assign(
            { balance: strBalances },
            !address && userWallet && { wallet: displayedWallet },
          ),
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
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [{ address }, chain] = await Promise.all([
        keystore.load(),
        loadChain(cmd.chain, keystore, { spinner }),
      ]);
      await wallet.getETH(chain.name, address);
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
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [{ address }, chain] = await Promise.all([
        keystore.load(),
        loadChain(cmd.chain, keystore, { spinner }),
      ]);
      await wallet.getRLC(chain.name, address);
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const sendETH = cli.command('sendETH <amount>');
addGlobalOptions(sendETH);
addWalletLoadOptions(sendETH);
sendETH
  .option(...option.chain())
  .option(...option.to())
  .option(...option.force())
  .description(desc.sendETH())
  .action(async (amount, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [{ address }, chain] = await Promise.all([
        keystore.load(),
        loadChain(cmd.chain, keystore, { spinner }),
      ]);
      const weiAmount = ethers.utils.parseEther(amount).toHexString();
      if (!cmd.to) throw Error('missing --to option');

      if (!cmd.force && !cmd.raw) {
        await prompt.transferETH(amount, chain.name, cmd.to, chain.id);
      }

      const message = `${amount} ${chain.name} ETH from ${address} to ${
        cmd.to
      }`;
      spinner.start(`sending ${message}...`);
      await wallet.sendETH(chain.contracts, weiAmount, address, cmd.to);
      spinner.succeed(`Sent ${message}\n`, {
        raw: { amount, from: address, to: cmd.to },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const sendRLC = cli.command('sendRLC <amount>');
addGlobalOptions(sendRLC);
addWalletLoadOptions(sendRLC);
sendRLC
  .option(...option.chain())
  .option(...option.to())
  .option(...option.force())
  .description(desc.sendRLC())
  .action(async (amount, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [{ address }, chain] = await Promise.all([
        keystore.load(),
        loadChain(cmd.chain, keystore, { spinner }),
      ]);

      if (!cmd.to) throw Error('missing --to option');

      if (!cmd.force && !cmd.raw) {
        await prompt.transferRLC(amount, chain.name, cmd.to, chain.id);
      }

      const message = `${amount} ${chain.name} nRLC from ${address} to ${
        cmd.to
      }`;
      spinner.start(`sending ${message}...`);

      await wallet.sendRLC(chain.contracts, amount, cmd.to);

      spinner.succeed(`Sent ${message}\n`, {
        raw: { amount, from: address, to: cmd.to },
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
  .option(...option.to())
  .description(desc.sweep())
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [{ address }, chain] = await Promise.all([
        keystore.load(),
        loadChain(cmd.chain, keystore, { spinner }),
      ]);
      if (!cmd.to) throw Error('missing --to option');
      if (!cmd.force && !cmd.raw) {
        await prompt.sweep(chain.name, cmd.to, chain.id);
      }
      spinner.start('sweeping wallet...');
      await wallet.sweep(chain.contracts, address, cmd.to);
      spinner.succeed(`Wallet swept from ${address} to ${cmd.to}\n`, {
        raw: { from: address, to: cmd.to },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
