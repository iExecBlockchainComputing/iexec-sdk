#!/usr/bin/env node

const cli = require('commander');
const upgrade = require('./upgrade');
const handleError = require('./errors');

cli.parse(process.argv);

upgrade().catch(handleError('upgrade'));
