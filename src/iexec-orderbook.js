#!/usr/bin/env node

const cli = require('commander');
const {
  help,
  addGlobalOptions,
  checkUpdate,
  handleError,
  desc,
  option,
  Spinner,
  pretty,
  info,
  isEthAddress,
  getPropertyFormChain,
} = require('./cli-helper');
const { loadChain } = require('./chains');
const orderbook = require('./orderbook');

const objName = 'orderbook';

cli.name('iexec orderbook').usage('<command> [options]');

const orderbookApp = cli.command('app <address>');
addGlobalOptions(orderbookApp);
orderbookApp
  .option(...option.chain())
  .option(...option.orderbookDataset())
  .option(...option.orderbookWorkerpool())
  .option(...option.orderbookRequester())
  .option(...option.tag())
  .option(...option.requiredTag())
  .option(...option.maxTag())
  .description(desc.showObj('app orderbook', 'marketplace'))
  .action(async (address, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const chain = await loadChain(cmd.chain, {
        spinner,
      });
      const {
        dataset, workerpool, requester, tag, requireTag, maxTag,
      } = cmd;
      if (address) isEthAddress(address, { strict: true });
      if (dataset) isEthAddress(dataset, { strict: true });
      if (workerpool) isEthAddress(workerpool, { strict: true });
      if (requester) isEthAddress(requester, { strict: true });

      spinner.start(info.showing(objName));
      const response = await orderbook.fetchAppOrderbook(
        chain.contracts,
        getPropertyFormChain(chain, 'iexecGateway'),
        address,
        {
          dataset,
          workerpool,
          requester,
          minTag: tag !== undefined ? tag : requireTag,
          maxTag: tag !== undefined ? tag : maxTag,
        },
      );
      const appOrders = response.appOrders
        ? response.appOrders.map(e => ({
          orderHash: e.orderHash,
          app: e.order.app,
          tag: e.order.tag,
          price: e.order.appprice,
          remaining: e.remaining,
        }))
        : [];

      const successMessage = appOrders.length > 0
        ? `Orderbook\nApp orders details:${pretty(appOrders)}\n`
        : 'Empty orderbook';

      spinner.succeed(successMessage, {
        raw: {
          appOrders: response.appOrders,
        },
      });
      spinner.info('Trade in the browser at https://market.iex.ec');
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const orderbookDataset = cli.command('dataset <address>');
addGlobalOptions(orderbookDataset);
orderbookDataset
  .option(...option.chain())
  .option(...option.orderbookApp())
  .option(...option.orderbookWorkerpool())
  .option(...option.orderbookRequester())
  .option(...option.tag())
  .option(...option.requiredTag())
  .option(...option.maxTag())
  .description(desc.showObj('dataset orderbook', 'marketplace'))
  .action(async (address, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const chain = await loadChain(cmd.chain, {
        spinner,
      });
      const { app, workerpool, requester } = cmd;
      if (address) isEthAddress(address, { strict: true });
      if (app) isEthAddress(app, { strict: true });
      if (workerpool) isEthAddress(workerpool, { strict: true });
      if (requester) isEthAddress(requester, { strict: true });

      spinner.start(info.showing(objName));
      const { tag, maxTag, requireTag } = cmd;
      const response = await orderbook.fetchDatasetOrderbook(
        chain.contracts,
        getPropertyFormChain(chain, 'iexecGateway'),
        address,
        {
          app,
          workerpool,
          requester,
          minTag: tag !== undefined ? tag : requireTag,
          maxTag: tag !== undefined ? tag : maxTag,
        },
      );
      const datasetOrders = response.datasetOrders
        ? response.datasetOrders.map(e => ({
          orderHash: e.orderHash,
          dataset: e.order.dataset,
          tag: e.order.tag,
          apprestrict: e.order.apprestrict,
          price: e.order.datasetprice,
          remaining: e.remaining,
        }))
        : [];

      const successMessage = datasetOrders.length > 0
        ? `Orderbook\nDataset orders details:${pretty(datasetOrders)}\n`
        : 'Empty orderbook';

      spinner.succeed(successMessage, {
        raw: {
          datasetOrders: response.datasetOrders,
        },
      });
      spinner.info('Trade in the browser at https://market.iex.ec');
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const orderbookWorkerpool = cli.command('workerpool [address]');
addGlobalOptions(orderbookWorkerpool);
orderbookWorkerpool
  .option(...option.chain())
  .option(...option.category())
  .option(...option.tag())
  .option(...option.requiredTag())
  .option(...option.maxTag())
  .description(desc.showObj('workerpools orderbook', 'marketplace'))
  .action(async (address, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const chain = await loadChain(cmd.chain, {
        spinner,
      });
      if (address) isEthAddress(address, { strict: true });
      if (!cmd.category) throw Error(`Missing option ${option.category()[0]}`);
      spinner.start(info.showing(objName));
      const { tag, maxTag, requireTag } = cmd;
      const response = await orderbook.fetchWorkerpoolOrderbook(
        chain.contracts,
        getPropertyFormChain(chain, 'iexecGateway'),
        cmd.category,
        {
          workerpoolAddress: address,
          minTag: tag !== undefined ? tag : requireTag,
          maxTag: tag !== undefined ? tag : maxTag,
        },
      );
      const workerpoolOrders = response.workerpoolOrders
        ? response.workerpoolOrders.map(e => ({
          orderHash: e.orderHash,
          workerpool: e.order.workerpool,
          category: e.order.category,
          tag: e.order.tag,
          trust: e.order.trust,
          price: e.order.workerpoolprice,
          remaining: e.remaining,
        }))
        : [];

      const successMessage = workerpoolOrders.length > 0
        ? `Orderbook\nWorkerpool orders details:${pretty(workerpoolOrders)}\n`
        : 'Empty orderbook';

      spinner.succeed(successMessage, {
        raw: {
          workerpoolOrders: response.workerpoolOrders,
        },
      });
      spinner.info('Trade in the browser at https://market.iex.ec');
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const orderbookRequester = cli.command('requester [address]');
addGlobalOptions(orderbookRequester);
orderbookRequester
  .option(...option.chain())
  .option(...option.category())
  .option(...option.tag())
  .option(...option.requiredTag())
  .option(...option.maxTag())
  .description(desc.showObj('requesters orderbook', 'marketplace'))
  .action(async (address, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const chain = await loadChain(cmd.chain, {
        spinner,
      });
      if (address) isEthAddress(address, { strict: true });
      if (!cmd.category) throw Error(`Missing option ${option.category()[0]}`);

      spinner.start(info.showing(objName));
      const { tag, maxTag, requireTag } = cmd;
      const response = await orderbook.fetchRequestOrderbook(
        chain.contracts,
        getPropertyFormChain(chain, 'iexecGateway'),
        cmd.category,
        {
          requesterAddress: address,
          minTag: tag !== undefined ? tag : requireTag,
          maxTag: tag !== undefined ? tag : maxTag,
        },
      );
      const requestOrders = response.requestOrders
        ? response.requestOrders.map(e => ({
          orderHash: e.orderHash,
          requester: e.order.requester,
          app: e.order.app,
          dataset: e.order.dataset,
          beneficiary: e.order.beneficiary,
          category: e.order.category,
          tag: e.order.tag,
          trust: e.order.trust,
          price: e.order.workerpoolmaxprice,
          remaining: e.remaining,
        }))
        : [];

      const successMessage = requestOrders.length > 0
        ? `Orderbook\nRequest orders details:${pretty(requestOrders)}\n`
        : 'Empty orderbook';

      spinner.succeed(successMessage, {
        raw: {
          requestOrders: response.requestOrders,
        },
      });
      spinner.info('Trade in the browser at https://market.iex.ec');
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
