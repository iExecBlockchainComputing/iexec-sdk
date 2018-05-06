#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const unit = require('ethjs-unit');
const wallet = require('./wallet');
const keystore = require('./keystore');
const {
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

cli
  .option(...option.to())
  .option(...option.chain())
  .option(...option.token())
  .option(...option.force())
  .option(...option.hub());

cli
  .command('create')
  .description(desc.createObj(objName))
  .action(async () => {
    const spinner = Spinner();
    try {
      const res = await keystore.createAndSave({ force: cli.force || false });
      spinner.succeed(`wallet saved in "${res.fileName}":\n${pretty(res.wallet)}`);
    } catch (error) {
      handleError(error, objName, spinner);
    }
  });

cli
  .command('show [address]')
  .description(desc.showObj(objName, 'address'))
  .action(async (address) => {
    const spinner = Spinner();
    try {
      const [userWallet, chain] = await Promise.all([
        keystore.load(),
        loadChain(cli.chain),
      ]);
      if (address) userWallet.address = address;
      debug('userWallet.address', userWallet.address);
      spinner.info(`Wallet:${pretty(userWallet)}`);

      spinner.start(info.checkBalance(''));
      const balances = await wallet.checkBalances(
        chain.contracts,
        userWallet.address,
        {
          hub: cli.hub,
        },
      );

      const strBalances = {
        ETH: unit.fromWei(balances.wei, 'ether'),
        nRLC: balances.nRLC.toString(),
      };
      spinner.succeed(`Wallet ${cli.chain} balances [${chain.id}]:${pretty(strBalances)}`);
    } catch (error) {
      handleError(error, 'wallet', spinner);
    }
  });

cli
  .command('getETH')
  .description(desc.getETH())
  .action(async () => {
    try {
      const { address } = await keystore.load();
      await wallet.getETH(cli.chain, address);
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('getRLC')
  .description(desc.getRLC())
  .action(async () => {
    try {
      const { address } = await keystore.load();
      await wallet.getRLC(cli.chain, address);
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('sendETH <amount>')
  .description(desc.sendETH())
  .action(async (amount) => {
    const spinner = Spinner();
    try {
      const [{ address }, chain] = await Promise.all([
        keystore.load(),
        loadChain(cli.chain),
      ]);

      if (!cli.to) throw Error('missing --to option');

      if (!cli.force) {
        await prompt.transferETH(
          unit.toWei(amount, 'ether'),
          cli.chain,
          cli.to,
          chain.id,
        );
      }

      const message = `${amount} ${cli.chain} ETH from ${address} to ${cli.to}`;
      spinner.start(`sending ${message}...`);

      await wallet.sendETH(chain.contracts, amount, address, cli.to);

      spinner.succeed(`Sent ${message}\n`);
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('sendRLC <amount>')
  .description(desc.sendRLC())
  .action(async (amount) => {
    const spinner = Spinner();
    try {
      const [{ address }, chain] = await Promise.all([
        keystore.load(),
        loadChain(cli.chain),
      ]);

      if (!cli.to) throw Error('missing --to option');

      if (!cli.force) {
        await prompt.transferRLC(amount, cli.chain, cli.to, chain.id);
      }

      const message = `${amount} ${cli.chain} nRLC from ${address} to ${
        cli.to
      }`;
      spinner.start(`sending ${message}...`);

      await wallet.sendRLC(chain.contracts, amount, cli.to, { hub: cli.hub });

      spinner.succeed(`Sent ${message}\n`);
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('sweep')
  .description(desc.sweep())
  .action(async () => {
    const spinner = Spinner();
    try {
      const [{ address }, chain] = await Promise.all([
        keystore.load(),
        loadChain(cli.chain),
      ]);

      if (!cli.to) throw Error('missing --to option');

      if (!cli.force) {
        await prompt.sweep(cli.chain, cli.to, chain.id);
      }

      spinner.start('sweeping wallet...');

      await wallet.sweep(chain.contracts, address, cli.to, { hub: cli.hub });

      spinner.succeed(`Wallet swept from ${address} to ${cli.to}\n`);
    } catch (error) {
      handleError(error, objName);
    }
  });

help(cli);
