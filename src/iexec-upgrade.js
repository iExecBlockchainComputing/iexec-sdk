#!/usr/bin/env node

const cli = require('commander');
const upgrade = require('./upgrade');
const { handleError } = require('./cli-helper');
const { help } = require('./cli-helper');

help(cli, { checkNoArgs: false, checkWrongArgs: false });

upgrade().catch(handleError('upgrade'));
