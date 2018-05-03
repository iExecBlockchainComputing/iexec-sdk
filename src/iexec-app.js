#!/usr/bin/env node

const cli = require('commander');
const help = require('./help');
const hub = require('./hub');

cli
  .option('--chain <name>', 'chain name', 'ropsten')
  .option(
    '--hub <address>',
    'interact with the iExec Hub at a specific smart contract address',
  )
  .option('--user <address>', 'custom user address parameter');

cli
  .command('create')
  .description('create a new app')
  .action(() => hub.createObj('app')(cli.chain, cli.hub));

cli
  .command('show')
  .description('show all details about an app')
  .arguments('<addressOrIndex>')
  .action(addressOrIndex =>
    hub.showObj('app')(cli.chain, addressOrIndex, cli.hub, cli.user));

cli
  .command('count')
  .description('count a user apps')
  .action(() => hub.countObj('app')(cli.chain, cli.user, cli.hub));

help(cli);
