#!/usr/bin/env node
import { program as cli } from 'commander';
import Debug from 'debug';
import {
  createApporder,
  createDatasetorder,
  createRequestorder,
  createWorkerpoolorder,
  signApporder,
  signDatasetorder,
  signRequestorder,
  signWorkerpoolorder,
  cancelApporder,
  cancelDatasetorder,
  cancelRequestorder,
  cancelWorkerpoolorder,
  computeOrderHash,
  matchOrders,
} from '../../common/market/order.js';
import {
  publishApporder,
  publishDatasetorder,
  publishRequestorder,
  publishWorkerpoolorder,
  unpublishApporder,
  unpublishDatasetorder,
  unpublishRequestorder,
  unpublishWorkerpoolorder,
  fetchPublishedOrderByHash,
} from '../../common/market/marketplace.js';
import { fetchDealsByOrderHash } from '../../common/execution/deal.js';
import {
  checkDeployedApp,
  checkDeployedDataset,
  checkDeployedWorkerpool,
} from '../../common/protocol/registries.js';
import {
  NULL_ADDRESS,
  APP,
  DATASET,
  WORKERPOOL,
  REQUEST,
  APP_ORDER,
  DATASET_ORDER,
  WORKERPOOL_ORDER,
  REQUEST_ORDER,
} from '../../common/utils/constant.js';
import {
  finalizeCli,
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
  getSmsUrlFromChain,
} from '../utils/cli-helper.js';
import {
  checkRequestRequirements,
  resolveTeeFrameworkFromTag,
  checkDatasetRequirements,
  checkAppRequirements,
} from '../../common/execution/order-helper.js';
import {
  loadIExecConf,
  initOrderObj,
  loadDeployedObj,
  saveSignedOrder,
  loadSignedOrders,
} from '../utils/fs.js';
import { loadChain, connectKeystore } from '../utils/chains.js';
import { Keystore } from '../utils/keystore.js';
import { sumTags } from '../../lib/utils.js';
import {
  requestorderSchema,
  apporderSchema,
  datasetorderSchema,
} from '../../common/utils/validator.js';

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
  .action(async (opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const initAll = !(
        opts.app ||
        opts.dataset ||
        opts.workerpool ||
        opts.request
      );

      const walletOptions = computeWalletLoadOptions(opts);

      const chain = await loadChain(opts.chain, { spinner });
      const success = {};
      const failed = [];

      const initOrder = async (resourceName) => {
        const orderName = resourceName.concat('order');
        try {
          spinner.start(`Creating ${orderName}`);
          const overwrite = {};
          if (resourceName === REQUEST) {
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

      if (opts.app || initAll) await initOrder(APP);
      if (opts.dataset || initAll) await initOrder(DATASET);
      if (opts.workerpool || initAll) await initOrder(WORKERPOOL);
      if (opts.request || initAll) await initOrder(REQUEST);

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
  .option(...option.skipPreflightCheck())
  .description(desc.sign())
  .action(async (opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const signAll = !(
        opts.app ||
        opts.dataset ||
        opts.workerpool ||
        opts.request
      );
      const walletOptions = computeWalletLoadOptions(opts);
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
            throw new Error(info.missingOrder(APP_ORDER, 'app'));
          }
          const orderObj = await createApporder(chain.contracts, loadedOrder);
          if (!(await checkDeployedApp(chain.contracts, orderObj.app)))
            throw Error(`No app deployed at address ${orderObj.app}`);
          if (!opts.skipPreflightCheck) {
            await checkAppRequirements(
              {
                contracts: chain.contracts,
              },
              orderObj,
            ).catch((e) => {
              throw Error(
                `App requirements check failed: ${
                  e.message
                } (If you consider this is not an issue, use ${
                  option.skipPreflightCheck()[0]
                } to skip preflight requirement check)`,
              );
            });
          }
          const signedOrder = await signApporder(chain.contracts, orderObj);
          const { saved, fileName } = await saveSignedOrder(
            APP_ORDER,
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
            throw new Error(info.missingOrder(DATASET_ORDER, 'dataset'));
          }
          const orderObj = await createDatasetorder(
            chain.contracts,
            loadedOrder,
          );
          if (!(await checkDeployedDataset(chain.contracts, orderObj.dataset)))
            throw Error(`No dataset deployed at address ${orderObj.dataset}`);
          if (!opts.skipPreflightCheck) {
            await checkDatasetRequirements(
              {
                contracts: chain.contracts,
                smsURL: getSmsUrlFromChain(chain, {
                  teeFramework: await resolveTeeFrameworkFromTag(orderObj.tag),
                }),
              },
              orderObj,
            ).catch((e) => {
              throw Error(
                `Dataset requirements check failed: ${
                  e.message
                } (If you consider this is not an issue, use ${
                  option.skipPreflightCheck()[0]
                } to skip preflight requirement check)`,
              );
            });
          }
          const signedOrder = await signDatasetorder(chain.contracts, orderObj);
          const { saved, fileName } = await saveSignedOrder(
            DATASET_ORDER,
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
          const loadedOrder =
            iexecConf.order && iexecConf.order.workerpoolorder;
          if (!loadedOrder) {
            throw new Error(info.missingOrder(WORKERPOOL_ORDER, 'workerpool'));
          }
          const orderObj = await createWorkerpoolorder(
            chain.contracts,
            loadedOrder,
          );
          if (
            !(await checkDeployedWorkerpool(
              chain.contracts,
              orderObj.workerpool,
            ))
          )
            throw Error(
              `No workerpool deployed at address ${orderObj.workerpool}`,
            );
          const signedOrder = await signWorkerpoolorder(
            chain.contracts,
            orderObj,
          );
          const { saved, fileName } = await saveSignedOrder(
            WORKERPOOL_ORDER,
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
            throw new Error(info.missingOrder(REQUEST_ORDER, 'request'));
          }
          const orderObj = await createRequestorder(
            {
              contracts: chain.contracts,
              resultProxyURL: getPropertyFormChain(chain, 'resultProxy'),
            },
            loadedOrder,
          );
          if (!(await checkDeployedApp(chain.contracts, orderObj.app)))
            throw Error(`No app deployed at address ${orderObj.app}`);
          if (!opts.skipPreflightCheck) {
            await checkRequestRequirements(
              {
                contracts: chain.contracts,
                smsURL: getSmsUrlFromChain(chain, {
                  teeFramework: await resolveTeeFrameworkFromTag(orderObj.tag),
                }),
              },
              orderObj,
            ).catch((e) => {
              throw Error(
                `Request requirements check failed: ${
                  e.message
                } (If you consider this is not an issue, use ${
                  option.skipPreflightCheck()[0]
                } to skip preflight requirement check)`,
              );
            });
          }
          const signedOrder = await signRequestorder(chain.contracts, orderObj);
          const { saved, fileName } = await saveSignedOrder(
            REQUEST_ORDER,
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
  .option(...option.txConfirms())
  .option(...option.force())
  .option(...option.fillAppOrder())
  .option(...option.fillDatasetOrder())
  .option(...option.fillWorkerpoolOrder())
  .option(...option.fillRequestOrder())
  .option(...option.fillRequestParams())
  .option(...option.skipPreflightCheck())
  .description(desc.fill(objName))
  .action(async (opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const [chain, signedOrders] = await Promise.all([
        loadChain(opts.chain, { txOptions, spinner }),
        loadSignedOrders(),
      ]);

      const inputParams = opts.params;
      const requestOnTheFly = inputParams !== undefined;

      const getOrderByHash = async (orderName, orderHash) => {
        if (isBytes32(orderHash, { strict: false })) {
          spinner.info(
            `Fetching ${orderName} ${orderHash} from iexec marketplace`,
          );
          const orderRes = await fetchPublishedOrderByHash(
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
        ? await getOrderByHash(APP_ORDER, opts.app)
        : signedOrders[chain.id].apporder;
      const datasetOrder = opts.dataset
        ? await getOrderByHash(DATASET_ORDER, opts.dataset)
        : signedOrders[chain.id].datasetorder;
      const workerpoolOrder = opts.workerpool
        ? await getOrderByHash(WORKERPOOL_ORDER, opts.workerpool)
        : signedOrders[chain.id].workerpoolorder;
      let requestOrderInput;
      if (requestOnTheFly) {
        requestOrderInput = undefined;
      } else {
        requestOrderInput = opts.request
          ? await getOrderByHash(REQUEST_ORDER, opts.request)
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
        const unsignedOrder = await createRequestorder(
          {
            contracts: chain.contracts,
            resultProxyURL: getPropertyFormChain(chain, 'resultProxy'),
          },
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
          await prompt.signGeneratedOrder(REQUEST_ORDER, pretty(unsignedOrder));
        }
        return signRequestorder(chain.contracts, unsignedOrder);
      };

      const requestOrder = requestOrderInput || (await computeRequestOrder());
      if (!requestOrder) {
        throw new Error('Missing requestorder');
      }

      if (!opts.skipPreflightCheck) {
        const resolvedTag = sumTags([
          (
            await requestorderSchema()
              .label('requestorder')
              .validate(requestOrder)
          ).tag,
          (await apporderSchema().label('apporder').validate(appOrder)).tag,
          (
            await datasetorderSchema()
              .label('datasetorder')
              .validate(datasetOrder)
          ).tag,
        ]);
        await checkAppRequirements(
          {
            contracts: chain.contracts,
          },
          appOrder,
          { tagOverride: resolvedTag },
        ).catch((e) => {
          throw Error(
            `App requirements check failed: ${
              e.message
            } (If you consider this is not an issue, use ${
              option.skipPreflightCheck()[0]
            } to skip preflight requirement check)`,
          );
        });
        await checkDatasetRequirements(
          {
            contracts: chain.contracts,
            smsURL: getSmsUrlFromChain(chain, {
              teeFramework: await resolveTeeFrameworkFromTag(resolvedTag),
            }),
          },
          datasetOrder,
          { tagOverride: resolvedTag },
        ).catch((e) => {
          throw Error(
            `Dataset requirements check failed: ${
              e.message
            } (If you consider this is not an issue, use ${
              option.skipPreflightCheck()[0]
            } to skip preflight requirement check)`,
          );
        });
        await checkRequestRequirements(
          {
            contracts: chain.contracts,
            smsURL: getSmsUrlFromChain(chain, {
              teeFramework: await resolveTeeFrameworkFromTag(resolvedTag),
            }),
          },
          requestOrder,
        ).catch((e) => {
          throw Error(
            `Request requirements check failed: ${
              e.message
            } (If you consider this is not an issue, use ${
              option.skipPreflightCheck()[0]
            } to skip preflight requirement check)`,
          );
        });
      }

      await connectKeystore(chain, keystore, { txOptions });
      spinner.start(info.filling(objName));
      const { dealid, volume, txHash } = await matchOrders(
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
  .option(...option.skipPreflightCheck())
  .description(desc.publish(objName))
  .action(async (opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      if (!(opts.app || opts.dataset || opts.workerpool || opts.request)) {
        throw new Error(
          'No option specified, you should choose one (--app | --dataset | --workerpool | --request)',
        );
      }
      const walletOptions = computeWalletLoadOptions(opts);
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
          const orderToPublish =
            signedOrders[chain.id] && signedOrders[chain.id][orderName];
          if (!orderToPublish) {
            throw new Error(
              `Missing signed ${orderName} for chain ${chain.id} in "orders.json"`,
            );
          }
          if (!opts.force)
            await prompt.publishOrder(orderName, pretty(orderToPublish));
          spinner.start(`Publishing ${orderName}`);

          let orderHash;
          switch (orderName) {
            case APP_ORDER:
              if (!opts.skipPreflightCheck) {
                await checkAppRequirements(
                  {
                    contracts: chain.contracts,
                  },
                  orderToPublish,
                ).catch((e) => {
                  throw Error(
                    `App requirements check failed: ${
                      e.message
                    } (If you consider this is not an issue, use ${
                      option.skipPreflightCheck()[0]
                    } to skip preflight requirement check)`,
                  );
                });
              }
              orderHash = await publishApporder(
                chain.contracts,
                getPropertyFormChain(chain, 'iexecGateway'),
                orderToPublish,
              );
              break;
            case DATASET_ORDER:
              if (!opts.skipPreflightCheck) {
                await checkDatasetRequirements(
                  {
                    contracts: chain.contracts,
                    smsURL: getSmsUrlFromChain(chain, {
                      teeFramework: await resolveTeeFrameworkFromTag(
                        orderToPublish.tag,
                      ),
                    }),
                  },
                  orderToPublish,
                ).catch((e) => {
                  throw Error(
                    `Dataset requirements check failed: ${
                      e.message
                    } (If you consider this is not an issue, use ${
                      option.skipPreflightCheck()[0]
                    } to skip preflight requirement check)`,
                  );
                });
              }
              orderHash = await publishDatasetorder(
                chain.contracts,
                getPropertyFormChain(chain, 'iexecGateway'),
                orderToPublish,
              );
              break;
            case WORKERPOOL_ORDER:
              orderHash = await publishWorkerpoolorder(
                chain.contracts,
                getPropertyFormChain(chain, 'iexecGateway'),
                orderToPublish,
              );
              break;
            case REQUEST_ORDER:
              if (!opts.skipPreflightCheck) {
                await checkRequestRequirements(
                  {
                    contracts: chain.contracts,
                    smsURL: getSmsUrlFromChain(chain, {
                      teeFramework: await resolveTeeFrameworkFromTag(
                        orderToPublish.tag,
                      ),
                    }),
                  },
                  orderToPublish,
                ).catch((e) => {
                  throw Error(
                    `Request requirements check failed: ${
                      e.message
                    } (If you consider this is not an issue, use ${
                      option.skipPreflightCheck()[0]
                    } to skip preflight requirement check)`,
                  );
                });
              }
              orderHash = await publishRequestorder(
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

      if (opts.app) await publishOrder(APP_ORDER);
      if (opts.dataset) await publishOrder(DATASET_ORDER);
      if (opts.workerpool) await publishOrder(WORKERPOOL_ORDER);
      if (opts.request) await publishOrder(REQUEST_ORDER);

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
  .action(async (opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      if (!(opts.app || opts.dataset || opts.workerpool || opts.request)) {
        throw new Error(
          'No option specified, you should choose one (--app | --dataset | --workerpool | --request)',
        );
      }
      const walletOptions = computeWalletLoadOptions(opts);
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
            const orderToUnpublish =
              signedOrders[chain.id] && signedOrders[chain.id][orderName];
            if (!orderToUnpublish) {
              throw new Error(
                `No orderHash specified and no signed ${orderName} found for chain ${chain.id} in "orders.json"`,
              );
            }
            orderHashToUnpublish = await computeOrderHash(
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
            case APP_ORDER:
              unpublished = await unpublishApporder(
                chain.contracts,
                getPropertyFormChain(chain, 'iexecGateway'),
                orderHashToUnpublish,
              );
              break;
            case DATASET_ORDER:
              unpublished = await unpublishDatasetorder(
                chain.contracts,
                getPropertyFormChain(chain, 'iexecGateway'),
                orderHashToUnpublish,
              );
              break;
            case WORKERPOOL_ORDER:
              unpublished = await unpublishWorkerpoolorder(
                chain.contracts,
                getPropertyFormChain(chain, 'iexecGateway'),
                orderHashToUnpublish,
              );
              break;
            case REQUEST_ORDER:
              unpublished = await unpublishRequestorder(
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

      if (opts.app) await unpublishOrder(APP_ORDER, opts.app);
      if (opts.dataset) await unpublishOrder(DATASET_ORDER, opts.dataset);
      if (opts.workerpool)
        await unpublishOrder(WORKERPOOL_ORDER, opts.workerpool);
      if (opts.request) await unpublishOrder(REQUEST_ORDER, opts.request);

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
  .option(...option.txConfirms())
  .option(...option.force())
  .option(...option.cancelAppOrder())
  .option(...option.cancelDatasetOrder())
  .option(...option.cancelWorkerpoolOrder())
  .option(...option.cancelRequestOrder())
  .description(desc.cancel(objName))
  .action(async (opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      if (!(opts.app || opts.dataset || opts.workerpool || opts.request)) {
        throw new Error(
          'No option specified, you should choose one (--app | --dataset | --workerpool | --request)',
        );
      }
      const walletOptions = computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const [chain, signedOrders] = await Promise.all([
        loadChain(opts.chain, { txOptions, spinner }),
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
          if (!opts.force)
            await prompt.cancelOrder(orderName, pretty(orderToCancel));
          spinner.start(`Canceling ${orderName}`);
          let cancelTx;
          switch (orderName) {
            case APP_ORDER:
              cancelTx = (await cancelApporder(chain.contracts, orderToCancel))
                .txHash;
              break;
            case DATASET_ORDER:
              cancelTx = (
                await cancelDatasetorder(chain.contracts, orderToCancel)
              ).txHash;
              break;
            case WORKERPOOL_ORDER:
              cancelTx = (
                await cancelWorkerpoolorder(chain.contracts, orderToCancel)
              ).txHash;
              break;
            case REQUEST_ORDER:
              cancelTx = (
                await cancelRequestorder(chain.contracts, orderToCancel)
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

      if (opts.app) await cancelOrder(APP_ORDER);
      if (opts.dataset) await cancelOrder(DATASET_ORDER);
      if (opts.workerpool) await cancelOrder(WORKERPOOL_ORDER);
      if (opts.request) await cancelOrder(REQUEST_ORDER);

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
  .action(async (opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      if (!(opts.app || opts.dataset || opts.workerpool || opts.request)) {
        throw new Error(
          'No option specified, you should choose one (--app | --dataset | --workerpool | --request)',
        );
      }
      const chain = await loadChain(opts.chain, { spinner });
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
            orderHash = await computeOrderHash(
              chain.contracts,
              orderName,
              signedOrder,
            );
          } else {
            orderHash = cmdInput;
          }
          isBytes32(orderHash);
          spinner.start(info.showing(orderName));
          const orderToShow = await fetchPublishedOrderByHash(
            getPropertyFormChain(chain, 'iexecGateway'),
            orderName,
            chain.id,
            orderHash,
          );
          let deals;
          if (opts.deals) {
            deals = await fetchDealsByOrderHash(
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
          const dealsString =
            deals && deals.count
              ? `\nDeals count: ${deals.count}\nLast deals: ${pretty(
                  deals.deals,
                )}`
              : '\nDeals count: 0';
          const raw = {
            ...orderToShow,
            ...(deals && {
              deals: { count: deals.count, lastDeals: deals.deals },
            }),
          };
          spinner.info(`${orderString}${opts.deals ? dealsString : ''}`);
          Object.assign(success, { [orderName]: raw });
        } catch (error) {
          failed.push(`${orderName}: ${error.message}`);
        }
      };

      if (opts.app) await showOrder(APP_ORDER, opts.app);
      if (opts.dataset) await showOrder(DATASET_ORDER, opts.dataset);
      if (opts.workerpool) await showOrder(WORKERPOOL_ORDER, opts.workerpool);
      if (opts.request) await showOrder(REQUEST_ORDER, opts.request);
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

finalizeCli(cli);
