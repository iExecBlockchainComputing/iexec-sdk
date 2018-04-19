#!/usr/bin/env node

const truffle = require('./truffle-cli');
const { handleError } = require('./utils');

const args = process.argv.slice(2);

truffle.compile(args).catch(handleError('truffle'));
