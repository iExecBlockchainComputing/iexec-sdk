#!/usr/bin/env node

const truffle = require('./truffle-cli');

const args = process.argv.slice(2);

truffle.compile(args).catch(() => process.exit(1));
