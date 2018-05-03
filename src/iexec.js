#!/usr/bin/env node

const cli = require('commander');
const { help } = require('./cli-helper');
const packageJSON = require('../package.json');

cli.description(packageJSON.description).version(packageJSON.version);

cli.command('init', 'init sample iexec dapp');

cli.command('wallet', 'manage local ethereum wallet');

cli.command('account', 'manage iExec account');

cli.command('server', 'manage server side apps and works');

cli.command('submit [param]', 'submit a job to iExec');

cli.command('result <txHash>', 'fetch the result of a job');

cli.command('upgrade', 'update iExec CLI tool and upgrade iExec project');

cli.command('app', 'manage iExec apps');

cli.command('dataset', 'manage iExec datasets');

cli.command('category', 'manage iExec categories');

cli.command('workerpool', 'manage iExec workerpools');

cli.command('market', 'manage iExec app');

help(cli);
