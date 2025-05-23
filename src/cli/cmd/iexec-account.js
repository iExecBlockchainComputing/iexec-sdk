#!/usr/bin/env node

import { program as cli } from 'commander';
import {
  deposit as accountDeposit,
  withdraw as accountWithdraw,
} from '../../common/account/fund.js';
import {
  approve as accountApprove,
  checkAllowance,
} from '../../common/account/allowance.js';
import { checkBalance } from '../../common/account/balance.js';
import { Keystore } from '../utils/keystore.js';
import { loadChain, connectKeystore } from '../utils/chains.js';
import { stringifyNestedBn, formatRLC } from '../../common/utils/utils.js';
import { NULL_ADDRESS } from '../../common/utils/constant.js';
import {
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
} from '../utils/cli-helper.js';

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
      const walletOptions = computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const chain = await loadChain(opts.chain, { txOptions, spinner });
      await connectKeystore(chain, keystore, { txOptions });
      spinner.start(info.depositing());
      const depositRes = await accountDeposit(chain.contracts, [amount, unit]);
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
      const walletOptions = computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const chain = await loadChain(opts.chain, { txOptions, spinner });
      await connectKeystore(chain, keystore, { txOptions });
      spinner.start(info.withdrawing());
      const res = await accountWithdraw(chain.contracts, [amount, unit]);
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
      const walletOptions = computeWalletLoadOptions(opts);
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
      const balances = await checkBalance(chain.contracts, userAddress);
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

const approve = cli.command('approve <amount> <spender> [unit]');
addGlobalOptions(approve);
addWalletLoadOptions(approve);
approve
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .description(desc.approve())
  .action(async (amount, spender, unit = 'nRLC', opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const chain = await loadChain(opts.chain, { txOptions, spinner });
      await connectKeystore(chain, keystore, { txOptions });
      spinner.start(info.approving());
      const txHash = await accountApprove(
        chain.contracts,
        [amount, unit],
        spender,
      );
      spinner.succeed(info.approved(amount, spender, unit), {
        raw: { txHash },
      });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const allowance = cli.command('allowance <spender>');
addGlobalOptions(allowance);
addWalletLoadOptions(allowance);
allowance
  .option(...option.chain())
  .option(...option.user())
  .description(desc.allowance())
  .action(async (spender, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = computeWalletLoadOptions(opts);
      const keystore = Keystore({ ...walletOptions, isSigner: false });
      const [chain, [address]] = await Promise.all([
        loadChain(opts.chain, { spinner }),
        keystore.accounts(),
      ]);
      const owner = opts.user || address;
      spinner.start(info.checkingAllowance(spender, owner));
      const amount = await checkAllowance(chain.contracts, owner, spender);
      spinner.succeed(info.allowance(spender, owner, amount), {
        raw: { amount },
      });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const revoke = cli.command('revoke <spender>');
addGlobalOptions(revoke);
addWalletLoadOptions(revoke);
revoke
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .description(desc.revoke())
  .action(async (spender, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const chain = await loadChain(opts.chain, { txOptions, spinner });
      await connectKeystore(chain, keystore, { txOptions });
      spinner.start(info.revoking(spender));
      const txHash = await accountApprove(chain.contracts, 0, spender);
      spinner.succeed(info.revoked(spender), {
        raw: { txHash },
      });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

finalizeCli(cli);
