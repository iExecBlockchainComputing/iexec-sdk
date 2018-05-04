#!/usr/bin/env node

const cli = require('commander');
const hub = require('./hub');
const { handleError, help, info } = require('./cli-helper');
const { loadIExecConf, loadChain } = require('./loader');

const objName = 'category';

cli
  .option('--chain <name>', info.chainName(), 'ropsten')
  .option('--hub <address>', info.hubAddress());

cli
  .command('create')
  .description(info.createObj(objName))
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
  .description(info.showObj(objName, 'hub'))
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
  .description(info.showObj(objName, 'hub'))
  .action(async () => {
    try {
      const chain = await loadChain(cli.chain);
      await hub.countCategory(cli.hub, chain.contracts, objName);
    } catch (error) {
      handleError(error, objName);
    }
  });

help(cli);
