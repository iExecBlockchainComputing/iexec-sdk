#!/usr/bin/env node

const cli = require('commander');
const fetchResults = require('./result');

cli
  .option('--chain, --network <name>', 'network name', 'ropsten')
  .arguments('<txHash>')
  .action(txHash => fetchResults(txHash, cli.network).catch(() => {}))
  .parse(process.argv);

if (cli.args.length === 0) cli.help();
