#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const wallet = require('./wallet');

const debug = Debug('iexec:iexec-wallet');

debug('');

cli
  .command('create')
  .description('create a local wallet')
  .action(() => wallet.create())
;

cli.parse(process.argv);
