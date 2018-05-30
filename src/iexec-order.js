#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const {
  help,
  handleError,
  desc,
  option,
  Spinner,
  pretty,
  prettyRPC,
  info,
  command,
} = require('./cli-helper');
const {
  loadIExecConf,
  initOrder,
  saveDeployedObj,
  loadDeployedObj,
} = require('./fs');
const { loadChain } = require('./chains.js');

const debug = Debug('iexec:iexec-order');
const objName = 'order';

cli
  .command('init')
  .option(...option.sell())
  .option(...option.buy())
  .description(desc.initObj(objName))
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      debug('cmd.sell', cmd.sell);
      const side = cmd.sell ? 'sell' : 'buy';
      const deployedName = side === 'buy' ? 'app' : 'workerPool';
      const [chain, deployedObj] = await Promise.all([
        loadChain(cmd.chain),
        loadDeployedObj(deployedName),
      ]);
      const address = deployedObj[chain.id];
      const { saved, fileName } = await initOrder(side, {
        ...(address && { [deployedName]: address }),
      });
      spinner.succeed(`Saved default ${objName} in "${fileName}", you can edit it:${pretty(saved)}`);
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command('place')
  .option(...option.chain())
  .option(...option.hub())
  .description(desc.placeObj(objName))
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      const [chain, iexecConf] = await Promise.all([
        loadChain(cmd.chain),
        loadIExecConf(),
      ]);
      const hubAddress = cmd.hub || chain.hub;

      if (!(objName in iexecConf) || !('sell' in iexecConf[objName])) {
        throw Error('Missing order. You probably forgot to run "iexec order init --sell"');
      }
      const sellLimitOrder = iexecConf[objName].sell;
      debug('sellLimitOrder', sellLimitOrder);

      const args = [
        2,
        sellLimitOrder.category,
        0,
        sellLimitOrder.value,
        sellLimitOrder.workerPool,
        sellLimitOrder.volume,
      ];
      debug('args', args);

      spinner.start(info.placing(objName));
      const marketplaceAddress = await chain.contracts.fetchMarketplaceAddress({
        hub: hubAddress,
      });
      const txHash = await chain.contracts
        .getMarketplaceContract({ at: marketplaceAddress })
        .createMarketOrder(...args);
      const txReceipt = await chain.contracts.waitForReceipt(txHash);
      const events = chain.contracts.decodeMarketplaceLogs(txReceipt.logs);
      debug('events', events);
      spinner.succeed(`Placed new ${objName} with ID ${events[0][0]}`);
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command(command.fill())
  .option(...option.chain())
  .option(...option.hub())
  .description(desc.fill(objName))
  .action(async (orderID, cmd) => {
    const spinner = Spinner();
    try {
      const [chain, iexecConf] = await Promise.all([
        loadChain(cmd.chain),
        loadIExecConf(),
      ]);
      const hubAddress = cmd.hub || chain.hub;

      if (!(objName in iexecConf) || !('buy' in iexecConf[objName])) {
        throw Error('Missing order. You probably forgot to run "iexec order init --buy"');
      }

      spinner.start(info.filling(objName));
      const marketplaceAddress = await chain.contracts.fetchMarketplaceAddress({
        hub: hubAddress,
      });
      const orderRPC = await chain.contracts
        .getMarketplaceContract({ at: marketplaceAddress })
        .getMarketOrder(orderID);
      debug('orderRPC', orderRPC);

      const buyMarketOrder = iexecConf[objName].buy;
      debug('buyMarketOrder', buyMarketOrder);
      debug('buyMarketOrder.params', buyMarketOrder.params);
      const workParams = JSON.stringify(buyMarketOrder.params);
      debug('workParams', workParams);
      const args = [
        orderID,
        orderRPC.workerpool,
        buyMarketOrder.app,
        '0x0000000000000000000000000000000000000000',
        workParams,
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
      ];
      debug('args', args);

      const txHash = await chain.contracts
        .getHubContract({ at: hubAddress })
        .buyForWorkOrder(...args);
      const txReceipt = await chain.contracts.waitForReceipt(txHash);
      const events = chain.contracts.decodeHubLogs(txReceipt.logs);
      debug('events', events);
      spinner.succeed(`Filled ${objName} with ID ${orderID}`);
      spinner.succeed(`New work at ${events[0].woid} submitted to workerpool ${
        events[0].workerPool
      }`);
      await saveDeployedObj('work', chain.id, events[0].woid);
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command(command.cancel())
  .option(...option.chain())
  .option(...option.hub())
  .description(desc.cancel(objName))
  .action(async (orderID, cmd) => {
    const spinner = Spinner();
    try {
      const chain = await loadChain(cmd.chain);
      const hubAddress = cmd.hub || chain.hub;

      spinner.start(info.cancelling(objName));
      const marketplaceAddress = await chain.contracts.fetchMarketplaceAddress({
        hub: hubAddress,
      });
      const txHash = await chain.contracts
        .getMarketplaceContract({ at: marketplaceAddress })
        .closeMarketOrder(orderID);
      debug('txHash', txHash);
      const txReceipt = await chain.contracts.waitForReceipt(txHash);
      const events = chain.contracts.decodeMarketplaceLogs(txReceipt.logs);
      debug('events', events);
      spinner.succeed(`Cancelled ${objName} with ID ${events[0][0]}`);
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command('show <orderID>')
  .option(...option.chain())
  .option(...option.hub())
  .description(desc.showObj(objName, 'marketplace'))
  .action(async (orderID, cmd) => {
    const spinner = Spinner();
    try {
      const chain = await loadChain(cmd.chain);
      const hubAddress = cmd.hub || chain.hub;

      spinner.start(info.showing(objName));
      const marketplaceAddress = await chain.contracts.fetchMarketplaceAddress({
        hub: hubAddress,
      });
      const orderRPC = await chain.contracts
        .getMarketplaceContract({ at: marketplaceAddress })
        .getMarketOrder(orderID);
      spinner.succeed(`${objName} with ID ${orderID} details:${prettyRPC(orderRPC)}`);
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command('count')
  .option(...option.chain())
  .option(...option.hub())
  .description(desc.countObj(objName, 'marketplace'))
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      const chain = await loadChain(cmd.chain);
      const hubAddress = cmd.hub || chain.hub;

      spinner.start(info.counting(objName));
      const marketplaceAddress = await chain.contracts.fetchMarketplaceAddress({
        hub: hubAddress,
      });
      const countRPC = await chain.contracts
        .getMarketplaceContract({ at: marketplaceAddress })
        .m_orderCount();

      debug('countRPC', countRPC);
      spinner.succeed(`iExec marketplace has a total of ${countRPC[0]} orders`);
    } catch (error) {
      handleError(error, cli, spinner);
    }
  });

help(cli);
