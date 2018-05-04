#!/usr/bin/env node

const cli = require('commander');
const hub = require('./hub');
const { handleError, help } = require('./cli-helper');
const { loadIExecConf, loadChain } = require('./loader');

const objName = 'category';

cli
  .option('--chain <name>', 'network name', 'ropsten')
  .option(
    '--hub <address>',
    'interact with the iExec Hub at a custom smart contract address',
  );

cli
  .command('create')
  .description(`create a new ${objName}`)
  .action(async () => {
    try {
      const [iexecConf, chain] = await Promise.all([
        loadIExecConf(),
        loadChain(cli.chain),
      ]);
      await hub.createCategory(cli.hub, iexecConf[objName], chain.contracts);
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('show')
  .description(`show all details about a ${objName}`)
  .arguments('<index>')
  .action(async (index) => {
    try {
      const chain = await loadChain(cli.chain);
      await hub.showCategory(index, cli.hub, chain.contracts, objName);
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('count')
  .description('count categories')
  .action(async () => {
    try {
      const chain = await loadChain(cli.chain);
      await hub.countCategory(cli.hub, chain.contracts, objName);
    } catch (error) {
      handleError(error, objName);
    }
  });

help(cli);
