#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const wallet = require('./wallet');
const handleError = require('./errors');

const debug = Debug('iexec:iexec-wallet');

cli
  .option('--to <address>', 'receiver address')
  .option('--chain, --network <name>', 'network name', 'ropsten');

cli
  .command('create')
  .description('create a local wallet')
  .action(() => wallet.create().catch(handleError('wallet')));

cli
  .command('getETH')
  .description('apply for ETH from pre-registered faucets')
  .action(() => wallet.getETH(cli.network).catch(handleError('wallet')));

cli
  .command('getRLC')
  .description('apply for nRLC from iexec faucet')
  .action(() => wallet.getRLC(cli.network).catch(handleError('wallet')));

cli
  .command('sendETH')
  .arguments('<amount>')
  .description('send ETH to an address')
  .action(amount =>
    wallet.sendETH(cli.network, amount, cli.to).catch(handleError('wallet')));

cli
  .command('sendRLC')
  .arguments('<amount>')
  .description('send nRLC to an address')
  .action(amount =>
    wallet.sendRLC(cli.network, amount, cli.to).catch(handleError('wallet')));

cli
  .command('sweep')
  .description('send all ETH and RLC to an address')
  .action(() => wallet.sweep(cli.network, cli.to).catch(handleError('wallet')));

cli
  .command('show')
  .description('show local wallet balances')
  .action(() => wallet.show().catch(handleError('wallet')));

cli.parse(process.argv);

debug('cli.args.length', cli.args.length);
if (cli.args.length === 0) cli.help();
