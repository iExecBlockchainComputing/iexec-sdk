#!/usr/bin/env node

import { program as cli } from 'commander';
import { Keystore } from '../utils/keystore.js';
import { connectKeystore, loadChain } from '../utils/chains.js';
import {
  finalizeCli,
  addGlobalOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  checkUpdate,
  handleError,
  option,
  desc,
  Spinner,
  info,
  pretty,
  computeTxOptions,
} from '../utils/cli-helper.js';
import {
  authorizeRequester,
  revokeRequesterAuthorization,
  showUserVoucher,
} from '../../common/voucher/voucher.js';

const objName = 'voucher';

cli.name('iexec voucher').usage('<command> [options]');

const show = cli.command('show');
addGlobalOptions(show);
addWalletLoadOptions(show);
show
  .option(...option.chain())
  .option(...option.user())
  .description(desc.showObj('iExec', objName))
  .action(async (opts) => {
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
      spinner.start(info.checking('Voucher details'));
      const voucherDetails = await showUserVoucher(
        chain.contracts,
        chain.voucherSubgraph,
        chain.voucherHub,
        owner,
      );
      const prettyDetails = pretty({
        type: voucherDetails.type.toString(),
        balance: voucherDetails.balance.toString(),
        expirationTimestamp: voucherDetails.expirationTimestamp.toString(),
        allowanceAmount: voucherDetails.allowanceAmount.toString(),
        address: voucherDetails.address,
      });
      spinner.succeed(`Voucher details: ${prettyDetails}`, {
        raw: voucherDetails,
      });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const authorize = cli.command('authorize <requester>');
addGlobalOptions(authorize);
addWalletLoadOptions(authorize);
authorize
  .option(...option.chain())
  .description(desc.authorize())
  .action(async (requester, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const chain = await loadChain(opts.chain, { txOptions, spinner });
      await connectKeystore(chain, keystore, { txOptions });
      spinner.start(info.authorizing(requester));

      const txHash = await authorizeRequester(
        chain.contracts,
        chain.voucherHub,
        requester,
      );
      spinner.succeed(info.authorized(requester), {
        raw: { txHash },
      });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const revoke = cli.command('revoke <requester>');
addGlobalOptions(revoke);
addWalletLoadOptions(revoke);
revoke
  .option(...option.chain())
  .description(desc.revokeVoucherAuthorization())
  .action(async (requester, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const chain = await loadChain(opts.chain, { txOptions, spinner });
      await connectKeystore(chain, keystore, { txOptions });
      spinner.start(info.revokingVoucherAuthorization());

      const txHash = await revokeRequesterAuthorization(
        chain.contracts,
        chain.voucherHub,
        requester,
      );

      spinner.succeed(info.revokedVoucherAuthorization(requester), {
        raw: { txHash },
      });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

finalizeCli(cli);
