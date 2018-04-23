#!/usr/bin/env node

const cli = require('commander');
const init = require('./init');
const handleError = require('./errors');
const help = require('./help');

cli.option('--repo [name]', 'git repository name');

help(cli, { checkNoArgs: false, checkWrongArgs: false });

init(cli.args[0], cli.repo).catch(handleError('init'));
