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
const { http } = require('./utils');
const { Keystore } = require('./keystore');

const debug = Debug('iexec:iexec-orderbook');
const objName = 'orderbook';

const show = cli.command(command.show());
addGlobalOptions(show);
show
  .option(...option.chain())
  .option(...option.category())
  .option(...option.workerpool())
  .description(desc.showObj(objName, 'marketplace'))
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      if (cmd.category === undefined) throw new Error('Missing option --category');

      const chain = await loadChain(cmd.chain, Keystore({ isSigner: false }), {
        spinner,
      });
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
        category: e.order.category,
        price: e.order.workerpoolprice,
        remaining: e.remaining,
        workerpool: e.order.workerpool,
        publicationTimestamp: e.publicationTimestamp,
      }));
      const requestOrders = response.orderbook.requestOrders.map(e => ({
        orderHash: e.orderHash,
        category: e.order.category,
        price: e.order.workerpoolmaxprice,
        remaining: e.remaining,
        publicationTimestamp: e.publicationTimestamp,
      }));
      let successMessage;
      if (workerpoolOrders.length !== 0 || requestOrders.length !== 0) {
        successMessage = 'Orderbook\n';
        if (workerpoolOrders.length !== 0) {
          successMessage += `workerpool orders details:${pretty(
            workerpoolOrders,
          )}\n`;
        }
        if (requestOrders.length !== 0) {
          successMessage += `request orders details:${pretty(requestOrders)}\n`;
        }
      } else successMessage = 'Empty order book';
      debug('successMessage', successMessage);
      spinner.succeed(successMessage, {
        raw: {
          workerpoolOrders: response.orderbook.workerpoolOrders,
          requestOrders: response.orderbook.requestOrders,
        },
      });
      spinner.info('trade in the browser at https://market.iex.ec');
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
