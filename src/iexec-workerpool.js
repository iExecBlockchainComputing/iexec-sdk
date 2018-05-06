#!/usr/bin/env node

const cli = require('commander');
const {
  help, handleError, desc, option,
} = require('./cli-helper');
const hub = require('./hub');
const { loadIExecConf, saveObj } = require('./fs');
const { load } = require('./keystore');
const { loadChain } = require('./chains.js');

const objName = 'workerPool';

cli
  .option(...option.chain())
  .option(...option.hub())
  .option(...option.user());

cli
  .command('create')
  .description(desc.createObj(objName))
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
      await saveObj(objName, chain.id, events[0][objName]);
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
