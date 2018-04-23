#!/usr/bin/env node

const cli = require('commander');
const upgrade = require('./upgrade');
const handleError = require('./errors');
const help = require('./help');

help(cli, { checkNoArgs: false, checkWrongArgs: false });

upgrade().catch(handleError('upgrade'));
