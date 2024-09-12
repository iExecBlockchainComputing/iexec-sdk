#!/usr/bin/env node

import { program as cli } from 'commander';
import { Keystore } from '../utils/keystore.js';
import { loadChain } from '../utils/chains.js';
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
} from '../utils/cli-helper.js';
import { showUserVoucher } from '../../common/voucher/voucher.js';

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

finalizeCli(cli);
