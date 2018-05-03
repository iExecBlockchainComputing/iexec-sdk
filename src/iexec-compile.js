#!/usr/bin/env node

const truffle = require('./truffle-cli');
const { handleError } = require('./cli-helper');

const args = process.argv.slice(2);

truffle.compile(args).catch(handleError('truffle'));
