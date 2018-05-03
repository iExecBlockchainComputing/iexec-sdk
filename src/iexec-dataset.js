#!/usr/bin/env node

const cli = require('commander');
const help = require('./help');
const hub = require('./hub');

cli
  .option('--chain <name>', 'chain name', 'ropsten')
  .option(
    '--hub [address]',
    'interact with the iExec Hub at a specific smart contract address',
  )
  .option('--user [address]', 'custom user address parameter');

cli
  .command('create')
  .description('create a new dataset')
  .action(() => {
    console.log(cli);
    return hub.createObj('dataset')(cli.chain, cli.hub);
  });

cli
  .command('show')
  .description('show all details about an dataset')
  .arguments('<addressOrIndex>')
  .action(addressOrIndex =>
    hub.showObj('dataset')(cli.chain, addressOrIndex, cli.hub, cli.user));

cli
  .command('count')
  .description('count a user datasets')
  .action(() => hub.countObj('dataset')(cli.chain, cli.user, cli.hub));

help(cli);
