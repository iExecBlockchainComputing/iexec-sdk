#!/usr/bin/env node

const cli = require('commander');
const submit = require('./submit');

cli
  .option('--chain, --network <name>', 'network name', 'ropsten')
  .parse(process.argv);

submit(cli.network, 'iexecSubmit', cli.args[0]).catch(() => {});
