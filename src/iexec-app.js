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
const {
  loadIExecConf,
  initObj,
  saveDeployedObj,
  loadDeployedObj,
  saveSignedOrder,
  loadSignedOrders,
  ORDERS_FILE_NAME,
} = require('./fs');
const { load } = require('./keystore');
const { getEIP712Domain } = require('./sig-utils');
const { loadChain } = require('./chains');
const order = require('./order');

const objName = 'app';
const pocoName = 'dapp';
const orderName = objName.concat('order');

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

cli
  .command('initorder')
  .description(desc.initObj(orderName))
  .action(async () => {
    const spinner = Spinner();
    try {
      const { saved, fileName } = await initObj(orderName);
      spinner.succeed(
        `Saved default ${objName} order in "${fileName}", you can edit it:${pretty(
          saved,
        )}`,
      );
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command(command.signOrder())
  .option(...option.chain())
  .description(desc.sign(orderName))
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      const [chain, iexecConf] = await Promise.all([
        loadChain(cmd.chain),
        loadIExecConf(),
      ]);
      const orderObj = iexecConf[orderName];

      await order.checkContractOwner(orderName, orderObj, chain.contracts);

      const clerkAddress = await chain.contracts.fetchClerkAddress();
      const domainObj = getEIP712Domain(chain.contracts.chainID, clerkAddress);
      const signedOrder = await order.signAppOrder(orderObj, domainObj);

      await saveSignedOrder(orderName, chain.id, signedOrder);
      spinner.succeed(
        `${orderName} signed and saved in ${ORDERS_FILE_NAME}, you can share it:${pretty(
          signedOrder,
        )}`,
      );
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command(command.cancelOrder())
  .option(...option.chain())
  .description(desc.cancelOrder(orderName))
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      const [chain, signedOrders] = await Promise.all([
        loadChain(cmd.chain),
        loadSignedOrders(),
      ]);
      const orderToCancel = signedOrders[chain.id][orderName];
      spinner.start('canceling order');
      await order.cancelAppOrder(orderToCancel, chain.contracts);
      // todo delete from ?
      spinner.succeed(`${orderName} successfully canceled`);
    } catch (error) {
      handleError(error, cli);
    }
  });

help(cli);
