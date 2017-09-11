#!/usr/bin/env node

const cli = require('commander');

const packageJSON = require('../package.json');

cli
  .version(packageJSON.version)
;

cli
  .command('init', 'init sample iexec dapp')
  .description('run setup commands for all envs')
;

cli.parse(process.argv);
