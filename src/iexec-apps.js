#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const apps = require('./apps');

const debug = Debug('iexec:iexec-apps');

cli
  .option('--chain, --network [name]', 'network name', 'ropsten');

cli
  .command('send')
  .description('send app to offchain server')
  .action(() => apps.send(cli.network).catch(error => console.log(`"iexec apps send" failed with ${error}`)));

cli.parse(process.argv);

debug('cli.args.length', cli.args.length);
if (cli.args.length === 0) cli.help();
