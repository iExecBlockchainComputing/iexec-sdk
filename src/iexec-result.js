#!/usr/bin/env node

const cli = require('commander');
const fetchResults = require('./result');
const { handleError, help } = require('./cli-helper');

cli
  .option('--chain, --network <name>', 'network name', 'ropsten')
  .option('--save [fileName]', 'save the result to a file')
  .option('--watch', 'watch the status of a work until COMPLETED')
  .arguments('<txHash>')
  .action(txHash =>
    fetchResults(txHash, cli.network, cli.save, cli.watch).catch(handleError('result')));

help(cli, { checkWrongArgs: false });
