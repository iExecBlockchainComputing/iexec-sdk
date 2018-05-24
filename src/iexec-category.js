#!/usr/bin/env node

const cli = require('commander');
const hub = require('./hub');
const {
  handleError,
  help,
  desc,
  option,
  Spinner,
  pretty,
} = require('./cli-helper');
const { loadIExecConf, initObj } = require('./fs');
const { loadChain } = require('./chains.js');

const objName = 'category';

cli
  .command('init')
  .description(desc.initObj(objName))
  .action(async () => {
    const spinner = Spinner();
    try {
      const { saved, fileName } = await initObj(objName);
      spinner.succeed(`Saved default ${objName} in "${fileName}", you can edit it:${pretty(saved)}`);
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command('create')
  .option(...option.chain())
  .option(...option.hub())
  .description(desc.createObj(objName))
  .action(async (cmd) => {
    try {
      const [iexecConf, chain] = await Promise.all([
        loadIExecConf(),
        loadChain(cmd.chain),
      ]);
      const hubAddress = cmd.hub || chain.hub;
      await hub.createCategory(chain.contracts, iexecConf[objName], {
        hub: hubAddress,
      });
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command('show <index>')
  .option(...option.chain())
  .option(...option.hub())
  .description(desc.showObj(objName, 'hub'))
  .action(async (index, cmd) => {
    try {
      const chain = await loadChain(cmd.chain);
      const hubAddress = cmd.hub || chain.hub;
      await hub.showCategory(chain.contracts, index, { hub: hubAddress });
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command('count')
  .option(...option.chain())
  .option(...option.hub())
  .description(desc.showObj(objName, 'hub'))
  .action(async (cmd) => {
    try {
      const chain = await loadChain(cmd.chain);
      const hubAddress = cmd.hub || chain.hub;
      await hub.countCategory(chain.contracts, { at: hubAddress });
    } catch (error) {
      handleError(error, cli);
    }
  });

help(cli);
