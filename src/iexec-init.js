#!/usr/bin/env node

const cli = require('commander');
const init = require('./init');
const { handleError, help } = require('./cli-helper');

cli.option('--repo [name]', 'git repository name');

help(cli, { checkNoArgs: false, checkWrongArgs: false });

init(cli.args[0], cli.repo).catch(handleError('init'));
