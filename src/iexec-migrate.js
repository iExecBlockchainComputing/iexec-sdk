#!/usr/bin/env node

const cli = require('commander');
const migrate = require('./migrate');
const handleError = require('./errors');
const help = require('./help');

cli.option('--chain, --network <name>', 'migrate to network name', 'ropsten');

help(cli, { checkNoArgs: false, checkWrongArgs: false });

migrate(cli.network).catch(handleError('truffle'));
