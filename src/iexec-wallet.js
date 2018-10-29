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
  .command('create')
  .option(...option.force())
  .description(desc.createObj(objName))
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      const force = cmd.force || false;
      const res = await keystore.createAndSave({ force });
      spinner.succeed(
        `wallet saved in "${res.fileName}":\n${pretty(res.wallet)}`,
      );
    } catch (error) {
      handleError(error, cli, spinner);
    }
  });

cli
  .command('show [address]')
  .option(...option.chain())
  .option(...option.hub())
  .description(desc.showObj(objName, 'address'))
  .action(async (address, cmd) => {
    const spinner = Spinner();
    try {
      const [userWallet, chain] = await Promise.all([
        keystore.load(),
        loadChain(cmd.chain),
      ]);
      const hubAddress = cmd.hub || chain.hub;
      if (address) userWallet.address = address;
      debug('userWallet.address', userWallet.address);
      spinner.info(`Wallet file:${pretty(userWallet)}`);

      spinner.start(info.checkBalance(''));
      const balances = await wallet.checkBalances(
        chain.contracts,
        userWallet.address,
        {
          hub: hubAddress,
        },
      );

      const strBalances = {
        ETH: unit.fromWei(balances.wei, 'ether'),
        nRLC: balances.nRLC.toString(),
        nRLCLocked: balances.nRLCLocked.toString(),
      };
      spinner.succeed(
        `Wallet ${chain.name} balances [${chain.id}]:${pretty(strBalances)}`,
      );
    } catch (error) {
      handleError(error, cli, spinner);
    }
  });

cli
  .command('getETH')
  .option(...option.chain())
  .description(desc.getETH())
  .action(async (cmd) => {
    try {
      const [{ address }, chain] = await Promise.all([
        keystore.load(),
        loadChain(cmd.chain),
      ]);
      await wallet.getETH(chain.name, address);
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command('getRLC')
  .option(...option.chain())
  .description(desc.getRLC())
  .action(async (cmd) => {
    try {
      const [{ address }, chain] = await Promise.all([
        keystore.load(),
        loadChain(cmd.chain),
      ]);
      await wallet.getRLC(chain.name, address);
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command('sendETH <amount>')
  .option(...option.chain())
  .option(...option.to())
  .option(...option.force())
  .description(desc.sendETH())
  .action(async (amount, cmd) => {
    const spinner = Spinner();
    try {
      const [{ address }, chain] = await Promise.all([
        keystore.load(),
        loadChain(cmd.chain),
      ]);
      const weiAmount = unit.toWei(amount, 'ether');

      if (!cmd.to) throw Error('missing --to option');

      if (!cmd.force) {
        await prompt.transferETH(amount, chain.name, cmd.to, chain.id);
      }

      const message = `${amount} ${chain.name} ETH from ${address} to ${
        cmd.to
      }`;
      spinner.start(`sending ${message}...`);

      await wallet.sendETH(chain.contracts, weiAmount, address, cmd.to);

      spinner.succeed(`Sent ${message}\n`);
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command('sendRLC <amount>')
  .option(...option.chain())
  .option(...option.to())
  .option(...option.force())
  .description(desc.sendRLC())
  .action(async (amount, cmd) => {
    const spinner = Spinner();
    try {
      const [{ address }, chain] = await Promise.all([
        keystore.load(),
        loadChain(cmd.chain),
      ]);
      const hubAddress = cmd.hub || chain.hub;

      if (!cmd.to) throw Error('missing --to option');

      if (!cmd.force) {
        await prompt.transferRLC(amount, chain.name, cmd.to, chain.id);
      }

      const message = `${amount} ${chain.name} nRLC from ${address} to ${
        cmd.to
      }`;
      spinner.start(`sending ${message}...`);

      await wallet.sendRLC(chain.contracts, amount, cmd.to, {
        hub: hubAddress,
      });

      spinner.succeed(`Sent ${message}\n`);
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command('sweep')
  .option(...option.chain())
  .option(...option.hub())
  .option(...option.to())
  .description(desc.sweep())
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      const [{ address }, chain] = await Promise.all([
        keystore.load(),
        loadChain(cmd.chain),
      ]);
      const hubAddress = cmd.hub || chain.hub;

      if (!cmd.to) throw Error('missing --to option');

      if (!cmd.force) {
        await prompt.sweep(chain.name, cmd.to, chain.id);
      }

      spinner.start('sweeping wallet...');

      await wallet.sweep(chain.contracts, address, cmd.to, { hub: hubAddress });

      spinner.succeed(`Wallet swept from ${address} to ${cmd.to}\n`);
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command('encrypt')
  .option(...option.password())
  .option(...option.force())
  .description(desc.encryptWallet())
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      const force = cmd.force || false;
      if (!cmd.password) throw Error('missing --password option');
      const res = await keystore.encryptAndSave(cmd.password, { force });
      spinner.succeed(
        `encrypted wallet saved in "${res.fileName}":\n${pretty(res.wallet)}`,
      );
    } catch (error) {
      handleError(error, cli, spinner);
    }
  });

cli
  .command('decrypt')
  .option(...option.password())
  .option(...option.force())
  .description(desc.decryptWallet())
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      const force = cmd.force || false;
      if (!cmd.password) throw Error('missing --password option');
      const res = await keystore.decryptAndSave(cmd.password, { force });
      spinner.succeed(
        `decrypted wallet saved in "${res.fileName}":\n${pretty(res.wallet)}`,
      );
    } catch (error) {
      handleError(error, cli, spinner);
    }
  });

help(cli);
