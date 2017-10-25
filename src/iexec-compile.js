#!/usr/bin/env node

const Debug = require('debug');
const truffle = require('./truffle-cli');

const debug = Debug('iexec:iexec-compile');

const args = process.argv.slice(2);
debug('args', args);


truffle.compile(args).catch(error => console.log(`"iexec compile" failed with ${error}`));
