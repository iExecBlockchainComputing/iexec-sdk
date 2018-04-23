#!/usr/bin/env node

const cli = require('commander');
const airdrop = require('./airdrop');
const help = require('./help');

cli
  .option('--chain, --network <name>', 'network name', 'ropsten')
  .option(
    '--batch <n>',
    'the max number of concurrent transactions',
    parseInt,
    1,
  )
  .arguments('<csvPath>')
  .description('csv file must have one "address" column AND one "amount" column')
  .action(csvPath =>
    airdrop(cli.network, csvPath, cli.batch).catch(() => process.exit(1)));

help(cli, { checkWrongArgs: false });
