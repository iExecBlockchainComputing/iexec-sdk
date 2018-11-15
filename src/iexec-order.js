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
  prompt,
} = require('./cli-helper');
const {
  loadIExecConf,
  initOrder,
  saveDeployedObj,
  loadDeployedObj,
  saveSignedOrder,
} = require('./fs');
const { loadChain } = require('./chains.js');
const keystore = require('./keystore');
const order = require('./order');
const { getEIP712Domain } = require('./sig-utils');

const debug = Debug('iexec:iexec-order');
const objName = 'order';

cli
  .command('init')
  .option(...option.initAppOrder())
  .option(...option.initDataOrder())
  .option(...option.initPoolOrder())
  .option(...option.initUserOrder())
  .option(...option.chain())
  .description(desc.initObj(objName))
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      debug('cmd.app', cmd.app);
      debug('cmd.data', cmd.data);
      debug('cmd.pool', cmd.pool);
      debug('cmd.user', cmd.user);
      const initAll = !(cmd.app || cmd.data || cmd.pool || cmd.user);
      debug('initAll', initAll);

      const chain = await loadChain(cmd.chain);
      const initAppOrder = async () => {
        spinner.start('creating apporder');
        const deployedObj = await loadDeployedObj('app');
        const address = deployedObj[chain.id];
        const overwrite = address ? { dapp: address } : {};
        const { saved, fileName } = await initOrder('apporder', overwrite);
        spinner.succeed(
          `Saved default apporder in "${fileName}", you can edit it:${pretty(
            saved,
          )}`,
        );
      };

      const initDataOrder = async () => {
        spinner.start('creating dataorder');
        const deployedObj = await loadDeployedObj('dataset');
        const address = deployedObj[chain.id];
        const overwrite = address ? { data: address } : {};
        const { saved, fileName } = await initOrder('dataorder', overwrite);
        spinner.succeed(
          `Saved default apporder in "${fileName}", you can edit it:${pretty(
            saved,
          )}`,
        );
      };

      const initPoolOrder = async () => {
        spinner.start('creating poolorder');
        const deployedObj = await loadDeployedObj('workerPool');
        const address = deployedObj[chain.id];
        const overwrite = address ? { pool: address } : {};
        const { saved, fileName } = await initOrder('poolorder', overwrite);
        spinner.succeed(
          `Saved default apporder in "${fileName}", you can edit it:${pretty(
            saved,
          )}`,
        );
      };

      const initUserOrder = async () => {
        spinner.start('creating userorder');
        const { address } = await keystore.load();
        const overwrite = address ? { requester: address } : {};
        const { saved, fileName } = await initOrder('userorder', overwrite);
        spinner.succeed(
          `Saved default userorder in "${fileName}", you can edit it:${pretty(
            saved,
          )}`,
        );
      };

      if (cmd.app || initAll) await initAppOrder();
      if (cmd.data || initAll) await initDataOrder();
      if (cmd.pool || initAll) await initPoolOrder();
      if (cmd.user || initAll) await initUserOrder();
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command(command.sign())
  .option(...option.signAppOrder())
  .option(...option.signDataOrder())
  .option(...option.signPoolOrder())
  .option(...option.signUserOrder())
  .option(...option.chain())
  .description(desc.sign())
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      const signAll = !(cmd.app || cmd.data || cmd.pool || cmd.user);
      debug('signAll', signAll);

      const [chain, iexecConf] = await Promise.all([
        loadChain(cmd.chain),
        loadIExecConf(),
      ]);

      const clerkAddress = await chain.contracts.fetchClerkAddress();
      const domainObj = getEIP712Domain(chain.contracts.chainID, clerkAddress);

      const signAppOrder = async () => {
        spinner.start('signing apporder');
        const orderObj = iexecConf.apporder;
        if (!orderObj) {
          throw new Error(info.missingOrder('apporder', 'app'));
        }
        await chain.contracts.checkDeployedDapp(orderObj.dapp, {
          strict: true,
        });
        await order.checkContractOwner('apporder', orderObj, chain.contracts, {
          strict: true,
        });
        const signedOrder = await order.signAppOrder(orderObj, domainObj);
        const { saved, fileName } = await saveSignedOrder(
          'apporder',
          chain.id,
          signedOrder,
        );
        spinner.succeed(
          info.orderSigned(saved, fileName).concat(pretty(signedOrder)),
        );
      };

      const signDataOrder = async () => {
        spinner.start('signing dataorder');
        const orderObj = iexecConf.dataorder;
        if (!orderObj) {
          throw new Error(info.missingOrder('dataorder', 'data'));
        }
        await chain.contracts.checkDeployedData(orderObj.data, {
          strict: true,
        });
        await order.checkContractOwner('dataorder', orderObj, chain.contracts, {
          strict: true,
        });
        const signedOrder = await order.signDataOrder(orderObj, domainObj);
        const { saved, fileName } = await saveSignedOrder(
          'dataorder',
          chain.id,
          signedOrder,
        );
        spinner.succeed(
          info.orderSigned(saved, fileName).concat(pretty(signedOrder)),
        );
      };

      const signPoolOrder = async () => {
        spinner.start('signing poolorder');
        const orderObj = iexecConf.poolorder;
        if (!orderObj) {
          throw new Error(info.missingOrder('poolorder', 'pool'));
        }
        await chain.contracts.checkDeployedPool(orderObj.pool, {
          strict: true,
        });
        await order.checkContractOwner('poolorder', orderObj, chain.contracts, {
          strict: true,
        });
        const signedOrder = await order.signPoolOrder(orderObj, domainObj);
        const { saved, fileName } = await saveSignedOrder(
          'poolorder',
          chain.id,
          signedOrder,
        );
        spinner.succeed(
          info.orderSigned(saved, fileName).concat(pretty(signedOrder)),
        );
      };

      const signUserOrder = async () => {
        spinner.start('signing userorder');
        const orderObj = iexecConf.userorder;
        if (!orderObj) {
          throw new Error(info.missingOrder('userorder', 'user'));
        }
        await chain.contracts.checkDeployedDapp(orderObj.dapp, {
          strict: true,
        });
        const signedOrder = await order.signUserOrder(orderObj, domainObj);
        const { saved, fileName } = await saveSignedOrder(
          'userorder',
          chain.id,
          signedOrder,
        );
        spinner.succeed(
          info.orderSigned(saved, fileName).concat(pretty(signedOrder)),
        );
      };

      if (cmd.app || signAll) await signAppOrder();
      if (cmd.data || signAll) await signDataOrder();
      if (cmd.pool || signAll) await signPoolOrder();
      if (cmd.user || signAll) await signUserOrder();
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command(command.fill())
  .option(...option.chain())
  .option(...option.hub())
  .option(...option.force())
  .description(desc.fill(objName))
  .action(async (orderID, cmd) => {
    const spinner = Spinner();
    try {
      const [chain, iexecConf, { address }] = await Promise.all([
        loadChain(cmd.chain),
        loadIExecConf(),
        keystore.load(),
      ]);
      const hubAddress = cmd.hub || chain.hub;

      if (!(objName in iexecConf) || !('buy' in iexecConf[objName])) {
        throw Error(
          'Missing buy order. You probably forgot to run "iexec order init --buy"',
        );
      }
      const buyMarketOrder = iexecConf[objName].buy;
      debug('buyMarketOrder', buyMarketOrder);
      debug('buyMarketOrder.params', buyMarketOrder.params);
      const workParams = JSON.stringify(buyMarketOrder.params);
      debug('workParams', workParams);

      spinner.start(info.filling(objName));

      // fault detection
      const [marketplaceAddress, appHubAddress] = await Promise.all([
        chain.contracts.fetchMarketplaceAddress({
          hub: hubAddress,
        }),
        chain.contracts.fetchAppHubAddress({
          hub: hubAddress,
        }),
      ]);

      const [countRPC, isAppRegistered] = await Promise.all([
        chain.contracts
          .getMarketplaceContract({ at: marketplaceAddress })
          .m_orderCount(),
        chain.contracts
          .getAppHubContract({ at: appHubAddress })
          .isAppRegistered(buyMarketOrder.app),
      ]);

      if (!isAppRegistered[0]) {
        throw Error(
          `no iExec app deployed at address ${buyMarketOrder.app} [${
            chain.name
          }]`,
        );
      }
      if (parseInt(orderID, 10) > parseInt(countRPC[0].toString(), 10)) throw Error(`${objName} with ID ${orderID} does not exist`);
      // fault detection

      const [orderRPC, appPriceRPC, balanceRLC] = await Promise.all([
        chain.contracts
          .getMarketplaceContract({ at: marketplaceAddress })
          .getMarketOrder(orderID),
        chain.contracts
          .getAppContract({ at: buyMarketOrder.app })
          .m_appPrice()
          .catch((error) => {
            debug('m_appPrice()', error);
            throw Error(`Error with app ${buyMarketOrder.app}`);
          }),
        await chain.contracts
          .getHubContract({
            at: hubAddress,
          })
          .checkBalance(address),
      ]);
      debug('orderRPC', orderRPC);
      debug('appPriceRPC', appPriceRPC);
      debug('balanceRLC', balanceRLC);

      if (orderRPC.direction.toString() !== '2') {
        throw Error(
          `${objName} with ID ${orderID} is already closed and so cannot be filled. You could run "iexec order show ${orderID}" for more details`,
        );
      }

      const total = appPriceRPC[0].add(orderRPC.value);
      if (balanceRLC.stake.lt(total)) {
        throw Error(
          `total work price ${total} nRLC is higher than your iExec account balance ${
            balanceRLC.stake
          } nRLC. You should probably run "iexec wallet deposit"`,
        );
      }
      spinner.info(
        `app price: ${appPriceRPC[0]} nRLC for app ${buyMarketOrder.app}`,
      );
      spinner.info(
        `workerpool price: ${orderRPC.value} nRLC for workerpool ${
          orderRPC.workerpool
        }`,
      );
      spinner.info(`work parameters: ${pretty(buyMarketOrder.params)}`);

      if (!cmd.force) {
        await prompt.fillOrder(total, orderID);
      }

      spinner.start(info.filling(objName));

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
      spinner.succeed(
        `New work at ${events[0].woid} submitted to workerpool ${
          events[0].workerPool
        }`,
      );
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

      const countRPC = await chain.contracts
        .getMarketplaceContract({ at: marketplaceAddress })
        .m_orderCount();

      if (parseInt(orderID, 10) > parseInt(countRPC[0].toString(), 10)) throw Error(`${objName} with ID ${orderID} does not exist`);

      const orderRPC = await chain.contracts
        .getMarketplaceContract({ at: marketplaceAddress })
        .getMarketOrder(orderID);

      if (orderRPC.direction.toString() !== '2') {
        throw Error(
          `${objName} with ID ${orderID} is already closed and so cannot be cancelled. You could run "iexec order show ${orderID}" for more details`,
        );
      }

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
      const countRPC = await chain.contracts
        .getMarketplaceContract({ at: marketplaceAddress })
        .m_orderCount();

      if (parseInt(orderID, 10) > parseInt(countRPC[0].toString(), 10)) throw Error(`${objName} with ID ${orderID} does not exist`);

      const orderRPC = await chain.contracts
        .getMarketplaceContract({ at: marketplaceAddress })
        .getMarketOrder(orderID);

      spinner.succeed(
        `${objName} with ID ${orderID} details:${prettyRPC(orderRPC)}`,
      );
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
