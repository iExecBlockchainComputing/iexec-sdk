#!/usr/bin/env node

const truffle = require('./truffle-cli');
const handleError = require('./errors');

const args = process.argv.slice(2);

truffle.compile(args).catch(handleError('truffle'));
