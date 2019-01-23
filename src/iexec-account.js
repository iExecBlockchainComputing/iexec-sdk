#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const account = require('./account');
const { Keystore } = require('./keystore');
const { loadChain } = require('./chains');
const { stringifyNestedBn } = require('./utils');
const {
  help,
  addGlobalOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  handleError,
  option,
  desc,
  Spinner,
  info,
  command,
  pretty,
} = require('./cli-helper');

const debug = Debug('iexec:iexec-account');
const objName = 'account';

const deposit = cli.command(command.deposit());
addGlobalOptions(deposit);
addWalletLoadOptions(deposit);
deposit
  .option(...option.chain())
  .description(desc.deposit())
  .action(async (amount, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);
      const chain = await loadChain(cmd.chain, keystore, { spinner });
      debug('amount', amount);
      spinner.start(info.depositing());
      const depositedeAmount = await account.deposit(chain.contracts, amount);
      spinner.succeed(info.deposited(depositedeAmount), {
        raw: { amount: depositedeAmount },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const withdraw = cli.command(command.withdraw());
addGlobalOptions(withdraw);
addWalletLoadOptions(withdraw);
withdraw
  .option(...option.chain())
  .description(desc.withdraw())
  .action(async (amount, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);
      const chain = await loadChain(cmd.chain, keystore, { spinner });
      debug('amount', amount);
      spinner.start(info.withdrawing());
      const withdrawedAmount = await account.withdraw(chain.contracts, amount);
      spinner.succeed(info.withdrawed(amount), {
        raw: { amount: withdrawedAmount },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const show = cli.command('show [address]');
addGlobalOptions(show);
addWalletLoadOptions(show);
show
  .option(...option.chain())
  .description(desc.showObj('iExec', objName))
  .action(async (address, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(
        Object.assign({}, walletOptions, { isSigner: false }),
      );

      let userWallet;
      try {
        userWallet = await keystore.load();
      } catch (error) {
        if (error.message === 'invalid password') throw error;
      }
      if (!userWallet && !address) throw Error('Missing address or wallet');

      const chain = await loadChain(cmd.chain, keystore, { spinner });
      const userAddress = address || userWallet.address;

      spinner.start(info.checkBalance('iExec account'));
      const balances = await account.checkBalance(chain.contracts, userAddress);
      const cleanBalance = stringifyNestedBn(balances);
      spinner.succeed(`Account balances:${pretty(cleanBalance)}`, {
        raw: { balance: cleanBalance },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
