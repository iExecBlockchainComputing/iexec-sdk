#!/usr/bin/env node

const Debug = require('debug');
const truffle = require('./truffle-cli');

const debug = Debug('iexec:iexec-migrate');

const args = process.argv.slice(2);
debug('args', args);

truffle('migrate', ...args);
