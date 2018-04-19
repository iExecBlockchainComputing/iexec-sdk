#!/usr/bin/env node

const Debug = require('debug');
const truffle = require('./truffle-cli');
const handleError = require('./errors');

const debug = Debug('iexec:iexec-truffle');

const args = process.argv.slice(2);
debug('args', args);

truffle.run(args).catch(handleError('truffle'));
