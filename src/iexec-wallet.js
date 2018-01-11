#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const wallet = require('./wallet');

const debug = Debug('iexec:iexec-wallet');

cli
  .option('--chain, --network <name>', 'network name', 'ropsten');

cli
  .command('create')
  .description('create a local wallet')
  .action(() => wallet.create().catch(() => process.exit(1)));

cli
  .command('getETH')
  .description('apply for ETH from pre-registered faucets')
  .action(() => wallet.getETH(cli.network).catch(() => process.exit(1)));

cli
  .command('getRLC')
  .description('apply for nRLC from iexec faucet')
  .action(() => wallet.getRLC(cli.network).catch(() => process.exit(1)));

cli
  .command('show')
  .description('show local wallet balances')
  .action(() => wallet.show().catch(() => process.exit(1)));

cli.parse(process.argv);

debug('cli.args.length', cli.args.length);
if (cli.args.length === 0) cli.help();
