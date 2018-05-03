#!/usr/bin/env node

const cli = require('commander');
const submit = require('./submit');
const { handleError } = require('./cli-helper');
const { help } = require('./cli-helper');

cli
  .option('--chain, --network <name>', 'network name', 'ropsten')
  .option(
    '--dapp <dappAddress>',
    'submit work on a specific smart contract address',
  );

help(cli, { checkNoArgs: false, checkWrongArgs: false });

submit(cli.network, 'iexecSubmit', cli.args[0], cli.dapp).catch(handleError('submit'));
