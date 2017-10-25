#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const truffle = require('./truffle-cli');
const packageJSON = require('../package.json');
const migrate = require('./migrate');

const debug = Debug('iexec');
debug('add DEBUG=* to show logs');
const args = process.argv.slice(2);

cli
  .description(packageJSON.description)
  .version(packageJSON.version);

cli.command('init', 'init sample iexec dapp');

cli.command('wallet [args...]', 'manage local ethereum wallet');

cli.command('account [args...]', 'manage iexec account');

cli.command('truffle [args...]').description('execute truffle with any number of truffle arguments')
  .action(() => truffle.run(args).catch(error => console.log(`"iexec truffle" failed with ${error}`)));

cli.command('compile').description('call truffle compile')
  .action(() => truffle.compile(args).catch(error => console.log(`"iexec compile" failed with ${error}`)));

cli.command('migrate').description('compile and deploy the contract')
  .option('--chain, --network [name]', 'migrate to network name', 'ropsten')
  .action(({ network }) => migrate(network));

cli.command('apps [args...]', 'manage offchain apps');

cli.command('submit [args...]', 'send submit transaction');

cli.command('result', 'fetch all jobs results');

cli.parse(process.argv);
