#!/usr/bin/env node

const cli = require('commander');
const help = require('./help');
const packageJSON = require('../package.json');

cli.description(packageJSON.description).version(packageJSON.version);

cli.command('init', 'init sample iexec dapp');

cli.command('wallet', 'manage local ethereum wallet');

cli.command('account', 'manage iExec account');

cli.command(
  'truffle [args...]',
  'execute truffle with any number of truffle arguments',
);

cli.command('compile', 'call truffle compile');

cli.command('migrate', 'compile and deploy the contract');

cli.command('server', 'manage server side apps and works');

cli.command('deploy', 'combo of iexec contract deploy + iexec server deploy');

cli.command('submit [param]', 'submit a job to iExec');

cli.command('result <txHash>', 'fetch the result of a job');

cli.command('upgrade', 'update iExec CLI tool and upgrade iExec project');

cli.command('airdrop <csvPath>', 'airdrop RLC to all addresses in a csv file');

cli.command('app', 'manage iExec apps');

cli.command('dataset', 'manage iExec datasets');

cli.command('category', 'manage iExec categories');

cli.command('workerpool', 'manage iExec workerpools');

cli.command('market', 'manage iExec app');

help(cli);
