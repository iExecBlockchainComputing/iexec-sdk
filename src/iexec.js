#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const packageJSON = require('../package.json');

const debug = Debug('iexec');
debug('set DEBUG=* to show logs');

cli
  .version(packageJSON.version)
;

cli
  .command('init', 'init sample iexec dapp')
  .description('run setup commands for all envs')
;

cli.parse(process.argv);
