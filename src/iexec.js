#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const packageJSON = require('../package.json');
const truffle = require('./truffle-cli');

const debug = Debug('iexec');
debug('add DEBUG=* to show logs');

cli
  .description(packageJSON.description)
  .version(packageJSON.version)
;

cli
  .command('init', 'init sample iexec dapp')
;

cli
  .command('truffle [args...]')
  .alias('t')
  .description('execute truffle with any number of truffle arguments')
  .action(args => truffle(...args))
;

cli
  .command('compile')
  .description('call truffle compile')
  .action(() => truffle('compile'))
;

cli
  .command('migrate')
  .description('call truffle migrate')
  .action(() => truffle('migrate'))
;

cli.parse(process.argv);
