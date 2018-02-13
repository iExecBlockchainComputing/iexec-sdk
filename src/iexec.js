#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const packageJSON = require('../package.json');

const debug = Debug('iexec');
debug('add DEBUG=* to show logs');

cli
  .description(packageJSON.description)
  .version(packageJSON.version);

cli.command('init', 'init sample iexec dapp');

cli.command('wallet', 'manage local ethereum wallet');

cli.command('account', 'manage iExec account');

cli.command('truffle [args...]', 'execute truffle with any number of truffle arguments');

cli.command('compile', 'call truffle compile');

cli.command('migrate', 'compile and deploy the contract');

cli.command('server', 'manage server side apps and works');

cli.command('deploy', 'combo of iexec contract deploy + iexec server deploy');

cli.command('submit [param]', 'submit a job to iExec');

cli.command('result <txHash>', 'fetch the result of a job');

cli.command('airdrop <csvPath>', 'airdrop RLC to all addresses in a csv file');

cli.parse(process.argv);
