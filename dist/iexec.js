#!/usr/bin/env node
'use strict';

const Debug = require('debug');
const cli = require('commander');
const packageJSON = require('../package.json');

const debug = Debug('iexec');
debug('add DEBUG=* to show logs');

cli.description(packageJSON.description).version(packageJSON.version);

cli.command('init', 'init sample iexec dapp');

cli.command('wallet [args...]', 'manage local ethereum wallet');

cli.command('account [args...]', 'manage iexec account');

cli.command('truffle [args...]', 'execute truffle with any number of truffle arguments');

cli.command('compile [args...]', 'call truffle compile');

cli.command('migrate [args...]', 'compile and deploy the contract');

cli.command('apps [args...]', 'manage offchain apps');

cli.command('submit [args...]', 'send submit transaction');

cli.command('result', 'fetch all jobs results');

cli.parse(process.argv);