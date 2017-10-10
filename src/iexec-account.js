#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const account = require('./account');

const debug = Debug('iexec:iexec-account');

cli
  .option('--network [name]', 'network name', 'ropsten');

cli
  .command('login')
  .description('login into your iexec account')
  .action(() => account.login().catch(error => console.log(`"iexec account login" failed with ${error}`)));

cli
  .command('setCredit')
  .description('set the RLC credit on iexec account')
  .action(() => account.credit(cli.network, cli.args).catch(error => console.log(`"iexec account credit" failed with ${error}`)));

cli
  .command('show')
  .description('show iexec account status')
  .action(() => account.show().catch(error => console.log(`"iexec account show" failed with ${error}`)));

cli.parse(process.argv);

debug('cli.args.length', cli.args.length);
if (cli.args.length === 0) cli.help();
