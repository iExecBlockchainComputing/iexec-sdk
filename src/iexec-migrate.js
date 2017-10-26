#!/usr/bin/env node

const cli = require('commander');
const migrate = require('./migrate');

cli
  .option('--chain, --network <name>', 'migrate to network name', 'ropsten')
  .parse(process.argv);

migrate(cli.network).catch(() => {});
