#!/usr/bin/env node
const Debug = require('debug');
const BN = require('bn.js');
const cli = require('commander');
const {
  help,
  addGlobalOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  handleError,
  desc,
  option,
  Spinner,
  pretty,
  info,
  command,
  prompt,
} = require('./cli-helper');
const { minBn, isBytes32 } = require('./utils');
const {
  loadIExecConf,
  initOrderObj,
  loadDeployedObj,
  saveSignedOrder,
  loadSignedOrders,
} = require('./fs');
const { loadChain } = require('./chains.js');
const { Keystore } = require('./keystore');
const order = require('./order');
const account = require('./account');
const templates = require('./templates');

const debug = Debug('iexec:iexec-order');
const objName = 'order';

const init = cli.command('init');
addGlobalOptions(init);
addWalletLoadOptions(init);
init
  .option(...option.initAppOrder())
  .option(...option.initDatasetOrder())
  .option(...option.initWorkerpoolOrder())
  .option(...option.initRequestOrder())
  .option(...option.chain())
  .description(desc.initObj(objName))
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      const initAll = !(
        cmd.app
        || cmd.dataset
        || cmd.workerpool
        || cmd.request
      );

      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(
        Object.assign(walletOptions, { isSigner: false }),
      );
      const chain = await loadChain(cmd.chain, keystore, { spinner });

      const initOrder = async (resourceName) => {
        const orderName = resourceName.concat('order');
        spinner.start(`creating ${orderName}`);
        const overwrite = {};
        if (resourceName === 'request') {
          const [address] = await keystore.accounts();
          overwrite.requester = address;
        } else {
          const deployedObj = await loadDeployedObj(resourceName);
          if (deployedObj && deployedObj[chain.id]) {
            const address = deployedObj[chain.id];
            overwrite[resourceName] = address;
          }
        }
        const { saved, fileName } = await initOrderObj(orderName, overwrite);
        spinner.succeed(
          `Saved default ${orderName} in "${fileName}", you can edit it:${pretty(
            saved,
          )}`,
          { raw: { order: saved } },
        );
      };

      if (cmd.app || initAll) await initOrder('app');
      if (cmd.dataset || initAll) await initOrder('dataset');
      if (cmd.workerpool || initAll) await initOrder('workerpool');
      if (cmd.request || initAll) await initOrder('request');
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const sign = cli.command(command.sign());
addGlobalOptions(sign);
addWalletLoadOptions(sign);
sign
  .option(...option.signAppOrder())
  .option(...option.signDatasetOrder())
  .option(...option.signWorkerpoolOrder())
  .option(...option.signRequestOrder())
  .option(...option.force())
  .option(...option.chain())
  .description(desc.sign())
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      const signAll = !(
        cmd.app
        || cmd.dataset
        || cmd.workerpool
        || cmd.request
      );

      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [chain, iexecConf, { address }] = await Promise.all([
        loadChain(cmd.chain, keystore, { spinner }),
        loadIExecConf(),
        keystore.load(),
      ]);

      const signAppOrder = async () => {
        spinner.start('signing apporder');
        const orderObj = iexecConf.order.apporder;
        if (!orderObj) {
          throw new Error(info.missingOrder(order.APP_ORDER, 'app'));
        }
        await chain.contracts.checkDeployedApp(orderObj.app, {
          strict: true,
        });
        const owner = await order.getContractOwner(
          chain.contracts,
          order.APP_ORDER,
          orderObj,
        );
        if (address.toLowerCase() !== owner.toLowerCase()) throw new Error('only app owner can sign apporder');

        const signedOrder = await order.signOrder(
          chain.contracts,
          order.APP_ORDER,
          orderObj,
          address,
        );
        const { saved, fileName } = await saveSignedOrder(
          order.APP_ORDER,
          chain.id,
          signedOrder,
        );
        spinner.succeed(
          info.orderSigned(saved, fileName).concat(pretty(signedOrder)),
          { raw: { order: signedOrder } },
        );
      };

      const signDatasetOrder = async () => {
        spinner.start('signing datasetorder');
        const orderObj = iexecConf.order.datasetorder;
        if (!orderObj) {
          throw new Error(info.missingOrder(order.DATASET_ORDER, 'dataset'));
        }
        await chain.contracts.checkDeployedDataset(orderObj.dataset, {
          strict: true,
        });

        const owner = await order.getContractOwner(
          chain.contracts,
          order.DATASET_ORDER,
          orderObj,
        );
        if (address.toLowerCase() !== owner.toLowerCase()) throw new Error('only dataset owner can sign datasetorder');

        const signedOrder = await order.signOrder(
          chain.contracts,
          order.DATASET_ORDER,
          orderObj,
          address,
        );
        const { saved, fileName } = await saveSignedOrder(
          order.DATASET_ORDER,
          chain.id,
          signedOrder,
        );
        spinner.succeed(
          info.orderSigned(saved, fileName).concat(pretty(signedOrder)),
          { raw: { order: signedOrder } },
        );
      };

      const signWorkerpoolOrder = async () => {
        spinner.start('signing workerpoolorder');
        const orderObj = iexecConf.order.workerpoolorder;
        if (!orderObj) {
          throw new Error(
            info.missingOrder(order.WORKERPOOL_ORDER, 'workerpool'),
          );
        }
        await chain.contracts.checkDeployedWorkerpool(orderObj.workerpool, {
          strict: true,
        });

        const owner = await order.getContractOwner(
          chain.contracts,
          order.WORKERPOOL_ORDER,
          orderObj,
        );
        if (address.toLowerCase() !== owner.toLowerCase()) throw new Error('only workerpool owner can sign workerpoolorder');

        const signedOrder = await order.signOrder(
          chain.contracts,
          order.WORKERPOOL_ORDER,
          orderObj,
          address,
        );
        const { saved, fileName } = await saveSignedOrder(
          order.WORKERPOOL_ORDER,
          chain.id,
          signedOrder,
        );
        spinner.succeed(
          info.orderSigned(saved, fileName).concat(pretty(signedOrder)),
          { raw: { order: signedOrder } },
        );
      };

      const signRequestOrder = async () => {
        spinner.start('signing requestorder');
        const orderObj = iexecConf.order.requestorder;
        if (!orderObj) {
          throw new Error(info.missingOrder(order.REQUEST_ORDER, 'request'));
        }
        await chain.contracts.checkDeployedApp(orderObj.app, {
          strict: true,
        });
        const signedOrder = await order.signOrder(
          chain.contracts,
          order.REQUEST_ORDER,
          orderObj,
          address,
        );
        const { saved, fileName } = await saveSignedOrder(
          order.REQUEST_ORDER,
          chain.id,
          signedOrder,
        );
        spinner.succeed(
          info.orderSigned(saved, fileName).concat(pretty(signedOrder)),
          { raw: { order: signedOrder } },
        );
      };

      if (cmd.app || signAll) await signAppOrder();
      if (cmd.dataset || signAll) await signDatasetOrder();
      if (cmd.workerpool || signAll) await signWorkerpoolOrder();
      if (cmd.request || signAll) await signRequestOrder();
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const fill = cli.command(command.fill());
addGlobalOptions(fill);
addWalletLoadOptions(fill);
fill
  .option(...option.chain())
  .option(...option.force())
  .option(...option.fillAppOrder())
  .option(...option.fillDatasetOrder())
  .option(...option.fillWorkerpoolOrder())
  .option(...option.fillRequestOrder())
  .description(desc.fill(objName))
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [chain, signedOrders] = await Promise.all([
        loadChain(cmd.chain, keystore, { spinner }),
        loadSignedOrders(),
      ]);

      const getOrderByHash = async (orderName, orderHash) => {
        if (isBytes32(orderHash, { strict: false })) {
          spinner.info(
            `fetching ${orderName} ${orderHash} from iexec marketplace`,
          );
          const orderRes = await order.fetchPublishedOrderByHash(
            orderName,
            chain.id,
            orderHash,
          );
          return orderRes.order;
        }
        throw Error(`invalid ${orderName} hash`);
      };
      const appOrder = cmd.app
        ? await getOrderByHash(order.APP_ORDER, cmd.app)
        : signedOrders[chain.id].apporder;
      const datasetOrder = cmd.dataset
        ? await getOrderByHash(order.DATASET_ORDER, cmd.dataset)
        : signedOrders[chain.id].datasetorder;
      const workerpoolOrder = cmd.workerpool
        ? await getOrderByHash(order.WORKERPOOL_ORDER, cmd.workerpool)
        : signedOrders[chain.id].workerpoolorder;
      const requestOrderInput = cmd.request
        ? await getOrderByHash(order.REQUEST_ORDER, cmd.request)
        : signedOrders[chain.id].requestorder;

      const useDataset = requestOrderInput
        ? requestOrderInput.dataset
          !== '0x0000000000000000000000000000000000000000'
        : !!datasetOrder;
      debug('useDataset', useDataset);

      if (!appOrder) throw new Error('Missing apporder');
      if (!datasetOrder && useDataset) throw new Error('Missing datasetorder');
      if (!workerpoolOrder) throw new Error('Missing workerpoolorder');

      const appVolume = await order.checkRemainingVolume(
        chain.contracts,
        order.APP_ORDER,
        appOrder,
      );
      const datasetVolume = useDataset && datasetOrder
        ? await order.checkRemainingVolume(
          chain.contracts,
          order.DATASET_ORDER,
          datasetOrder,
        )
        : new BN(2).pow(new BN(256)).sub(new BN(1));
      const workerpoolVolume = await order.checkRemainingVolume(
        chain.contracts,
        order.WORKERPOOL_ORDER,
        workerpoolOrder,
      );
      const computeRequestOrder = async () => {
        const { address } = await keystore.load();
        const volume = minBn([appVolume, datasetVolume, workerpoolVolume]);
        const unsignedOrder = templates.createOrder(order.REQUEST_ORDER, {
          app: appOrder.app,
          appmaxprice: appOrder.appprice,
          dataset: useDataset
            ? datasetOrder.dataset
            : '0x0000000000000000000000000000000000000000',
          datasetmaxprice: useDataset ? datasetOrder.datasetprice : '0',
          workerpool: workerpoolOrder.workerpool,
          workerpoolmaxprice: workerpoolOrder.workerpoolprice,
          requester: address,
          volume: volume.toString(),
        });
        if (!cmd.force) {
          await prompt.signGeneratedOrder(
            order.REQUEST_ORDER,
            pretty(unsignedOrder),
          );
        }
        const signed = order.signOrder(
          chain.contracts,
          order.REQUEST_ORDER,
          unsignedOrder,
          address,
        );
        return signed;
      };

      const requestOrder = requestOrderInput || (await computeRequestOrder());
      if (!requestOrder) {
        throw new Error('Missing requestorder');
      }
      const useWorkerpool = requestOrder.workerpool
        !== '0x0000000000000000000000000000000000000000';

      // address matching check
      if (requestOrder.app.toLowerCase() !== appOrder.app.toLowerCase()) {
        throw new Error(
          'app address mismatch between requestorder and apporder',
        );
      }
      if (
        useDataset
        && requestOrder.dataset.toLowerCase()
          !== datasetOrder.dataset.toLowerCase()
      ) {
        throw new Error(
          'dataset address mismatch between requestorder and datasetorder',
        );
      }
      if (
        useWorkerpool
        && requestOrder.workerpool.toLowerCase()
          !== workerpoolOrder.workerpool.toLowerCase()
      ) {
        throw new Error(
          'workerpool address mismatch between requestorder and workerpoolorder',
        );
      }
      // volumes check
      const requestVolume = await order.checkRemainingVolume(
        chain.contracts,
        order.REQUEST_ORDER,
        requestOrder,
      );
      const maxVolume = minBn([
        appVolume,
        datasetVolume,
        workerpoolVolume,
        requestVolume,
      ]);
      if (requestVolume.gt(maxVolume) && !cmd.force) await prompt.limitedVolume(maxVolume, requestVolume);
      // price check
      const workerpoolPrice = new BN(workerpoolOrder.workerpoolprice);
      const workerpoolMaxPrice = new BN(requestOrder.workerpoolmaxprice);
      const appPrice = new BN(appOrder.appprice);
      const appMaxPrice = new BN(requestOrder.appmaxprice);
      const datasetPrice = useDataset
        ? new BN(datasetOrder.datasetprice)
        : new BN(0);
      const datasetMaxPrice = new BN(requestOrder.datasetmaxprice);
      if (appMaxPrice.lt(appPrice)) throw new Error(`appmaxprice too low, expected ${appPrice}`);
      if (workerpoolMaxPrice.lt(workerpoolPrice)) {
        throw new Error(
          `workerpoolmaxprice too low, expected ${workerpoolPrice}`,
        );
      }
      if (datasetMaxPrice.lt(datasetPrice)) {
        throw new Error(`datasetmaxprice too low, expected ${datasetPrice}`);
      }
      // account stake check
      const costPerWork = appPrice.add(datasetPrice).add(workerpoolPrice);
      const { stake } = await account.checkBalance(
        chain.contracts,
        requestOrder.requester,
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
      await keystore.load();
      spinner.start(info.filling(objName));
      const { dealid, volume } = await order.matchOrders(
        chain.contracts,
        appOrder,
        useDataset ? datasetOrder : undefined,
        workerpoolOrder,
        requestOrder,
      );
      spinner.succeed(
        `${volume} work successfully purchased with dealid ${dealid}`,
        { raw: { dealid, volume } },
      );
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const publish = cli.command(command.publish());
addGlobalOptions(publish);
addWalletLoadOptions(publish);
publish
  .option(...option.publishAppOrder())
  .option(...option.publishDatasetOrder())
  .option(...option.publishWorkerpoolOrder())
  .option(...option.publishRequestOrder())
  .option(...option.force())
  .option(...option.chain())
  .description(desc.publish(objName))
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      if (!(cmd.app || cmd.dataset || cmd.workerpool || cmd.request)) {
        throw new Error(
          'No option specified, you should choose one (--app | --dataset | --workerpool | --request)',
        );
      }

      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);

      const [chain, signedOrders, { address }] = await Promise.all([
        loadChain(cmd.chain, keystore, { spinner }),
        loadSignedOrders(),
        keystore.load(),
      ]);

      const publishOrder = async (orderName) => {
        const orderToPublish = signedOrders[chain.id] && signedOrders[chain.id][orderName];
        if (!orderToPublish) {
          throw new Error(
            `Missing signed ${orderName} for chain ${
              chain.id
            } in "orders.json"`,
          );
        }
        if (!cmd.force) await prompt.publishOrder(orderName, pretty(orderToPublish));
        spinner.start(`publishing ${orderName}`);
        const orderHash = await order.publishOrder(
          chain.contracts,
          orderName,
          chain.id,
          orderToPublish,
          address,
        );
        spinner.succeed(
          `${orderName} successfully published with orderHash ${orderHash}`,
          { raw: { orderHash } },
        );
      };

      if (cmd.app) await publishOrder(order.APP_ORDER);
      if (cmd.dataset) await publishOrder(order.DATASET_ORDER);
      if (cmd.workerpool) await publishOrder(order.WORKERPOOL_ORDER);
      if (cmd.request) await publishOrder(order.REQUEST_ORDER);
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const unpublish = cli.command(command.unpublish());
addGlobalOptions(unpublish);
addWalletLoadOptions(unpublish);
unpublish
  .option(...option.unpublishAppOrder())
  .option(...option.unpublishDatasetOrder())
  .option(...option.unpublishWorkerpoolOrder())
  .option(...option.unpublishRequestOrder())
  .option(...option.chain())
  .option(...option.force())
  .description(desc.unpublish(objName))
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      if (!(cmd.app || cmd.dataset || cmd.workerpool || cmd.request)) {
        throw new Error(
          'No option specified, you should choose one (--app | --dataset | --workerpool | --request)',
        );
      }

      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);

      const [chain, signedOrders, { address }] = await Promise.all([
        loadChain(cmd.chain, keystore, { spinner }),
        loadSignedOrders(),
        keystore.load(),
      ]);

      const unpublishOrder = async (orderName, orderHash) => {
        let orderHashToUnpublish;
        if (isBytes32(orderHash, { strict: false })) {
          orderHashToUnpublish = orderHash;
        } else {
          spinner.info(
            `No orderHash specified for unpublish ${orderName}, using orders.json`,
          );
          const orderToUnpublish = signedOrders[chain.id] && signedOrders[chain.id][orderName];
          if (!orderToUnpublish) {
            throw new Error(
              `No orderHash specified and no signed ${orderName} found for chain ${
                chain.id
              } in "orders.json"`,
            );
          }
          orderHashToUnpublish = order.getOrderHash(
            orderName,
            orderToUnpublish,
          );
          if (!cmd.force) {
            await prompt.unpublishFromJsonFile(
              orderName,
              pretty(orderToUnpublish),
            );
          }
        }

        spinner.start(`unpublishing ${orderName}`);
        const unpublished = await order.unpublishOrder(
          chain.contracts,
          orderName,
          chain.id,
          orderHashToUnpublish,
          address,
        );
        spinner.succeed(
          `${orderName} with orderHash ${unpublished} successfully unpublished`,
          { raw: { orderHash: unpublished } },
        );
      };

      if (cmd.app) await unpublishOrder(order.APP_ORDER, cmd.app);
      if (cmd.dataset) await unpublishOrder(order.DATASET_ORDER, cmd.dataset);
      if (cmd.workerpool) await unpublishOrder(order.WORKERPOOL_ORDER, cmd.workerpool);
      if (cmd.request) await unpublishOrder(order.REQUEST_ORDER, cmd.request);
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const cancel = cli.command(command.cancel());
addGlobalOptions(cancel);
addWalletLoadOptions(cancel);
cancel
  .option(...option.cancelAppOrder())
  .option(...option.cancelDatasetOrder())
  .option(...option.cancelWorkerpoolOrder())
  .option(...option.cancelRequestOrder())
  .option(...option.chain())
  .option(...option.force())
  .description(desc.cancel(objName))
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      if (!(cmd.app || cmd.dataset || cmd.workerpool || cmd.request)) {
        throw new Error(
          'No option specified, you should choose one (--app | --dataset | --workerpool | --request)',
        );
      }

      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);

      const [chain, signedOrders] = await Promise.all([
        loadChain(cmd.chain, keystore, { spinner }),
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
        spinner.start(`canceling ${orderName}`);
        await order.cancelOrder(chain.contracts, orderName, orderToCancel);
        spinner.succeed(`${orderName} successfully canceled`);
      };

      if (cmd.app) await cancelOrder(order.APP_ORDER);
      if (cmd.dataset) await cancelOrder(order.DATASET_ORDER);
      if (cmd.workerpool) await cancelOrder(order.WORKERPOOL_ORDER);
      if (cmd.request) await cancelOrder(order.REQUEST_ORDER);
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const show = cli.command('show');
addGlobalOptions(show);
show
  .option(...option.showAppOrder())
  .option(...option.showDatasetOrder())
  .option(...option.showWorkerpoolOrder())
  .option(...option.showRequestOrder())
  .option(...option.showOrderDeals())
  .option(...option.chain())
  .description(desc.showObj(objName, 'marketplace'))
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      if (!(cmd.app || cmd.dataset || cmd.workerpool || cmd.request)) {
        throw new Error(
          'No option specified, you should choose one (--app | --dataset | --workerpool | --request)',
        );
      }

      const chain = await loadChain(cmd.chain, Keystore({ isSigner: false }), {
        spinner,
      });

      const showOrder = async (orderName, cmdInput) => {
        let orderHash;
        if (cmdInput === true) {
          spinner.info(
            `No order hash specified, showing ${orderName} from "orders.json"`,
          );
          const signedOrders = (await loadSignedOrders())[chain.id];
          const signedOrder = signedOrders && signedOrders[orderName];
          if (!signedOrder) {
            throw Error(
              `Missing ${orderName} in "orders.json" for chain ${chain.id}`,
            );
          }
          orderHash = order.getOrderHash(orderName, signedOrder);
        } else {
          orderHash = cmdInput;
        }
        isBytes32(orderHash);
        spinner.start(info.showing(orderName));
        const orderToShow = await order.fetchPublishedOrderByHash(
          orderName,
          chain.id,
          orderHash,
        );
        let deals;
        if (cmd.deals) {
          deals = await order.fetchDealsByOrderHash(
            orderName,
            chain.id,
            orderHash,
          );
        }
        const orderString = orderToShow
          ? `${orderName} with orderHash ${orderHash} details:${pretty(
            orderToShow,
          )}`
          : `${orderName} with orderHash ${orderHash} is not published`;
        const dealsString = deals && deals.count
          ? `\nDeals count: ${deals.count}\nLast deals: ${pretty(
            deals.deals,
          )}`
          : '\nDeals count: 0';
        const raw = Object.assign(
          { orderHash },
          { publishedOrder: orderToShow },
          deals && { deals: { count: deals.count, lastDeals: deals.deals } },
        );
        spinner.succeed(`${orderString}${dealsString}`, {
          raw,
        });
      };

      if (cmd.app) await showOrder(order.APP_ORDER, cmd.app);
      if (cmd.dataset) await showOrder(order.DATASET_ORDER, cmd.dataset);
      if (cmd.workerpool) await showOrder(order.WORKERPOOL_ORDER, cmd.workerpool);
      if (cmd.request) await showOrder(order.REQUEST_ORDER, cmd.request);
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
