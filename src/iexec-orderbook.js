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
const { http, isEthAddress } = require('./utils');
const { Keystore } = require('./keystore');

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
      const body = Object.assign({ chainId: chain.id }, { app: address });
      const response = await http.get('orderbook/app', body);
      const appOrders = response.appOrderbook
        ? response.appOrderbook.map(e => ({
          orderHash: e.orderHash,
          app: e.order.app,
          price: e.order.appprice,
          remaining: e.remaining,
          publicationTimestamp: e.publicationTimestamp,
        }))
        : [];

      const successMessage = appOrders.length > 0
        ? `Orderbook\napp orders details:${pretty(appOrders)}\n`
        : 'Empty order book';

      spinner.succeed(successMessage, {
        raw: {
          appOrders: response.appOrderbook,
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
      const body = Object.assign({ chainId: chain.id }, { dataset: address });
      const response = await http.get('orderbook/dataset', body);
      const datasetOrders = response.datasetOrderbook
        ? response.datasetOrderbook.map(e => ({
          orderHash: e.orderHash,
          dataset: e.order.dataset,
          price: e.order.datasetprice,
          remaining: e.remaining,
          publicationTimestamp: e.publicationTimestamp,
        }))
        : [];

      const successMessage = datasetOrders.length > 0
        ? `Orderbook\ndataset orders details:${pretty(datasetOrders)}\n`
        : 'Empty order book';

      spinner.succeed(successMessage, {
        raw: {
          datasetOrders: response.datasetOrderbook,
        },
      });
      spinner.info('trade in the browser at https://market.iex.ec');
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const orderbookWorkerpool = cli.command('workerpool [address]');
addGlobalOptions(orderbookWorkerpool);
orderbookWorkerpool
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
      const body = Object.assign(
        { chainId: chain.id },
        { category: cmd.category },
        address && { workerpool: address },
      );
      const response = await http.get('orderbook/workerpool', body);
      const workerpoolOrders = response.workerpoolOrderbook
        ? response.workerpoolOrderbook.map(e => ({
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
        : 'Empty order book';

      spinner.succeed(successMessage, {
        raw: {
          workerpoolOrders: response.workerpoolOrderbook,
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
      const body = Object.assign(
        { chainId: chain.id },
        { category: cmd.category },
        address && { requester: address },
      );
      const response = await http.get('orderbook/request', body);
      const requestOrders = response.requestOrderbook
        ? response.requestOrderbook.map(e => ({
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
        : 'Empty order book';

      spinner.succeed(successMessage, {
        raw: {
          requestOrders: response.requestOrderbook,
        },
      });
      spinner.info('trade in the browser at https://market.iex.ec');
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
