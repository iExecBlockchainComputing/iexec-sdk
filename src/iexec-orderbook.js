#!/usr/bin/env node

const Debug = require('debug');
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
  command,
} = require('./cli-helper');
const { loadChain } = require('./chains');
const { http, isEthAddress } = require('./utils');
const { Keystore } = require('./keystore');

const debug = Debug('iexec:iexec-orderbook');
const objName = 'orderbook';

const show = cli.command(command.show());
addGlobalOptions(show);
show
  .option(...option.chain())
  .option(...option.category())
  .option(...option.appOrderbook())
  .option(...option.datasetOrderbook())
  .option(...option.workerpoolOrderbook())
  .option(...option.requesterOrderbook())
  .description(desc.showObj(objName, 'marketplace'))
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      if (!cmd.category && !cmd.app && !cmd.dataset) {
        throw new Error(
          `one of the following options is required (${option.category()[0]} ${
            option.workerpoolOrderbook()[0]
          }|${option.category()[0]} ${option.requesterOrderbook()[0]}|${
            option.appOrderbook()[0]
          }|${option.datasetOrderbook()[0]})`,
        );
      }

      const chain = await loadChain(cmd.chain, Keystore({ isSigner: false }), {
        spinner,
      });
      if (cmd.workerpool) isEthAddress(cmd.workerpool, { strict: true });
      if (cmd.app) isEthAddress(cmd.app, { strict: true });
      if (cmd.dataset) isEthAddress(cmd.dataset, { strict: true });

      spinner.start(info.showing(objName));
      const body = Object.assign(
        { chainID: chain.id },
        { category: cmd.category },
        { workerpool: cmd.workerpool },
        { requester: cmd.requester },
        { app: cmd.app },
        { dataset: cmd.dataset },
      );
      const response = await http.get('orderbook', body);
      const workerpoolOrders = response.orderbook.workerpoolOrders
        ? response.orderbook.workerpoolOrders.map(e => ({
          orderHash: e.orderHash,
          workerpool: e.order.workerpool,
          category: e.order.category,
          price: e.order.workerpoolprice,
          remaining: e.remaining,
          publicationTimestamp: e.publicationTimestamp,
        }))
        : [];
      const requestOrders = response.orderbook.requestOrders
        ? response.orderbook.requestOrders.map(e => ({
          orderHash: e.orderHash,
          requester: e.order.requester,
          app: e.order.app,
          dataset: e.order.dataset,
          beneficiary: e.order.beneficiary,
          category: e.order.category,
          price: e.order.workerpoolmaxprice,
          remaining: e.remaining,
          publicationTimestamp: e.publicationTimestamp,
        }))
        : [];
      const appOrders = response.orderbook.appOrders
        ? response.orderbook.appOrders.map(e => ({
          orderHash: e.orderHash,
          app: e.order.app,
          category: e.order.category,
          price: e.order.appprice,
          remaining: e.remaining,
          publicationTimestamp: e.publicationTimestamp,
        }))
        : [];
      const datasetOrders = response.orderbook.datasetOrders
        ? response.orderbook.datasetOrders.map(e => ({
          orderHash: e.orderHash,
          dataset: e.order.dataset,
          category: e.order.category,
          price: e.order.datasetprice,
          remaining: e.remaining,
          publicationTimestamp: e.publicationTimestamp,
        }))
        : [];

      let successMessage;
      if (
        workerpoolOrders.length !== 0
        || requestOrders.length !== 0
        || appOrders.length !== 0
        || datasetOrders.length !== 0
      ) {
        successMessage = 'Orderbook\n';
        if (workerpoolOrders.length !== 0) {
          successMessage += `workerpool orders details:${pretty(
            workerpoolOrders,
          )}\n`;
        }
        if (requestOrders.length !== 0) {
          successMessage += `request orders details:${pretty(requestOrders)}\n`;
        }
        if (appOrders.length !== 0) {
          successMessage += `app orders details:${pretty(appOrders)}\n`;
        }
        if (datasetOrders.length !== 0) {
          successMessage += `dataset orders details:${pretty(datasetOrders)}\n`;
        }
      } else successMessage = 'Empty order book';
      spinner.succeed(successMessage, {
        raw: {
          workerpoolOrders: response.orderbook.workerpoolOrders,
          requestOrders: response.orderbook.requestOrders,
          appOrders: response.orderbook.appOrders,
          datasetOrders: response.orderbook.datasetOrders,
        },
      });
      spinner.info('trade in the browser at https://market.iex.ec');
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
