#!/usr/bin/env node

const cli = require('commander');
const account = require('../../common/account');
const { Keystore } = require('../utils/keystore');
const { loadChain, connectKeystore } = require('../utils/chains');
const { stringifyNestedBn, formatRLC } = require('../../common/utils/utils');
const { NULL_ADDRESS } = require('../../common/utils/constant');
const {
  finalizeCli,
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
} = require('../utils/cli-helper');

const objName = 'account';

cli.name('iexec account').usage('<command> [options]');

const deposit = cli.command('deposit <amount> [unit]');
addGlobalOptions(deposit);
addWalletLoadOptions(deposit);
deposit
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .description(desc.deposit())
  .action(async (amount, unit, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const chain = await loadChain(opts.chain, { txOptions, spinner });
      await connectKeystore(chain, keystore, { txOptions });
      spinner.start(info.depositing());
      const depositRes = await account.deposit(chain.contracts, [amount, unit]);
      spinner.succeed(info.deposited(formatRLC(depositRes.amount)), {
        raw: { amount: depositRes.amount, txHash: depositRes.txHash },
      });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const withdraw = cli.command('withdraw <amount> [unit]');
addGlobalOptions(withdraw);
addWalletLoadOptions(withdraw);
withdraw
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .description(desc.withdraw())
  .action(async (amount, unit, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const chain = await loadChain(opts.chain, { txOptions, spinner });
      await connectKeystore(chain, keystore, { txOptions });
      spinner.start(info.withdrawing());
      const res = await account.withdraw(chain.contracts, [amount, unit]);
      spinner.succeed(info.withdrawn(formatRLC(res.amount)), {
        raw: { amount: res.amount, txHash: res.txHash },
      });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const show = cli.command('show [address]');
addGlobalOptions(show);
addWalletLoadOptions(show);
show
  .option(...option.chain())
  .description(desc.showObj('iExec', objName))
  .action(async (address, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore({ ...walletOptions, isSigner: false });

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

      const chain = await loadChain(opts.chain, { spinner });

      spinner.start(info.checkBalance('iExec account'));
      const balances = await account.checkBalance(chain.contracts, userAddress);
      const cleanBalance = stringifyNestedBn(balances);
      spinner.succeed(
        `Account balances (RLC):${pretty({
          stake: formatRLC(cleanBalance.stake),
          locked: formatRLC(cleanBalance.locked),
        })}`,
        {
          raw: { balance: cleanBalance },
        },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

finalizeCli(cli);
