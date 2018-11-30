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
  info,
  command,
} = require('./cli-helper');
const { loadChain } = require('./chains');
const { http } = require('./utils');

const debug = Debug('iexec:iexec-orderbook');
const objName = 'orderbook';

cli
  .command(command.show())
  .option(...option.chain())
  .option(...option.category())
  .option(...option.workerpool())
  .description(desc.showObj(objName, 'marketplace'))
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      const chain = await loadChain(cmd.chain);
      debug('cmd.id', cmd.id);
      debug('cmd.category', cmd.category);
      debug('cmd.workerpool', cmd.workerpool);
      spinner.start(info.showing(objName));
      const response = await http.get('orderbook', {
        chainID: chain.id,
        category: cmd.category,
        workerpool: cmd.workerpool,
      });
      debug('response', response);
      const workerpoolOrders = response.orderbook.workerpoolOrders.map(e => ({
        orderHash: e.orderHash,
        category: e.category,
        price: e.workerpoolprice,
        remainingVolume: e.remain,
        workerpool: e.workerpool,
        publicationTimestamp: e.publicationTimestamp,
      }));
      const requestOrders = response.orderbook.requestOrders.map(e => ({
        orderHash: e.orderHash,
        category: e.category,
        price: e.workerpoolmaxprice,
        remainingVolume: e.remain,
        workerpool: e.workerpool,
        publicationTimestamp: e.publicationTimestamp,
      }));
      if (workerpoolOrders.length !== 0 || requestOrders.length !== 0) {
        if (workerpoolOrders.length !== 0) {
          spinner.succeed(
            `workerpool orders details:${pretty(workerpoolOrders)}`,
          );
        }
        if (requestOrders.length !== 0) spinner.succeed(`request orders details:${pretty(requestOrders)}`);
      } else spinner.succeed('empty order book');
      spinner.info('trade in the browser at https://market.iex.ec');
    } catch (error) {
      handleError(error, cli);
    }
  });

help(cli);
