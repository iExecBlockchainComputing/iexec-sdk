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
const { loadIExecConf, initOrder } = require('./fs');
const { loadChain } = require('./chains.js');

const debug = Debug('iexec:iexec-order');
const objName = 'order';

cli
  .option(...option.chain())
  .option(...option.hub())
  .option(...option.sell())
  .option(...option.buy());

cli
  .command('init')
  .description(desc.initObj(objName))
  .action(async () => {
    const spinner = Spinner();
    try {
      const side = cli.sell ? 'sell' : 'buy';

      const { saved, fileName } = await initOrder(side);
      spinner.succeed(`Saved default ${objName} in "${fileName}", you can edit it:${pretty(saved)}`);
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command('place')
  .description(desc.placeObj(objName))
  .action(async () => {
    const spinner = Spinner();
    try {
      const [chain, iexecConf] = await Promise.all([
        loadChain(cli.chain),
        loadIExecConf(),
      ]);
      const hubAddress = cli.hub || chain.hub;

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
        sellLimitOrder.workerpool,
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
  .description(desc.fill(objName))
  .action(async (orderID) => {
    const spinner = Spinner();
    try {
      const [chain, iexecConf] = await Promise.all([
        loadChain(cli.chain),
        loadIExecConf(),
      ]);
      const hubAddress = cli.hub || chain.hub;

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

      const args = [
        orderID,
        orderRPC.workerpool,
        buyMarketOrder.app,
        '0x0000000000000000000000000000000000000000',
        buyMarketOrder.params,
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
      ];
      debug('args', args);

      const txHash = await chain.contracts
        .getHubContract({ at: hubAddress })
        .buyForWorkOrder(...args);
      const txReceipt = await chain.contracts.waitForReceipt(txHash);
      const events = chain.contracts.decodeMarketplaceLogs(txReceipt.logs);
      debug('events', events);
      spinner.succeed(`Filled new ${objName} with ID ${events[0][0]}`);
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command(command.cancel())
  .description(desc.cancel(objName))
  .action(async (orderID) => {
    const spinner = Spinner();
    try {
      const chain = await loadChain(cli.chain);
      const hubAddress = cli.hub || chain.hub;

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
  .description(desc.showObj(objName, 'marketplace'))
  .action(async (orderID) => {
    const spinner = Spinner();
    try {
      const chain = await loadChain(cli.chain);
      const hubAddress = cli.hub || chain.hub;

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
  .description(desc.countObj(objName, 'marketplace'))
  .action(async () => {
    const spinner = Spinner();
    try {
      const chain = await loadChain(cli.chain);
      const hubAddress = cli.hub || chain.hub;

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
