#!/usr/bin/env node

const cli = require('commander');
const init = require('./init');
const handleError = require('./errors');

cli.option('--repo [name]', 'git repository name').parse(process.argv);

init(cli.args[0], cli.repo).catch(handleError('init'));
