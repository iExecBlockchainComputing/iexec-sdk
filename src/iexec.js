#!/usr/bin/env node

const Debug = require('debug');
const commander = require('commander');
const packageJSON = require('../package.json');

const debug = Debug('iexec');

debug('add DEBUG=* to show logs');

new commander.Command(packageJSON.name)
  .version(packageJSON.version)
  .parse(process.argv);
