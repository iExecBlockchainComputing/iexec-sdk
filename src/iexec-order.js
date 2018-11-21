#!/usr/bin/env node

const Debug = require('debug');
const BN = require('bn.js');
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
const { minBn } = require('./utils');
const {
  loadIExecConf,
  initOrder,
  loadDeployedObj,
  saveSignedOrder,
  loadSignedOrders,
} = require('./fs');
const { loadChain } = require('./chains.js');
const keystore = require('./keystore');
const order = require('./order');
const account = require('./account');
const { getEIP712Domain } = require('./sig-utils');
const templates = require('./templates');

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
  .option(...option.force())
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
        const orderObj = iexecConf.order.apporder;
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
        const orderObj = iexecConf.order.dataorder;
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
        const orderObj = iexecConf.order.poolorder;
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
        const orderObj = iexecConf.order.userorder;
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
  .option(...option.force())
  .description(desc.fill(objName))
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      const [chain, signedOrders] = await Promise.all([
        loadChain(cmd.chain),
        loadSignedOrders(),
      ]);
      debug('signedOrders', signedOrders);

      const appOrder = signedOrders[chain.id].apporder;
      const dataOrder = signedOrders[chain.id].dataorder;
      const poolOrder = signedOrders[chain.id].poolorder;
      const userOrderInput = signedOrders[chain.id].userorder;

      const useDataset = userOrderInput
        ? userOrderInput.data !== '0x0000000000000000000000000000000000000000'
        : !!dataOrder;
      debug('useDataset', useDataset);

      if (!appOrder) throw new Error('Missing apporder');
      if (!dataOrder && useDataset) throw new Error('Missing dataorder');
      if (!poolOrder) throw new Error('Missing poolorder');

      const appVolume = await order.checkRemainingVolume(
        'apporder',
        appOrder,
        chain.contracts,
      );
      const dataVolume = useDataset && dataOrder
        ? await order.checkRemainingVolume(
          'dataorder',
          dataOrder,
          chain.contracts,
        )
        : new BN(2).pow(new BN(256)).sub(new BN(1));
      const poolVolume = await order.checkRemainingVolume(
        'poolorder',
        poolOrder,
        chain.contracts,
      );

      const computeUserOrder = async () => {
        const [{ address }, clerkAddress] = await Promise.all([
          keystore.load(),
          chain.contracts.fetchClerkAddress(),
        ]);
        const volume = minBn([appVolume, dataVolume, poolVolume]);
        const unsignedOrder = templates.createOrder('userorder', {
          dapp: appOrder.dapp,
          dappmaxprice: appOrder.dappprice,
          data: useDataset
            ? dataOrder.data
            : '0x0000000000000000000000000000000000000000',
          datamaxprice: useDataset ? dataOrder.dataprice : '0',
          pool: poolOrder.pool,
          poolmaxprice: poolOrder.poolprice,
          requester: address,
          volume: volume.toString(),
        });
        await prompt.signGeneratedOrder('userorder', pretty(unsignedOrder));
        const domain = getEIP712Domain(chain.id, clerkAddress);
        const signed = order.signUserOrder(unsignedOrder, domain);
        return signed;
      };

      const userOrder = userOrderInput || (await computeUserOrder());
      if (!userOrder) {
        throw new Error('Missing userorder');
      }
      const useWorkerpool = userOrder.pool !== '0x0000000000000000000000000000000000000000';

      // address matching check
      if (userOrder.dapp !== appOrder.dapp) {
        throw new Error(
          'dapp address mismatch between userorder and dapporder',
        );
      }
      if (useDataset && userOrder.data !== dataOrder.data) {
        throw new Error(
          'data address mismatch between userorder and dataorder',
        );
      }
      if (useWorkerpool && userOrder.pool !== poolOrder.pool) {
        throw new Error(
          'pool address mismatch between userorder and poolorder',
        );
      }
      // volumes check
      const userVolume = await order.checkRemainingVolume(
        'userorder',
        userOrder,
        chain.contracts,
      );
      const maxVolume = minBn([appVolume, dataVolume, poolVolume, userVolume]);
      if (userVolume.gt(maxVolume) && !cmd.force) await prompt.limitedVolume(maxVolume, userVolume);
      // price check
      const poolPrice = new BN(poolOrder.poolprice);
      const poolMaxPrice = new BN(userOrder.poolmaxprice);
      const appPrice = new BN(appOrder.dappprice);
      const appMaxPrice = new BN(userOrder.dappmaxprice);
      const dataPrice = useDataset ? new BN(dataOrder.dataprice) : new BN(0);
      const dataMaxPrice = new BN(userOrder.datamaxprice);
      if (appMaxPrice.lt(appPrice)) throw new Error(`dappmaxprice to low, expected ${appPrice}`);
      if (poolMaxPrice.lt(poolPrice)) {
        throw new Error(`poolmaxprice to low, expected ${poolPrice}`);
      }
      if (dataMaxPrice.lt(dataPrice)) {
        throw new Error(`datamaxprice to low, expected ${dataPrice}`);
      }
      // account stake check
      const costPerWork = appPrice.add(dataPrice).add(poolPrice);
      const { stake } = await account.checkBalance(
        chain.contracts,
        userOrder.requester,
      );
      debug('stake', stake);
      if (stake.lt(costPerWork)) {
        throw new Error(
          `cost per work is ${costPerWork} nRLC and you have ${stake} nRLC staked on your account. You should run "iexec account deposit <amount>" to top up your account`,
        );
      }
      const totalCost = costPerWork.mul(maxVolume);
      if (stake.lt(totalCost) && !cmd.force) {
        const payableVolume = costPerWork.isZero()
          ? new BN(0)
          : stake.div(costPerWork);
        await prompt.limitedStake(totalCost, stake, payableVolume);
      }
      // all checks passed send matchOrder
      spinner.start(info.filling(objName));
      const { dealid, volume } = await order.matchOrders(
        appOrder,
        useDataset ? dataOrder : undefined,
        poolOrder,
        userOrder,
        chain.contracts,
      );
      spinner.succeed(
        `${volume} work successfully purchased with dealid ${dealid}`,
      );
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command(command.publish())
  .option(...option.publishAppOrder())
  .option(...option.publishDataOrder())
  .option(...option.publishPoolOrder())
  .option(...option.publishUserOrder())
  .option(...option.force())
  .option(...option.chain())
  .description(desc.publish(objName))
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      if (!(cmd.app || cmd.data || cmd.pool || cmd.user)) throw new Error('No option specified, you should choose one');

      const [chain, signedOrders] = await Promise.all([
        loadChain(cmd.chain),
        loadSignedOrders(),
      ]);

      const publishOrder = async (orderName) => {
        const orderToPublish = signedOrders[chain.id][orderName];
        if (!orderToPublish) {
          throw new Error(
            `Missing signed ${orderName} for chain ${
              chain.id
            } in "orders.json"`,
          );
        }
        if (!cmd.force) await prompt.publishOrder(orderName, pretty(orderToPublish));
        spinner.start('publishing order');
        await order.publishOrder(chain.id, orderName, orderToPublish);
        spinner.succeed(`${orderName} successfully published`);
      };

      if (cmd.app) await publishOrder('apporder');
      if (cmd.data) await publishOrder('dataorder');
      if (cmd.pool) await publishOrder('poolorder');
      if (cmd.user) await publishOrder('userorder');
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command(command.cancel())
  .option(...option.cancelAppOrder())
  .option(...option.cancelDataOrder())
  .option(...option.cancelPoolOrder())
  .option(...option.cancelUserOrder())
  .option(...option.chain())
  .option(...option.force())
  .description(desc.cancel(objName))
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      if (!(cmd.app || cmd.data || cmd.pool || cmd.user)) throw new Error('No option specified, you should choose one');

      const [chain, signedOrders] = await Promise.all([
        loadChain(cmd.chain),
        loadSignedOrders(),
      ]);

      const cancelOrder = async (orderName) => {
        const orderToCancel = signedOrders[chain.id][orderName];
        if (!orderToCancel) {
          throw new Error(
            `Missing signed ${orderName} for chain ${
              chain.id
            } in "orders.json"`,
          );
        }
        if (!cmd.force) await prompt.cancelOrder(orderName, pretty(orderToCancel));
        spinner.start('canceling order');
        await order.cancelOrder(orderName, orderToCancel, chain.contracts);
        spinner.succeed(`${orderName} successfully canceled`);
      };

      if (cmd.app) await cancelOrder('apporder');
      if (cmd.data) await cancelOrder('dataorder');
      if (cmd.pool) await cancelOrder('poolorder');
      if (cmd.user) await cancelOrder('userorder');
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
