#!/usr/bin/env node

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
  computeTxOptions,
  checkUpdate,
  handleError,
  option,
  desc,
  Spinner,
  info,
  command,
  pretty,
} = require('./cli-helper');

const objName = 'account';

const deposit = cli.command(command.deposit());
addGlobalOptions(deposit);
addWalletLoadOptions(deposit);
deposit
  .option(...option.chain())
  .option(...option.txGasPrice())
  .description(desc.deposit())
  .action(async (amount, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const txOptions = computeTxOptions(cmd);
      const keystore = Keystore(walletOptions);
      const chain = await loadChain(cmd.chain, keystore, {
        spinner,
        txOptions,
      });
      await keystore.load();
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
  .option(...option.txGasPrice())
  .description(desc.withdraw())
  .action(async (amount, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const txOptions = computeTxOptions(cmd);
      const keystore = Keystore(walletOptions);
      const chain = await loadChain(cmd.chain, keystore, {
        spinner,
        txOptions,
      });
      await keystore.load();
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
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(
        Object.assign({}, walletOptions, address && { isSigner: false }),
      );

      let userAddress;
      if (!address) {
        try {
          const userWallet = await keystore.load();
          userAddress = userWallet.address;
        } catch (error) {
          if (error.message === 'invalid password') throw error;
        }
      } else {
        userAddress = address;
      }
      if (!userAddress) throw Error('Missing address or wallet');

      const chain = await loadChain(cmd.chain, keystore, { spinner });

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
