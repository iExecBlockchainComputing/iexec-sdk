#!/usr/bin/env node

const cli = require('commander');
const migrate = require('./migrate');
const server = require('./server');
const { handleError } = require('./utils');

cli
  .usage('[options] [appName]')
  .option('--chain, --network <name>', 'migrate to network name', 'ropsten')
  .parse(process.argv);

migrate(cli.network)
  .then(() => server.deploy(cli.network, cli.args[0]))
  .catch(handleError('deploy'));
