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
const keystore = require('./keystore');
const order = require('./order');
const account = require('./account');
const templates = require('./templates');

const debug = Debug('iexec:iexec-order');
const objName = 'order';

cli
  .command('init')
  .option(...option.initAppOrder())
  .option(...option.initDatasetOrder())
  .option(...option.initWorkerpoolOrder())
  .option(...option.initRequestOrder())
  .option(...option.chain())
  .description(desc.initObj(objName))
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      debug('cmd.app', cmd.app);
      debug('cmd.dataset', cmd.dataset);
      debug('cmd.workerpool', cmd.workerpool);
      debug('cmd.request', cmd.request);
      const initAll = !(
        cmd.app
        || cmd.dataset
        || cmd.workerpool
        || cmd.request
      );
      debug('initAll', initAll);

      const chain = await loadChain(cmd.chain);

      const initOrder = async (resourceName) => {
        const orderName = resourceName.concat('order');
        spinner.start(`creating ${orderName}`);
        const overwrite = {};
        if (resourceName === 'request') {
          const { address } = await keystore.load();
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
        );
      };

      if (cmd.app || initAll) await initOrder('app');
      if (cmd.dataset || initAll) await initOrder('dataset');
      if (cmd.workerpool || initAll) await initOrder('workerpool');
      if (cmd.request || initAll) await initOrder('request');
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command(command.sign())
  .option(...option.signAppOrder())
  .option(...option.signDatasetOrder())
  .option(...option.signWorkerpoolOrder())
  .option(...option.signRequestOrder())
  .option(...option.force())
  .option(...option.chain())
  .description(desc.sign())
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      const signAll = !(
        cmd.app
        || cmd.dataset
        || cmd.workerpool
        || cmd.request
      );
      debug('signAll', signAll);

      const [chain, iexecConf, { address }] = await Promise.all([
        loadChain(cmd.chain),
        loadIExecConf(),
        keystore.load(),
      ]);

      const clerkAddress = await chain.contracts.fetchClerkAddress();
      const domainObj = order.getEIP712Domain(
        chain.contracts.chainID,
        clerkAddress,
      );

      const signAppOrder = async () => {
        spinner.start('signing apporder');
        const orderObj = iexecConf.order.apporder;
        if (!orderObj) {
          throw new Error(info.missingOrder('apporder', 'app'));
        }
        await chain.contracts.checkDeployedApp(orderObj.app, {
          strict: true,
        });
        const owner = await order.getContractOwner(
          'apporder',
          orderObj,
          chain.contracts,
        );
        if (address.toLowerCase() !== owner.toLowerCase()) throw new Error('only app owner can sign apporder');

        const signedOrder = await order.signAppOrder(
          orderObj,
          domainObj,
          chain.ethSigner.provider._web3Provider,
        );
        const { saved, fileName } = await saveSignedOrder(
          'apporder',
          chain.id,
          signedOrder,
        );
        spinner.succeed(
          info.orderSigned(saved, fileName).concat(pretty(signedOrder)),
        );
      };

      const signDatasetOrder = async () => {
        spinner.start('signing datasetorder');
        const orderObj = iexecConf.order.datasetorder;
        if (!orderObj) {
          throw new Error(info.missingOrder('datasetorder', 'dataset'));
        }
        await chain.contracts.checkDeployedDataset(orderObj.dataset, {
          strict: true,
        });

        const owner = await order.getContractOwner(
          'datasetorder',
          orderObj,
          chain.contracts,
        );
        if (address.toLowerCase() !== owner.toLowerCase()) throw new Error('only dataset owner can sign datasetorder');

        const signedOrder = await order.signDatasetOrder(
          orderObj,
          domainObj,
          chain.ethSigner.provider._web3Provider,
        );
        const { saved, fileName } = await saveSignedOrder(
          'datasetorder',
          chain.id,
          signedOrder,
        );
        spinner.succeed(
          info.orderSigned(saved, fileName).concat(pretty(signedOrder)),
        );
      };

      const signWorkerpoolOrder = async () => {
        spinner.start('signing workerpoolorder');
        const orderObj = iexecConf.order.workerpoolorder;
        if (!orderObj) {
          throw new Error(info.missingOrder('workerpoolorder', 'workerpool'));
        }
        await chain.contracts.checkDeployedWorkerpool(orderObj.workerpool, {
          strict: true,
        });

        const owner = await order.getContractOwner(
          'workerpoolorder',
          orderObj,
          chain.contracts,
        );
        if (address.toLowerCase() !== owner.toLowerCase()) throw new Error('only workerpool owner can sign workerpoolorder');

        const signedOrder = await order.signWorkerpoolOrder(
          orderObj,
          domainObj,
          chain.ethSigner.provider._web3Provider,
        );
        const { saved, fileName } = await saveSignedOrder(
          'workerpoolorder',
          chain.id,
          signedOrder,
        );
        spinner.succeed(
          info.orderSigned(saved, fileName).concat(pretty(signedOrder)),
        );
      };

      const signRequestOrder = async () => {
        spinner.start('signing requestorder');
        const orderObj = iexecConf.order.requestorder;
        if (!orderObj) {
          throw new Error(info.missingOrder('requestorder', 'request'));
        }
        await chain.contracts.checkDeployedApp(orderObj.app, {
          strict: true,
        });
        const signedOrder = await order.signRequestOrder(
          orderObj,
          domainObj,
          chain.ethSigner.provider._web3Provider,
        );
        const { saved, fileName } = await saveSignedOrder(
          'requestorder',
          chain.id,
          signedOrder,
        );
        spinner.succeed(
          info.orderSigned(saved, fileName).concat(pretty(signedOrder)),
        );
      };

      if (cmd.app || signAll) await signAppOrder();
      if (cmd.dataset || signAll) await signDatasetOrder();
      if (cmd.workerpool || signAll) await signWorkerpoolOrder();
      if (cmd.request || signAll) await signRequestOrder();
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
      const datasetOrder = signedOrders[chain.id].datasetorder;
      const workerpoolOrder = signedOrders[chain.id].workerpoolorder;
      const requestOrderInput = signedOrders[chain.id].requestorder;

      const useDataset = requestOrderInput
        ? requestOrderInput.dataset
          !== '0x0000000000000000000000000000000000000000'
        : !!datasetOrder;
      debug('useDataset', useDataset);

      if (!appOrder) throw new Error('Missing apporder');
      if (!datasetOrder && useDataset) throw new Error('Missing datasetorder');
      if (!workerpoolOrder) throw new Error('Missing workerpoolorder');

      const appVolume = await order.checkRemainingVolume(
        'apporder',
        appOrder,
        chain.contracts,
      );
      const datasetVolume = useDataset && datasetOrder
        ? await order.checkRemainingVolume(
          'datasetorder',
          datasetOrder,
          chain.contracts,
        )
        : new BN(2).pow(new BN(256)).sub(new BN(1));
      const workerpoolVolume = await order.checkRemainingVolume(
        'workerpoolorder',
        workerpoolOrder,
        chain.contracts,
      );

      const computeRequestOrder = async () => {
        const [{ address }, clerkAddress] = await Promise.all([
          keystore.load(),
          chain.contracts.fetchClerkAddress(),
        ]);
        const volume = minBn([appVolume, datasetVolume, workerpoolVolume]);
        const unsignedOrder = templates.createOrder('requestorder', {
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
        await prompt.signGeneratedOrder('requestorder', pretty(unsignedOrder));
        const domain = order.getEIP712Domain(chain.id, clerkAddress);
        const signed = order.signRequestOrder(unsignedOrder, domain);
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
        'requestorder',
        requestOrder,
        chain.contracts,
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
      spinner.start(info.filling(objName));
      const { dealid, volume } = await order.matchOrders(
        appOrder,
        useDataset ? datasetOrder : undefined,
        workerpoolOrder,
        requestOrder,
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
  .option(...option.publishDatasetOrder())
  .option(...option.publishWorkerpoolOrder())
  .option(...option.publishRequestOrder())
  .option(...option.force())
  .option(...option.chain())
  .description(desc.publish(objName))
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      if (!(cmd.app || cmd.dataset || cmd.workerpool || cmd.request)) {
        throw new Error(
          'No option specified, you should choose one (--app | --dataset | --workerpool | --request)',
        );
      }

      const [chain, signedOrders] = await Promise.all([
        loadChain(cmd.chain),
        loadSignedOrders(),
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
          chain.id,
          orderName,
          orderToPublish,
        );
        spinner.succeed(
          `${orderName} successfully published with orderHash ${orderHash}`,
        );
      };

      if (cmd.app) await publishOrder('apporder');
      if (cmd.dataset) await publishOrder('datasetorder');
      if (cmd.workerpool) await publishOrder('workerpoolorder');
      if (cmd.request) await publishOrder('requestorder');
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command(command.unpublish())
  .option(...option.unpublishAppOrder())
  .option(...option.unpublishDatasetOrder())
  .option(...option.unpublishWorkerpoolOrder())
  .option(...option.unpublishRequestOrder())
  .option(...option.chain())
  .option(...option.force())
  .description(desc.unpublish(objName))
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      if (!(cmd.app || cmd.dataset || cmd.workerpool || cmd.request)) {
        throw new Error(
          'No option specified, you should choose one (--app | --dataset | --workerpool | --request)',
        );
      }

      const [chain, signedOrders, { address }] = await Promise.all([
        loadChain(cmd.chain),
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
          chain.id,
          address,
          chain.ethSigner.provider._web3Provider,
          orderName,
          orderHashToUnpublish,
        );
        spinner.succeed(
          `${orderName} with orderHash ${unpublished} successfully unpublished`,
        );
      };

      if (cmd.app) await unpublishOrder('apporder', cmd.app);
      if (cmd.dataset) await unpublishOrder('datasetorder', cmd.dataset);
      if (cmd.workerpool) await unpublishOrder('workerpoolorder', cmd.workerpool);
      if (cmd.request) await unpublishOrder('requestorder', cmd.request);
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command(command.cancel())
  .option(...option.cancelAppOrder())
  .option(...option.cancelDatasetOrder())
  .option(...option.cancelWorkerpoolOrder())
  .option(...option.cancelRequestOrder())
  .option(...option.chain())
  .option(...option.force())
  .description(desc.cancel(objName))
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      if (!(cmd.app || cmd.dataset || cmd.workerpool || cmd.request)) {
        throw new Error(
          'No option specified, you should choose one (--app | --dataset | --workerpool | --request)',
        );
      }

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
        spinner.start(`canceling ${orderName}`);
        await order.cancelOrder(orderName, orderToCancel, chain.contracts);
        spinner.succeed(`${orderName} successfully canceled`);
      };

      if (cmd.app) await cancelOrder('apporder');
      if (cmd.dataset) await cancelOrder('datasetorder');
      if (cmd.workerpool) await cancelOrder('workerpoolorder');
      if (cmd.request) await cancelOrder('requestorder');
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command('show')
  .option(...option.showAppOrder())
  .option(...option.showDatasetOrder())
  .option(...option.showWorkerpoolOrder())
  .option(...option.showRequestOrder())
  .option(...option.chain())
  .description(desc.showObj(objName, 'marketplace'))
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      if (!(cmd.app || cmd.dataset || cmd.workerpool || cmd.request)) {
        throw new Error(
          'No option specified, you should choose one (--app | --dataset | --workerpool | --request)',
        );
      }

      const chain = await loadChain(cmd.chain);

      const showOrder = async (orderName, cmdInput) => {
        const findOption = {};
        if (isBytes32(cmdInput, { strict: false })) {
          findOption.orderHash = cmdInput;
        } else {
          spinner.info(
            `no order hash specified, showing last ${orderName} published`,
          );
        }
        spinner.start(info.showing(orderName));
        const orderToShow = await order.showOrder(
          chain.id,
          orderName,
          findOption,
        );
        spinner.succeed(
          `${orderName} with orderHash ${
            orderToShow.orderHash
          } details:${pretty(orderToShow)}`,
        );
      };

      if (cmd.app) await showOrder('apporder', cmd.app);
      if (cmd.dataset) await showOrder('datasetorder', cmd.dataset);
      if (cmd.workerpool) await showOrder('workerpoolorder', cmd.workerpool);
      if (cmd.request) await showOrder('requestorder', cmd.request);
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
