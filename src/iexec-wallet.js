#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const wallet = require('./wallet');

const debug = Debug('iexec:iexec-wallet');

debug('');

cli
  .command('create')
  .description('create a local wallet')
  .action(() => wallet.create().catch(error => console.log(`"iexec wallet create" failed with ${error}`)))
;

cli
  .command('getETH')
  .description('apply for ETH from pre-registered faucets')
  .action(() => wallet.getETH().catch(error => console.log(`"iexec wallet getETH" failed with ${error}`)))
;

cli.parse(process.argv);
