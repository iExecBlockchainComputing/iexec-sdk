#!/usr/bin/env node

const cli = require('commander');
const {
  help,
  handleError,
  desc,
  option,
  Spinner,
  pretty,
} = require('./cli-helper');
const hub = require('./hub');
const { loadIExecConf, saveObj, saveDeployedObj } = require('./fs');
const { load } = require('./keystore');
const { loadChain } = require('./chains.js');

const objName = 'workerPool';

cli
  .option(...option.chain())
  .option(...option.hub())
  .option(...option.user());

cli
  .command('init')
  .description(desc.initObj(objName))
  .action(async () => {
    const spinner = Spinner();
    try {
      const { saved, fileName } = await saveObj(objName);
      spinner.succeed(`Saved default ${objName} in "${fileName}", you can edit it:${pretty(saved)}`);
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('deploy')
  .description(desc.deployObj(objName))
  .action(async () => {
    try {
      const [chain, iexecConf] = await Promise.all([
        loadChain(cli.chain),
        loadIExecConf(),
      ]);
      const hubAddress = cli.hub || chain.hub;
      const events = await hub.createObj(objName)(
        chain.contracts,
        iexecConf[objName],
        {
          hub: hubAddress,
        },
      );
      await saveDeployedObj(objName, chain.id, events[0][objName]);
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('show <addressOrIndex>')
  .description(desc.showObj(objName))
  .action(async (addressOrIndex) => {
    try {
      const [chain, { address }] = await Promise.all([
        loadChain(cli.chain),
        load(),
      ]);
      const hubAddress = cli.hub || chain.hub;
      const userAddress = cli.user || address;

      await hub.showObj(objName)(chain.contracts, addressOrIndex, userAddress, {
        hub: hubAddress,
      });
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('count')
  .description(desc.countObj(objName))
  .action(async () => {
    try {
      const [chain, { address }] = await Promise.all([
        loadChain(cli.chain),
        load(),
      ]);
      const hubAddress = cli.hub || chain.hub;
      const userAddress = cli.user || address;

      await hub.countObj(objName)(chain.contracts, userAddress, {
        hub: hubAddress,
      });
    } catch (error) {
      handleError(error, objName);
    }
  });

help(cli);
