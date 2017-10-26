#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const apps = require('./apps');

const debug = Debug('iexec:iexec-apps');

cli
  .option('--chain, --network <name>', 'network name', 'ropsten');

cli
  .command('deploy [appName]')
  .description('send app to iexec server, app binary must be located inside /apps')
  .action(appName => apps.send(cli.network, appName).catch(() => {}));

cli.parse(process.argv);

debug('cli.args.length', cli.args.length);
if (cli.args.length === 0) cli.help();
