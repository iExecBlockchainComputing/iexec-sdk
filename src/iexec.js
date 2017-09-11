#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const packageJSON = require('../package.json');

const debug = Debug('iexec');
debug('add DEBUG=* to show logs');

cli
  .version(packageJSON.version)
  .description(packageJSON.description)
;

cli
  .command('init', 'init sample iexec dapp')
;

cli.parse(process.argv);
