#!/usr/bin/env node

const cli = require('commander');
const {
  help,
  handleError,
  command,
  desc,
  option,
  Spinner,
  pretty,
  info,
} = require('./cli-helper');
const hub = require('./hub');
const order = require('./order');
const {
  loadIExecConf,
  initObj,
  saveDeployedObj,
  loadDeployedObj,
  saveSignedOrder,
  ORDERS_FILE_NAME,
} = require('./fs');
const { load } = require('./keystore');
const { loadChain } = require('./chains');
const { getEIP712Domain } = require('./sig-utils');

const objName = 'workerPool';
const pocoName = 'pool';
const orderName = 'poolorder';

cli
  .command('init')
  .description(desc.initObj(objName))
  .action(async () => {
    const spinner = Spinner();
    try {
      const { saved, fileName } = await initObj(objName);
      spinner.succeed(
        `Saved default ${objName} in "${fileName}", you can edit it:${pretty(
          saved,
        )}`,
      );
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command('deploy')
  .option(...option.chain())
  .description(desc.deployObj(objName))
  .action(async (cmd) => {
    try {
      const [chain, iexecConf] = await Promise.all([
        loadChain(cmd.chain),
        loadIExecConf(),
      ]);

      const logs = await hub.createObj(pocoName)(
        chain.contracts,
        iexecConf[objName],
      );
      await saveDeployedObj(objName, chain.id, logs[0][pocoName]);
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command('show [addressOrIndex]')
  .option(...option.chain())
  .option(...option.user())
  .description(desc.showObj(objName))
  .action(async (cliAddressOrIndex, cmd) => {
    try {
      const [chain, { address }, deployedObj] = await Promise.all([
        loadChain(cmd.chain),
        load(),
        loadDeployedObj(objName),
      ]);

      const userAddress = cmd.user || address;
      const addressOrIndex = cliAddressOrIndex || deployedObj[chain.id];

      if (!addressOrIndex) throw Error(info.missingAddress(objName));

      await hub.showObj(pocoName)(chain.contracts, addressOrIndex, userAddress);
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command('count')
  .option(...option.chain())
  .option(...option.user())
  .description(desc.countObj(objName))
  .action(async (cmd) => {
    try {
      const [chain, { address }] = await Promise.all([
        loadChain(cmd.chain),
        load(),
      ]);
      const userAddress = cmd.user || address;

      await hub.countObj(pocoName)(chain.contracts, userAddress);
    } catch (error) {
      handleError(error, cli);
    }
  });


help(cli);
