#!/usr/bin/env node
const Debug = require('debug');
const cli = require('commander');
const {
  help,
  addGlobalOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  computeTxOptions,
  checkUpdate,
  handleError,
  desc,
  option,
  Spinner,
  pretty,
  info,
  isBytes32,
  prompt,
  getPropertyFormChain,
} = require('./cli-helper');
const { checkRequestRequirements } = require('./request-helper');
const {
  loadIExecConf,
  initOrderObj,
  loadDeployedObj,
  saveSignedOrder,
  loadSignedOrders,
} = require('./fs');
const { loadChain, connectKeystore } = require('./chains.js');
const { Keystore } = require('./keystore');
const order = require('./order');
const { NULL_ADDRESS } = require('./utils');

const debug = Debug('iexec:iexec-order');
const objName = 'order';

cli
  .name('iexec order')
  .usage('<command> [options]')
  .storeOptionsAsProperties(false);

const init = cli.command('init');
addGlobalOptions(init);
addWalletLoadOptions(init);
init
  .option(...option.chain())
  .option(...option.initAppOrder())
  .option(...option.initDatasetOrder())
  .option(...option.initWorkerpoolOrder())
  .option(...option.initRequestOrder())
  .description(desc.initObj(objName))
  .action(async (cmd) => {
    const opts = cmd.opts();
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const initAll = !(
        opts.app
        || opts.dataset
        || opts.workerpool
        || opts.request
      );

      const walletOptions = await computeWalletLoadOptions(opts);

      const chain = await loadChain(opts.chain, { spinner });
      const success = {};
      const failed = [];

      const initOrder = async (resourceName) => {
        const orderName = resourceName.concat('order');
        try {
          spinner.start(`Creating ${orderName}`);
          const overwrite = {};
          if (resourceName === 'request') {
            const keystore = Keystore(
              Object.assign(walletOptions, { isSigner: false }),
            );
            const [address] = await keystore.accounts();
            overwrite.requester = address;
            overwrite.beneficiary = address;
          } else {
            const deployedObj = await loadDeployedObj(resourceName);
            if (deployedObj && deployedObj[chain.id]) {
              const address = deployedObj[chain.id];
              overwrite[resourceName] = address;
            }
          }
          const { saved, fileName } = await initOrderObj(orderName, overwrite);
          Object.assign(success, { [orderName]: saved });
          spinner.info(
            `Saved default ${orderName} in "${fileName}", you can edit it:${pretty(
              saved,
            )}`,
          );
        } catch (error) {
          failed.push(`${orderName}: ${error.message}`);
        }
      };

      if (opts.app || initAll) await initOrder('app');
      if (opts.dataset || initAll) await initOrder('dataset');
      if (opts.workerpool || initAll) await initOrder('workerpool');
      if (opts.request || initAll) await initOrder('request');

      if (failed.length === 0) {
        spinner.succeed(
          'Successfully initialized, you can edit in "iexec.json"',
          {
            raw: success,
          },
        );
      } else {
        spinner.fail(`Failed to init: ${pretty(failed)}`, {
          raw: { ...success, fail: failed },
        });
      }
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const sign = cli.command('sign');
addGlobalOptions(sign);
addWalletLoadOptions(sign);
sign
  .option(...option.chain())
  .option(...option.force())
  .option(...option.signAppOrder())
  .option(...option.signDatasetOrder())
  .option(...option.signWorkerpoolOrder())
  .option(...option.signRequestOrder())
  .option(...option.skipRequestCheck())
  .description(desc.sign())
  .action(async (cmd) => {
    const opts = cmd.opts();
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const signAll = !(
        opts.app
        || opts.dataset
        || opts.workerpool
        || opts.request
      );
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore(walletOptions);
      const [chain, iexecConf] = await Promise.all([
        loadChain(opts.chain, { spinner }),
        loadIExecConf(),
      ]);
      await connectKeystore(chain, keystore);
      const success = {};
      const failed = [];

      const signAppOrder = async () => {
        spinner.start('Signing apporder');
        try {
          const loadedOrder = iexecConf.order && iexecConf.order.apporder;
          if (!loadedOrder) {
            throw new Error(info.missingOrder(order.APP_ORDER, 'app'));
          }
          const orderObj = await order.createApporder(
            chain.contracts,
            loadedOrder,
          );
          await chain.contracts.checkDeployedApp(orderObj.app, {
            strict: true,
          });
          const signedOrder = await order.signApporder(
            chain.contracts,
            orderObj,
          );
          const { saved, fileName } = await saveSignedOrder(
            order.APP_ORDER,
            chain.id,
            signedOrder,
          );
          spinner.info(
            info.orderSigned(saved, fileName).concat(pretty(signedOrder)),
          );
          Object.assign(success, { apporder: signedOrder });
        } catch (error) {
          failed.push(`apporder: ${error.message}`);
        }
      };

      const signDatasetOrder = async () => {
        spinner.start('Signing datasetorder');
        try {
          const loadedOrder = iexecConf.order && iexecConf.order.datasetorder;
          if (!loadedOrder) {
            throw new Error(info.missingOrder(order.DATASET_ORDER, 'dataset'));
          }
          const orderObj = await order.createDatasetorder(
            chain.contracts,
            loadedOrder,
          );
          await chain.contracts.checkDeployedDataset(orderObj.dataset, {
            strict: true,
          });
          const signedOrder = await order.signDatasetorder(
            chain.contracts,
            orderObj,
          );
          const { saved, fileName } = await saveSignedOrder(
            order.DATASET_ORDER,
            chain.id,
            signedOrder,
          );
          spinner.info(
            info.orderSigned(saved, fileName).concat(pretty(signedOrder)),
          );

          Object.assign(success, { datasetorder: signedOrder });
        } catch (error) {
          failed.push(`datasetorder: ${error.message}`);
        }
      };

      const signWorkerpoolOrder = async () => {
        spinner.start('Signing workerpoolorder');
        try {
          const loadedOrder = iexecConf.order && iexecConf.order.workerpoolorder;
          if (!loadedOrder) {
            throw new Error(
              info.missingOrder(order.WORKERPOOL_ORDER, 'workerpool'),
            );
          }
          const orderObj = await order.createWorkerpoolorder(
            chain.contracts,
            loadedOrder,
          );
          await chain.contracts.checkDeployedWorkerpool(orderObj.workerpool, {
            strict: true,
          });
          const signedOrder = await order.signWorkerpoolorder(
            chain.contracts,
            orderObj,
          );
          const { saved, fileName } = await saveSignedOrder(
            order.WORKERPOOL_ORDER,
            chain.id,
            signedOrder,
          );
          spinner.info(
            info.orderSigned(saved, fileName).concat(pretty(signedOrder)),
          );
          Object.assign(success, { workerpoolorder: signedOrder });
        } catch (error) {
          failed.push(`workerpoolorder: ${error.message}`);
        }
      };

      const signRequestOrder = async () => {
        spinner.start('Signing requestorder');
        try {
          const loadedOrder = iexecConf.order && iexecConf.order.requestorder;
          if (!loadedOrder) {
            throw new Error(info.missingOrder(order.REQUEST_ORDER, 'request'));
          }
          const orderObj = await order.createRequestorder(
            {
              contracts: chain.contracts,
              resultProxyURL: chain.resultProxy,
            },
            loadedOrder,
          );
          await chain.contracts.checkDeployedApp(orderObj.app, {
            strict: true,
          });
          if (!opts.skipRequestCheck) {
            await checkRequestRequirements(
              { contracts: chain.contracts, smsURL: chain.sms },
              orderObj,
            ).catch((e) => {
              throw Error(
                `Request requirements check failed: ${
                  e.message
                } (If you consider this is not an issue, use ${
                  option.skipRequestCheck()[0]
                } to skip request requirement check)`,
              );
            });
          }
          const signedOrder = await order.signRequestorder(
            chain.contracts,
            orderObj,
          );
          const { saved, fileName } = await saveSignedOrder(
            order.REQUEST_ORDER,
            chain.id,
            signedOrder,
          );
          spinner.info(
            info.orderSigned(saved, fileName).concat(pretty(signedOrder)),
          );
          Object.assign(success, { requestorder: signedOrder });
        } catch (error) {
          failed.push(`requestorder: ${error.message}`);
        }
      };

      if (opts.app || signAll) await signAppOrder();
      if (opts.dataset || signAll) await signDatasetOrder();
      if (opts.workerpool || signAll) await signWorkerpoolOrder();
      if (opts.request || signAll) await signRequestOrder();

      if (failed.length === 0) {
        spinner.succeed('Successfully signed and stored in "orders.json"', {
          raw: success,
        });
      } else {
        spinner.fail(`Failed to sign: ${pretty(failed)}`, {
          raw: { ...success, fail: failed },
        });
      }
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const fill = cli.command('fill');
addGlobalOptions(fill);
addWalletLoadOptions(fill);
fill
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.force())
  .option(...option.fillAppOrder())
  .option(...option.fillDatasetOrder())
  .option(...option.fillWorkerpoolOrder())
  .option(...option.fillRequestOrder())
  .option(...option.fillRequestParams())
  .option(...option.skipRequestCheck())
  .description(desc.fill(objName))
  .action(async (cmd) => {
    const opts = cmd.opts();
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const [chain, signedOrders] = await Promise.all([
        loadChain(opts.chain, { spinner }),
        loadSignedOrders(),
      ]);

      const inputParams = opts.params;
      const requestOnTheFly = inputParams !== undefined;

      const getOrderByHash = async (orderName, orderHash) => {
        if (isBytes32(orderHash, { strict: false })) {
          spinner.info(
            `Fetching ${orderName} ${orderHash} from iexec marketplace`,
          );
          const orderRes = await order.fetchPublishedOrderByHash(
            getPropertyFormChain(chain, 'iexecGateway'),
            orderName,
            chain.id,
            orderHash,
          );
          if (!orderRes) {
            throw Error(
              `${orderName} ${orderHash} is not published on iexec marketplace`,
            );
          }
          return orderRes.order;
        }
        throw Error(`Invalid ${orderName} hash`);
      };
      const appOrder = opts.app
        ? await getOrderByHash(order.APP_ORDER, opts.app)
        : signedOrders[chain.id].apporder;
      const datasetOrder = opts.dataset
        ? await getOrderByHash(order.DATASET_ORDER, opts.dataset)
        : signedOrders[chain.id].datasetorder;
      const workerpoolOrder = opts.workerpool
        ? await getOrderByHash(order.WORKERPOOL_ORDER, opts.workerpool)
        : signedOrders[chain.id].workerpoolorder;
      let requestOrderInput;
      if (requestOnTheFly) {
        requestOrderInput = undefined;
      } else {
        requestOrderInput = opts.request
          ? await getOrderByHash(order.REQUEST_ORDER, opts.request)
          : signedOrders[chain.id].requestorder;
      }

      const useDataset = requestOrderInput
        ? requestOrderInput.dataset !== NULL_ADDRESS
        : !!datasetOrder;
      debug('useDataset', useDataset);

      if (!appOrder) throw new Error('Missing apporder');
      if (!datasetOrder && useDataset) throw new Error('Missing datasetorder');
      if (!workerpoolOrder) throw new Error('Missing workerpoolorder');

      const computeRequestOrder = async () => {
        await connectKeystore(chain, keystore, { txOptions });
        const unsignedOrder = await order.createRequestorder(
          { contracts: chain.contracts, resultProxyURL: chain.resultProxy },
          {
            app: appOrder.app,
            appmaxprice: appOrder.appprice || undefined,
            dataset: useDataset ? datasetOrder.dataset : undefined,
            datasetmaxprice: useDataset ? datasetOrder.datasetprice : undefined,
            workerpool: workerpoolOrder.workerpool || undefined,
            workerpoolmaxprice: workerpoolOrder.workerpoolprice || undefined,
            category: workerpoolOrder.category,
            params: inputParams || undefined,
          },
        );
        if (!opts.force) {
          await prompt.signGeneratedOrder(
            order.REQUEST_ORDER,
            pretty(unsignedOrder),
          );
        }
        const signed = await order.signRequestorder(
          chain.contracts,
          unsignedOrder,
        );
        return signed;
      };

      const requestOrder = requestOrderInput || (await computeRequestOrder());
      if (!requestOrder) {
        throw new Error('Missing requestorder');
      }

      if (!opts.skipRequestCheck) {
        await checkRequestRequirements(
          { contracts: chain.contracts, smsURL: chain.sms },
          requestOrder,
        ).catch((e) => {
          throw Error(
            `Request requirements check failed: ${
              e.message
            } (If you consider this is not an issue, use ${
              option.skipRequestCheck()[0]
            } to skip request requirement check)`,
          );
        });
      }

      await connectKeystore(chain, keystore, { txOptions });
      spinner.start(info.filling(objName));
      const { dealid, volume, txHash } = await order.matchOrders(
        chain.contracts,
        appOrder,
        useDataset ? datasetOrder : undefined,
        workerpoolOrder,
        requestOrder,
      );
      spinner.succeed(
        `${volume} task successfully purchased with dealid ${dealid}`,
        { raw: { dealid, volume: volume.toString(), txHash } },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const publish = cli.command('publish');
addGlobalOptions(publish);
addWalletLoadOptions(publish);
publish
  .option(...option.chain())
  .option(...option.force())
  .option(...option.publishAppOrder())
  .option(...option.publishDatasetOrder())
  .option(...option.publishWorkerpoolOrder())
  .option(...option.publishRequestOrder())
  .option(...option.skipRequestCheck())
  .description(desc.publish(objName))
  .action(async (cmd) => {
    const opts = cmd.opts();
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      if (!(opts.app || opts.dataset || opts.workerpool || opts.request)) {
        throw new Error(
          'No option specified, you should choose one (--app | --dataset | --workerpool | --request)',
        );
      }
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore(walletOptions);

      const [chain, signedOrders] = await Promise.all([
        loadChain(opts.chain, { spinner }),
        loadSignedOrders(),
      ]);
      await connectKeystore(chain, keystore);
      const success = {};
      const failed = [];

      const publishOrder = async (orderName) => {
        try {
          const orderToPublish = signedOrders[chain.id] && signedOrders[chain.id][orderName];
          if (!orderToPublish) {
            throw new Error(
              `Missing signed ${orderName} for chain ${chain.id} in "orders.json"`,
            );
          }
          if (!opts.force) await prompt.publishOrder(orderName, pretty(orderToPublish));
          spinner.start(`Publishing ${orderName}`);

          let orderHash;
          switch (orderName) {
            case order.APP_ORDER:
              orderHash = await order.publishApporder(
                chain.contracts,
                getPropertyFormChain(chain, 'iexecGateway'),
                orderToPublish,
              );
              break;
            case order.DATASET_ORDER:
              orderHash = await order.publishDatasetorder(
                chain.contracts,
                getPropertyFormChain(chain, 'iexecGateway'),
                orderToPublish,
              );
              break;
            case order.WORKERPOOL_ORDER:
              orderHash = await order.publishWorkerpoolorder(
                chain.contracts,
                getPropertyFormChain(chain, 'iexecGateway'),
                orderToPublish,
              );
              break;
            case order.REQUEST_ORDER:
              if (!opts.skipRequestCheck) {
                await checkRequestRequirements(
                  { contracts: chain.contracts, smsURL: chain.sms },
                  orderToPublish,
                ).catch((e) => {
                  throw Error(
                    `Request requirements check failed: ${
                      e.message
                    } (If you consider this is not an issue, use ${
                      option.skipRequestCheck()[0]
                    } to skip request requirement check)`,
                  );
                });
              }
              orderHash = await order.publishRequestorder(
                chain.contracts,
                getPropertyFormChain(chain, 'iexecGateway'),
                orderToPublish,
              );
              break;
            default:
          }
          spinner.info(
            `${orderName} successfully published with orderHash ${orderHash}`,
          );
          Object.assign(success, { [orderName]: { orderHash } });
        } catch (error) {
          failed.push(`${orderName}: ${error.message}`);
        }
      };

      if (opts.app) await publishOrder(order.APP_ORDER);
      if (opts.dataset) await publishOrder(order.DATASET_ORDER);
      if (opts.workerpool) await publishOrder(order.WORKERPOOL_ORDER);
      if (opts.request) await publishOrder(order.REQUEST_ORDER);

      if (failed.length === 0) {
        spinner.succeed('Successfully published', {
          raw: success,
        });
      } else {
        spinner.fail(`Failed to publish: ${pretty(failed)}`, {
          raw: { ...success, fail: failed },
        });
      }
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const unpublish = cli.command('unpublish');
addGlobalOptions(unpublish);
addWalletLoadOptions(unpublish);
unpublish
  .option(...option.chain())
  .option(...option.force())
  .option(...option.unpublishAppOrder())
  .option(...option.unpublishDatasetOrder())
  .option(...option.unpublishWorkerpoolOrder())
  .option(...option.unpublishRequestOrder())
  .description(desc.unpublish(objName))
  .action(async (cmd) => {
    const opts = cmd.opts();
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      if (!(opts.app || opts.dataset || opts.workerpool || opts.request)) {
        throw new Error(
          'No option specified, you should choose one (--app | --dataset | --workerpool | --request)',
        );
      }
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore(walletOptions);

      const [chain, signedOrders] = await Promise.all([
        loadChain(opts.chain, { spinner }),
        loadSignedOrders(),
      ]);
      await connectKeystore(chain, keystore);
      const success = {};
      const failed = [];

      const unpublishOrder = async (orderName, orderHash) => {
        try {
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
                `No orderHash specified and no signed ${orderName} found for chain ${chain.id} in "orders.json"`,
              );
            }
            orderHashToUnpublish = await order.computeOrderHash(
              chain.contracts,
              orderName,
              orderToUnpublish,
            );
            if (!opts.force) {
              await prompt.unpublishFromJsonFile(
                orderName,
                pretty(orderToUnpublish),
              );
            }
          }

          spinner.start(`Unpublishing ${orderName}`);
          let unpublished;
          switch (orderName) {
            case order.APP_ORDER:
              unpublished = await order.unpublishApporder(
                chain.contracts,
                getPropertyFormChain(chain, 'iexecGateway'),
                orderHashToUnpublish,
              );
              break;
            case order.DATASET_ORDER:
              unpublished = await order.unpublishDatasetorder(
                chain.contracts,
                getPropertyFormChain(chain, 'iexecGateway'),
                orderHashToUnpublish,
              );
              break;
            case order.WORKERPOOL_ORDER:
              unpublished = await order.unpublishWorkerpoolorder(
                chain.contracts,
                getPropertyFormChain(chain, 'iexecGateway'),
                orderHashToUnpublish,
              );
              break;
            case order.REQUEST_ORDER:
              unpublished = await order.unpublishRequestorder(
                chain.contracts,
                getPropertyFormChain(chain, 'iexecGateway'),
                orderHashToUnpublish,
              );
              break;
            default:
          }
          spinner.info(
            `${orderName} with orderHash ${unpublished} successfully unpublished`,
          );
          Object.assign(success, { [orderName]: { orderHash: unpublished } });
        } catch (error) {
          failed.push(`${orderName}: ${error.message}`);
        }
      };

      if (opts.app) await unpublishOrder(order.APP_ORDER, opts.app);
      if (opts.dataset) await unpublishOrder(order.DATASET_ORDER, opts.dataset);
      if (opts.workerpool) await unpublishOrder(order.WORKERPOOL_ORDER, opts.workerpool);
      if (opts.request) await unpublishOrder(order.REQUEST_ORDER, opts.request);

      if (failed.length === 0) {
        spinner.succeed('Successfully unpublished', {
          raw: success,
        });
      } else {
        spinner.fail(`Failed to unpublish: ${pretty(failed)}`, {
          raw: { ...success, fail: failed },
        });
      }
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const cancel = cli.command('cancel');
addGlobalOptions(cancel);
addWalletLoadOptions(cancel);
cancel
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.force())
  .option(...option.cancelAppOrder())
  .option(...option.cancelDatasetOrder())
  .option(...option.cancelWorkerpoolOrder())
  .option(...option.cancelRequestOrder())
  .description(desc.cancel(objName))
  .action(async (cmd) => {
    const opts = cmd.opts();
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      if (!(opts.app || opts.dataset || opts.workerpool || opts.request)) {
        throw new Error(
          'No option specified, you should choose one (--app | --dataset | --workerpool | --request)',
        );
      }
      const walletOptions = await computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const [chain, signedOrders] = await Promise.all([
        loadChain(opts.chain, { spinner }),
        loadSignedOrders(),
      ]);
      await connectKeystore(chain, keystore, { txOptions });
      const success = {};
      const failed = [];

      const cancelOrder = async (orderName) => {
        try {
          const orderToCancel = signedOrders[chain.id][orderName];
          if (!orderToCancel) {
            throw new Error(
              `Missing signed ${orderName} for chain ${chain.id} in "orders.json"`,
            );
          }
          if (!opts.force) await prompt.cancelOrder(orderName, pretty(orderToCancel));
          spinner.start(`Canceling ${orderName}`);
          let cancelTx;
          switch (orderName) {
            case order.APP_ORDER:
              cancelTx = (
                await order.cancelApporder(chain.contracts, orderToCancel)
              ).txHash;
              break;
            case order.DATASET_ORDER:
              cancelTx = (
                await order.cancelDatasetorder(chain.contracts, orderToCancel)
              ).txHash;
              break;
            case order.WORKERPOOL_ORDER:
              cancelTx = (
                await order.cancelWorkerpoolorder(
                  chain.contracts,
                  orderToCancel,
                )
              ).txHash;
              break;
            case order.REQUEST_ORDER:
              cancelTx = (
                await order.cancelRequestorder(chain.contracts, orderToCancel)
              ).txHash;
              break;
            default:
          }

          spinner.info(`${orderName} successfully canceled (${cancelTx})`);
          Object.assign(success, { [orderName]: { txHash: cancelTx } });
        } catch (error) {
          failed.push(`${orderName}: ${error.message}`);
        }
      };

      if (opts.app) await cancelOrder(order.APP_ORDER);
      if (opts.dataset) await cancelOrder(order.DATASET_ORDER);
      if (opts.workerpool) await cancelOrder(order.WORKERPOOL_ORDER);
      if (opts.request) await cancelOrder(order.REQUEST_ORDER);

      if (failed.length === 0) {
        spinner.succeed('Successfully canceled', {
          raw: success,
        });
      } else {
        spinner.fail(`Failed to cancel: ${pretty(failed)}`, {
          raw: { ...success, fail: failed },
        });
      }
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const show = cli.command('show');
addGlobalOptions(show);
show
  .option(...option.chain())
  .option(...option.showAppOrder())
  .option(...option.showDatasetOrder())
  .option(...option.showWorkerpoolOrder())
  .option(...option.showRequestOrder())
  .option(...option.showOrderDeals())
  .description(desc.showObj(objName, 'marketplace'))
  .action(async (cmd) => {
    const opts = cmd.opts();
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      if (!(opts.app || opts.dataset || opts.workerpool || opts.request)) {
        throw new Error(
          'No option specified, you should choose one (--app | --dataset | --workerpool | --request)',
        );
      }
      const chain = await loadChain(opts.chain, {
        spinner,
      });
      const success = {};
      const failed = [];

      const showOrder = async (orderName, cmdInput) => {
        try {
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
            orderHash = await order.computeOrderHash(
              chain.contracts,
              orderName,
              signedOrder,
            );
          } else {
            orderHash = cmdInput;
          }
          isBytes32(orderHash);
          spinner.start(info.showing(orderName));
          const orderToShow = await order.fetchPublishedOrderByHash(
            getPropertyFormChain(chain, 'iexecGateway'),
            orderName,
            chain.id,
            orderHash,
          );
          let deals;
          if (opts.deals) {
            deals = await order.fetchDealsByOrderHash(
              getPropertyFormChain(chain, 'iexecGateway'),
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
          const raw = {

            ...orderToShow,
            ...deals && { deals: { count: deals.count, lastDeals: deals.deals } },
          };
          spinner.info(`${orderString}${opts.deals ? dealsString : ''}`);
          Object.assign(success, { [orderName]: raw });
        } catch (error) {
          failed.push(`${orderName}: ${error.message}`);
        }
      };

      if (opts.app) await showOrder(order.APP_ORDER, opts.app);
      if (opts.dataset) await showOrder(order.DATASET_ORDER, opts.dataset);
      if (opts.workerpool) await showOrder(order.WORKERPOOL_ORDER, opts.workerpool);
      if (opts.request) await showOrder(order.REQUEST_ORDER, opts.request);
      if (failed.length === 0) {
        spinner.succeed('Successfully found', {
          raw: success,
        });
      } else {
        spinner.fail(`Failed to show: ${pretty(failed)}`, {
          raw: { ...success, fail: failed },
        });
      }
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

help(cli);
