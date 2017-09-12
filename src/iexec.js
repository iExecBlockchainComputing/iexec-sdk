#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const packageJSON = require('../package.json');

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
  .command('truffle [args...]', 'execute truffle with any number of truffle arguments')
  .alias('t')
;

cli
  .command('compile [args...]', 'call truffle compile')
;

cli
  .command('migrate [args...]', 'call truffle migrate')
;

cli.parse(process.argv);
