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
  .command('compile')
  .description('call truffle int')
  .action(() => truffle('compile'))
;

cli.parse(process.argv);
