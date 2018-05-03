#!/usr/bin/env node

const cli = require('commander');
const migrate = require('./migrate');
const server = require('./server');
const { handleError, help } = require('./cli-helper');

cli
  .usage('[options] [appName]')
  .option('--chain, --network <name>', 'migrate to network name', 'ropsten');

help(cli, { checkNoArgs: false, checkWrongArgs: false });

migrate(cli.network)
  .then(() => server.deploy(cli.network, cli.args[0]))
  .catch(handleError('deploy'));
