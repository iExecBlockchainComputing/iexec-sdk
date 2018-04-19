#!/usr/bin/env node

const cli = require('commander');
const submit = require('./submit');
const handleError = require('./errors');

cli
  .option('--chain, --network <name>', 'network name', 'ropsten')
  .option(
    '--dapp <dappAddress>',
    'submit work on a specific smart contract address',
  )
  .parse(process.argv);

submit(cli.network, 'iexecSubmit', cli.args[0], cli.dapp).catch(handleError('submit'));
