#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const wallet = require('./wallet');

const debug = Debug('iexec:iexec-wallet');

cli
  .option('--network [name]', 'network name', 'ropsten')
  .option('--wallet <type>', 'choose type of wallet', /^(local|remote)$/i, 'local');

cli
  .command('create')
  .description('create a local wallet')
  .action(() => wallet.create().catch(error => console.log(`"iexec wallet create" failed with ${error}`)));

cli
  .command('getETH')
  .description('apply for ETH from pre-registered faucets')
  .action(() => wallet.getETH(cli.network).catch(error => console.log(`"iexec wallet getETH" failed with ${error}`)));

cli
  .command('show')
  .description('show local wallet balances')
  .action(() => wallet.show().catch(error => console.log(`"iexec wallet show" failed with ${error}`)));

cli.parse(process.argv);

debug('cli.args', cli.args);
if (cli.args.length === 0) cli.help();
