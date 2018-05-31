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
  .option(...option.pool())
  .description(desc.showObj(objName, 'marketplace'))
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      const chain = await loadChain(cmd.chain);
      debug('cmd.id', cmd.id);
      debug('cmd.category', cmd.category);
      debug('cmd.pool', cmd.pool);
      spinner.start(info.showing(objName));
      const orderbook = await http.get('orderbook', {
        chainID: chain.id,
        category: cmd.category,
        workerPool: cmd.pool,
      });
      debug('orderbook', orderbook);
      const orders = orderbook.orders.map(e => ({
        id: e.marketorderIdx,
        price: e.value,
        pool: e.workerpool,
        category: e.category,
        timestamp: e.blockTimestamp,
      }));
      if (orders.length !== 0) {
        spinner.succeed(`${objName} details:${pretty(orders)}`);
      } else spinner.succeed('empty order book');
      spinner.info('trade in the browser at https://market.iex.ec');
    } catch (error) {
      handleError(error, cli);
    }
  });

help(cli);
