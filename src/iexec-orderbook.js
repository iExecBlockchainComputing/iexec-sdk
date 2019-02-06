#!/usr/bin/env node

const cli = require('commander');
const {
  help,
  addGlobalOptions,
  handleError,
  desc,
  option,
  Spinner,
  pretty,
  info,
} = require('./cli-helper');
const { loadChain } = require('./chains');
const { isEthAddress } = require('./utils');
const { Keystore } = require('./keystore');
const orderbook = require('./orderbook');

const objName = 'orderbook';

const orderbookApp = cli.command('app <address>');
addGlobalOptions(orderbookApp);
orderbookApp
  .option(...option.chain())
  .description(desc.showObj('app orderbook', 'marketplace'))
  .action(async (address, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const chain = await loadChain(cmd.chain, Keystore({ isSigner: false }), {
        spinner,
      });
      if (address) isEthAddress(address, { strict: true });

      spinner.start(info.showing(objName));
      const response = await orderbook.fetchAppOrderbook(chain.id, address);
      const appOrders = response.appOrders
        ? response.appOrders.map(e => ({
          orderHash: e.orderHash,
          app: e.order.app,
          price: e.order.appprice,
          remaining: e.remaining,
          publicationTimestamp: e.publicationTimestamp,
        }))
        : [];

      const successMessage = appOrders.length > 0
        ? `Orderbook\napp orders details:${pretty(appOrders)}\n`
        : 'Empty orderbook';

      spinner.succeed(successMessage, {
        raw: {
          appOrders: response.appOrders,
        },
      });
      spinner.info('trade in the browser at https://market.iex.ec');
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const orderbookDataset = cli.command('dataset <address>');
addGlobalOptions(orderbookDataset);
orderbookDataset
  .option(...option.chain())
  .description(desc.showObj('dataset orderbook', 'marketplace'))
  .action(async (address, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const chain = await loadChain(cmd.chain, Keystore({ isSigner: false }), {
        spinner,
      });
      if (address) isEthAddress(address, { strict: true });

      spinner.start(info.showing(objName));
      const response = await orderbook.fetchDatasetOrderbook(chain.id, address);
      const datasetOrders = response.datasetOrders
        ? response.datasetOrders.map(e => ({
          orderHash: e.orderHash,
          dataset: e.order.dataset,
          price: e.order.datasetprice,
          remaining: e.remaining,
          publicationTimestamp: e.publicationTimestamp,
        }))
        : [];

      const successMessage = datasetOrders.length > 0
        ? `Orderbook\ndataset orders details:${pretty(datasetOrders)}\n`
        : 'Empty orderbook';

      spinner.succeed(successMessage, {
        raw: {
          datasetOrders: response.datasetOrders,
        },
      });
      spinner.info('trade in the browser at https://market.iex.ec');
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const worderbookWorkerpool = cli.command('workerpool [address]');
addGlobalOptions(worderbookWorkerpool);
worderbookWorkerpool
  .option(...option.chain())
  .option(...option.category())
  .description(desc.showObj('workerpools orderbook', 'marketplace'))
  .action(async (address, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const chain = await loadChain(cmd.chain, Keystore({ isSigner: false }), {
        spinner,
      });
      if (address) isEthAddress(address, { strict: true });
      if (!cmd.category) throw Error(`Missing option ${option.category()[0]}`);

      spinner.start(info.showing(objName));
      const response = await orderbook.fetchWorkerpoolOrderbook(
        chain.id,
        cmd.category,
        { address },
      );
      const workerpoolOrders = response.workerpoolOrders
        ? response.workerpoolOrders.map(e => ({
          orderHash: e.orderHash,
          workerpool: e.order.workerpool,
          category: e.order.category,
          trust: e.order.trust,
          price: e.order.workerpoolprice,
          remaining: e.remaining,
          publicationTimestamp: e.publicationTimestamp,
        }))
        : [];

      const successMessage = workerpoolOrders.length > 0
        ? `Orderbook\nworkerpool orders details:${pretty(workerpoolOrders)}\n`
        : 'Empty orderbook';

      spinner.succeed(successMessage, {
        raw: {
          workerpoolOrders: response.workerpoolOrders,
        },
      });
      spinner.info('trade in the browser at https://market.iex.ec');
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const orderbookRequester = cli.command('requester [address]');
addGlobalOptions(orderbookRequester);
orderbookRequester
  .option(...option.chain())
  .option(...option.category())
  .description(desc.showObj('requesters orderbook', 'marketplace'))
  .action(async (address, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const chain = await loadChain(cmd.chain, Keystore({ isSigner: false }), {
        spinner,
      });
      if (address) isEthAddress(address, { strict: true });
      if (!cmd.category) throw Error(`Missing option ${option.category()[0]}`);

      spinner.start(info.showing(objName));
      const response = await orderbook.fetchRequestOrderbook(
        chain.id,
        cmd.category,
        { requesterAddress: address },
      );
      const requestOrders = response.requestOrders
        ? response.requestOrders.map(e => ({
          orderHash: e.orderHash,
          requester: e.order.requester,
          app: e.order.app,
          dataset: e.order.dataset,
          beneficiary: e.order.beneficiary,
          category: e.order.category,
          trust: e.order.trust,
          price: e.order.workerpoolmaxprice,
          remaining: e.remaining,
          publicationTimestamp: e.publicationTimestamp,
        }))
        : [];

      const successMessage = requestOrders.length > 0
        ? `Orderbook\nrequest orders details:${pretty(requestOrders)}\n`
        : 'Empty orderbook';

      spinner.succeed(successMessage, {
        raw: {
          requestOrders: response.requestOrders,
        },
      });
      spinner.info('trade in the browser at https://market.iex.ec');
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
