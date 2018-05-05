#!/usr/bin/env node

const cli = require('commander');
const hub = require('./hub');
const {
  handleError, help, desc, option,
} = require('./cli-helper');
const { loadIExecConf } = require('./fs');
const { loadChain } = require('./chains.js');

const objName = 'category';

cli.option(...option.chain()).option(...option.hub());

cli
  .command('create')
  .description(desc.createObj(objName))
  .action(async () => {
    try {
      const [iexecConf, chain] = await Promise.all([
        loadIExecConf(),
        loadChain(cli.chain),
      ]);
      await hub.createCategory(chain.contracts, iexecConf[objName], {
        hub: cli.hub,
      });
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('show <index>')
  .description(desc.showObj(objName, 'hub'))
  .action(async (index) => {
    try {
      const chain = await loadChain(cli.chain);
      await hub.showCategory(chain.contracts, index, { hub: cli.hub });
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('count')
  .description(desc.showObj(objName, 'hub'))
  .action(async () => {
    try {
      const chain = await loadChain(cli.chain);
      await hub.countCategory(chain.contracts, { at: cli.hub });
    } catch (error) {
      handleError(error, objName);
    }
  });

help(cli);
