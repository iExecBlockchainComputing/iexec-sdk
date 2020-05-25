#!/usr/bin/env node

const cli = require('commander');
const account = require('./account');
const { Keystore } = require('./keystore');
const { loadChain } = require('./chains');
const { stringifyNestedBn, NULL_ADDRESS } = require('./utils');
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
  pretty,
} = require('./cli-helper');

const objName = 'account';

cli.name('iexec account').usage('<command> [options]');

const deposit = cli.command('deposit <amount>');
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
      const depositRes = await account.deposit(chain.contracts, amount);
      spinner.succeed(info.deposited(depositRes.amount), {
        raw: { amount: depositRes.amount, txHash: depositRes.txHash },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const withdraw = cli.command('withdraw <amount>');
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
      const res = await account.withdraw(chain.contracts, amount);
      spinner.succeed(info.withdrawed(amount), {
        raw: { amount: res.amount, txHash: res.txHash },
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
        Object.assign({}, walletOptions, { isSigner: false }),
      );

      let userAddress;
      if (!address) {
        try {
          const [userWalletAddress] = await keystore.accounts();
          if (userWalletAddress && userWalletAddress !== NULL_ADDRESS) {
            userAddress = userWalletAddress;
            spinner.info(`Current account address ${userWalletAddress}`);
          } else {
            throw Error('Wallet file not found');
          }
        } catch (error) {
          throw Error(
            `Failed to load wallet address from keystore: ${error.message}`,
          );
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
