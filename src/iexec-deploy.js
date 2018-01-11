#!/usr/bin/env node

const cli = require('commander');
const migrate = require('./migrate');
const apps = require('./apps');

cli
  .usage('[options] [appName]')
  .option('--chain, --network <name>', 'migrate to network name', 'ropsten')
  .parse(process.argv);

migrate(cli.network).then(() => apps.deploy(cli.network, cli.args[0])).catch(() => process.exit(1));
