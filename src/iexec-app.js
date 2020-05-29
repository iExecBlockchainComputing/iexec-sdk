#!/usr/bin/env node

const cli = require('commander');
const Debug = require('debug');
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
  prompt,
  Spinner,
  pretty,
  info,
  isEthAddress,
  renderTasksStatus,
} = require('./cli-helper');
const {
  deployApp,
  showApp,
  showUserApp,
  countUserApps,
  getAppOwner,
  getDatasetOwner,
  getWorkerpoolOwner,
  showCategory,
  checkDeployedApp,
  checkDeployedDataset,
  checkDeployedWorkerpool,
} = require('./hub');
const {
  loadIExecConf,
  initObj,
  saveDeployedObj,
  loadDeployedObj,
} = require('./fs');
const { checkRequestRequirements } = require('./request-helper');
const {
  getRemainingVolume,
  createApporder,
  createDatasetorder,
  createWorkerpoolorder,
  createRequestorder,
  signApporder,
  signDatasetorder,
  signWorkerpoolorder,
  signRequestorder,
  matchOrders,
  NULL_DATASETORDER,
  WORKERPOOL_ORDER,
} = require('./order');
const {
  fetchAppOrderbook,
  fetchDatasetOrderbook,
  fetchWorkerpoolOrderbook,
} = require('./orderbook');
const { checkBalance } = require('./account');
const { obsDeal } = require('./iexecProcess');
const { Keystore } = require('./keystore');
const { loadChain } = require('./chains');
const {
  NULL_ADDRESS,
  NULL_BYTES32,
  encodeTag,
  sumTags,
  checkActiveBitInTag,
  BN,
  stringifyNestedBn,
} = require('./utils');
const { IEXEC_GATEWAY_URL } = require('./api-utils');
const {
  tagSchema,
  catidSchema,
  addressSchema,
  paramsSchema,
  positiveIntSchema,
} = require('./validator');

const debug = Debug('iexec:iexec-app');

const objName = 'app';

cli.name('iexec app').usage('<command> [options]');

const init = cli.command('init');
addGlobalOptions(init);
addWalletLoadOptions(init);
init.description(desc.initObj(objName)).action(async (cmd) => {
  await checkUpdate(cmd);
  const spinner = Spinner(cmd);
  try {
    const walletOptions = await computeWalletLoadOptions(cmd);
    const keystore = Keystore(
      Object.assign({}, walletOptions, { isSigner: false }),
    );
    const [address] = await keystore.accounts();
    const { saved, fileName } = await initObj(objName, {
      overwrite: { owner: address },
    });
    spinner.succeed(
      `Saved default ${objName} in "${fileName}", you can edit it:${pretty(
        saved,
      )}`,
      { raw: { app: saved } },
    );
  } catch (error) {
    handleError(error, cli, cmd);
  }
});

const deploy = cli.command('deploy');
addGlobalOptions(deploy);
addWalletLoadOptions(deploy);
deploy
  .option(...option.chain())
  .option(...option.txGasPrice())
  .description(desc.deployObj(objName))
  .action(async (cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const txOptions = computeTxOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [chain, iexecConf] = await Promise.all([
        loadChain(cmd.chain, keystore, { spinner, txOptions }),
        loadIExecConf(),
      ]);
      if (!iexecConf[objName]) {
        throw Error(
          `Missing ${objName} in "iexec.json". Did you forget to run "iexec ${objName} init"?`,
        );
      }
      await keystore.load();
      spinner.start(info.deploying(objName));
      const { address, txHash } = await deployApp(
        chain.contracts,
        iexecConf[objName],
      );
      spinner.succeed(`Deployed new ${objName} at address ${address}`, {
        raw: { address, txHash },
      });
      await saveDeployedObj(objName, chain.id, address);
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const show = cli.command('show [addressOrIndex]');
addGlobalOptions(show);
addWalletLoadOptions(show);
show
  .option(...option.chain())
  .option(...option.user())
  .description(desc.showObj(objName))
  .action(async (cliAddressOrIndex, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(
        Object.assign({}, walletOptions, { isSigner: false }),
      );
      const [chain, [address], deployedObj] = await Promise.all([
        loadChain(cmd.chain, keystore, { spinner }),
        keystore.accounts(),
        loadDeployedObj(objName),
      ]);

      const addressOrIndex = cliAddressOrIndex || deployedObj[chain.id];

      const isAddress = isEthAddress(addressOrIndex, { strict: false });
      const userAddress = cmd.user || (address !== NULL_ADDRESS && address);
      if (!isAddress && !userAddress) throw Error(`Missing option ${option.user()[0]} or wallet`);

      if (!addressOrIndex) throw Error(info.missingAddress(objName));
      spinner.start(info.showing(objName));

      let res;
      if (isAddress) {
        res = await showApp(chain.contracts, addressOrIndex);
      } else {
        res = await showUserApp(chain.contracts, addressOrIndex, userAddress);
      }
      const { app, objAddress } = res;
      spinner.succeed(`App ${objAddress} details:${pretty(app)}`, {
        raw: { address: objAddress, app },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const count = cli.command('count');
addGlobalOptions(count);
addWalletLoadOptions(count);
count
  .option(...option.chain())
  .option(...option.user())
  .description(desc.countObj(objName))
  .action(async (cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    const walletOptions = await computeWalletLoadOptions(cmd);
    const keystore = Keystore(
      Object.assign({}, walletOptions, { isSigner: false }),
    );
    try {
      const [chain, [address]] = await Promise.all([
        loadChain(cmd.chain, keystore, { spinner }),
        keystore.accounts(),
      ]);
      const userAddress = cmd.user || (address !== NULL_ADDRESS && address);
      if (!userAddress) throw Error(`Missing option ${option.user()[0]} or wallet`);
      spinner.start(info.counting(objName));
      const objCountBN = await countUserApps(chain.contracts, userAddress);
      spinner.succeed(
        `User ${userAddress} has a total of ${objCountBN} ${objName}`,
        { raw: { count: objCountBN.toString() } },
      );
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const run = cli.command('run [appAddress]');
addGlobalOptions(run);
addWalletLoadOptions(run);
run
  .option(...option.chain())
  .option(...option.appRunDataset())
  .option(...option.appRunWorkerpool())
  .option(...option.appRunCategory())
  .option(...option.appRunParams())
  .option(...option.appRunTag())
  .option(...option.appRunTrust())
  .option(...option.appRunBeneficiary())
  .option(...option.appRunCallback())
  .option(...option.appRunWatch())
  .option(...option.force())
  .option(...option.skipRequestCheck())
  .description(desc.appRun())
  .action(async (appAddress, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    const walletOptions = await computeWalletLoadOptions(cmd);
    const keystore = Keystore(walletOptions);
    try {
      const [
        chain,
        deployedApp,
        deployedDataset,
        deployedWorkerpool,
      ] = await Promise.all([
        loadChain(cmd.chain, keystore, { spinner }),
        loadDeployedObj('app'),
        loadDeployedObj('dataset'),
        loadDeployedObj('workerpool'),
      ]);

      const result = { deals: [] };

      const useDeployedApp = !appAddress;
      const app = appAddress || (deployedApp && deployedApp[chain.id]);
      if (!app) {
        throw Error(
          `Missing appAddress and no app found in "deployed.json" for chain ${chain.id}`,
        );
      }
      debug('useDeployedApp', useDeployedApp, 'app', app);
      if (useDeployedApp) {
        spinner.info(
          'No app specified, using last app deployed from "deployed.json"',
        );
      }

      const useDataset = cmd.dataset !== undefined;
      const useDeployedDataset = useDataset && cmd.dataset === true;
      const dataset = useDataset
        && (useDeployedDataset ? deployedDataset[chain.id] : cmd.dataset);
      if (useDataset && !dataset) {
        throw Error(
          `Missing address for option --dataset [address] and no dataset found in "deployed.json" for chain ${chain.id}`,
        );
      }
      debug(
        'useDataset',
        useDataset,
        'useDeployedDataset',
        useDeployedDataset,
        'dataset',
        dataset,
      );
      if (useDeployedDataset) {
        spinner.info(
          'No dataset specified, using last dataset deployed from "deployed.json"',
        );
      }

      const runOnWorkerpool = cmd.workerpool !== undefined;
      const useDeployedWorkerpool = runOnWorkerpool && cmd.workerpool === true;
      const workerpool = runOnWorkerpool
        && (useDeployedWorkerpool ? deployedWorkerpool[chain.id] : cmd.workerpool);
      if (runOnWorkerpool && !workerpool) {
        throw Error(
          `Missing address for option --workerpool [address] and no workerpool found in "deployed.json" for chain ${chain.id}`,
        );
      }
      debug(
        'runOnWorkerpool',
        runOnWorkerpool,
        'useDeployedWorkerpool',
        useDeployedWorkerpool,
        'workerpool',
        workerpool,
      );
      if (useDeployedWorkerpool) {
        spinner.info(
          'No workerpool specified, using last workerpool deployed from "deployed.json"',
        );
      }

      const [requester] = await keystore.accounts();
      debug('requester', requester);

      const params = await paramsSchema().validate(cmd.params);
      debug('params', params);
      const category = await catidSchema().validate(cmd.category);
      const useCategory = category !== undefined;
      debug('useCategory', useCategory, 'category', category);
      const tag = await tagSchema().validate(cmd.tag || NULL_BYTES32);
      debug('tag', tag);
      const trust = await positiveIntSchema().validate(cmd.trust || '0');
      debug('trust', trust);
      const callback = await addressSchema({
        ethProvider: chain.contracts.jsonRpcProvider,
      }).validate(cmd.callback || NULL_ADDRESS);
      debug('callback', callback);
      const beneficiary = cmd.beneficiary === undefined
        ? undefined
        : await addressSchema({
          ethProvider: chain.contracts.jsonRpcProvider,
        }).validate(cmd.beneficiary);
      debug('beneficiary', beneficiary);

      const watch = !!cmd.watch || !!cmd.download;
      debug('watch', watch);
      const download = !!cmd.download;
      debug('download', download);

      const getApporder = async () => {
        spinner.info(`Using app ${app}`);
        if (!(await checkDeployedApp(chain.contracts, app))) throw Error(`No app deployed at address ${app}`);
        const appOwner = await getAppOwner(chain.contracts, app);
        const isAppOwner = appOwner.toLowerCase() === requester.toLowerCase();
        if (isAppOwner) {
          spinner.info('Creating apporder');
          const order = await createApporder(chain.contracts, {
            app,
            appprice: 0,
            volume: 1,
            requesterrestrict: requester,
            tag,
          }).then(o => signApporder(chain.contracts, o));
          return order;
        }
        spinner.info('Fetching apporder from iExec Marketplace');
        const teeAppRequired = checkActiveBitInTag(tag, 1);
        const { appOrders } = await fetchAppOrderbook(
          chain.contracts,
          IEXEC_GATEWAY_URL,
          app,
          {
            ...(teeAppRequired && { minTag: encodeTag(['tee']) }),
          },
        );
        const order = appOrders[0] && appOrders[0].order;
        if (!order) throw Error(`No order available for app ${app}`);
        return order;
      };

      const getDatasetorder = async () => {
        spinner.info(
          useDataset ? `Using dataset ${dataset}` : 'Not using dataset',
        );
        if (!useDataset) return NULL_DATASETORDER;
        if (
          typeof dataset === 'string'
          && dataset.toLowerCase() === NULL_ADDRESS
        ) return NULL_DATASETORDER;
        if (!(await checkDeployedDataset(chain.contracts, dataset))) throw Error(`No dataset deployed at address ${dataset}`);
        const datasetOwner = await getDatasetOwner(chain.contracts, dataset);
        const isDatasetOwner = datasetOwner.toLowerCase() === requester.toLowerCase();
        if (isDatasetOwner) {
          spinner.info('Creating datasetorder');
          const order = await createDatasetorder(chain.contracts, {
            dataset,
            datasetprice: 0,
            volume: 1,
            requesterrestrict: requester,
            tag,
          }).then(o => signDatasetorder(chain.contracts, o));
          return order;
        }
        spinner.info('Fetching datasetorder from iExec Marketplace');
        const { datasetOrders } = await fetchDatasetOrderbook(
          chain.contracts,
          IEXEC_GATEWAY_URL,
          dataset,
          {
            app,
          },
        );
        const order = datasetOrders[0] && datasetOrders[0].order;
        if (!order) throw Error(`No order available for dataset ${dataset}`);
        return order;
      };

      spinner.start('Preparing deal');

      const apporder = await getApporder();
      const datasetorder = await getDatasetorder();

      debug('apporder', apporder);
      debug('datasetorder', datasetorder);

      const getWorkerpoolorder = async () => {
        spinner.info(
          workerpool
            ? `Using workerpool ${workerpool}`
            : 'Using any workerpool',
        );
        const minTag = sumTags([apporder.tag, datasetorder.tag, tag]);
        debug('minTag', minTag);
        if (runOnWorkerpool) {
          if (!(await checkDeployedWorkerpool(chain.contracts, workerpool))) throw Error(`No workerpool deployed at address ${workerpool}`);
          const workerpoolOwner = await getWorkerpoolOwner(
            chain.contracts,
            workerpool,
          );
          const isWorkerpoolOwner = workerpoolOwner.toLowerCase() === requester.toLowerCase();
          if (isWorkerpoolOwner) {
            spinner.info('Creating workerpoolorder');
            const order = await createWorkerpoolorder(chain.contracts, {
              workerpool,
              workerpoolprice: 0,
              volume: 1,
              requesterrestrict: requester,
              tag: minTag,
              trust,
              category: category || 0,
            }).then(o => signWorkerpoolorder(chain.contracts, o));
            return order;
          }
        }
        spinner.info('Fetching workerpoolorder from iExec Marketplace');
        const fetchWorkerpoolOrder = async (
          catid = 0,
          { strict = false } = {},
        ) => {
          debug('try category', catid, 'strict', strict);
          const { workerpoolOrders } = await fetchWorkerpoolOrderbook(
            chain.contracts,
            IEXEC_GATEWAY_URL,
            catid,
            {
              workerpoolAddress: workerpool,
              minTag,
              minTrust: trust,
            },
          );

          const getFirstOpen = async (i = 0) => {
            const order = workerpoolOrders[i] && workerpoolOrders[i].order;
            if (order) {
              const workerpoolVolume = await getRemainingVolume(
                chain.contracts,
                WORKERPOOL_ORDER,
                order,
              );
              if (workerpoolVolume.gte(new BN(0))) {
                return order;
              }
              return getFirstOpen(i + 1);
            }
            return null;
          };
          const order = await getFirstOpen();

          if (order) {
            return order;
          }
          if (strict) {
            throw Error(
              `No workerpoolorder matching your conditions available in category ${category}`,
            );
          }
          const nextCatid = catid + 1;
          try {
            await showCategory(chain.contracts, nextCatid);
          } catch (error) {
            debug(error);
            throw Error(
              'No workerpoolorder matching your conditions currently available',
            );
          }
          return fetchWorkerpoolOrder(nextCatid);
        };
        const order = await fetchWorkerpoolOrder(category, {
          strict: useCategory,
        });
        if (!order) {
          throw Error(`No workerpoolorder available in category ${category}`);
        }
        return order;
      };

      const workerpoolorder = await getWorkerpoolorder();

      debug('workerpoolorder', workerpoolorder);
      debug('apporder', apporder);
      debug('datasetorder', datasetorder);

      spinner.info('Creating requestorder');
      const requestorderToSign = await createRequestorder(
        { contracts: chain.contracts, resultProxyURL: chain.resultProxy },
        {
          app: apporder.app,
          appmaxprice: apporder.appprice,
          dataset: datasetorder.dataset,
          datasetmaxprice: datasetorder.datasetprice,
          workerpool: workerpoolorder.workerpool,
          workerpoolmaxprice: workerpoolorder.workerpoolprice,
          requester,
          volume: 1,
          tag,
          category: workerpoolorder.category,
          trust,
          beneficiary: beneficiary || requester,
          callback,
          params,
        },
      );
      if (!cmd.skipRequestCheck) {
        await checkRequestRequirements(
          { contracts: chain.contracts, smsURL: chain.sms },
          requestorderToSign,
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
      const requestorder = await signRequestorder(
        chain.contracts,
        requestorderToSign,
      );

      debug('requestorder', requestorder);

      const totalCost = new BN(requestorder.appmaxprice)
        .add(new BN(requestorder.datasetmaxprice))
        .add(new BN(requestorder.workerpoolmaxprice))
        .mul(new BN(requestorder.volume));

      const { stake } = await checkBalance(chain.contracts, requester);
      if (totalCost.gt(stake)) {
        throw Error(
          `Not enough RLC on your account (${totalCost} nRLC required). Run "iexec account deposit" to topup your account.`,
        );
      }

      spinner.stop();

      if (!cmd.force) {
        await prompt.custom(
          `Do you want to spend ${totalCost} nRLC to execute the following request: ${pretty(
            {
              app: `${requestorder.app} (${requestorder.appmaxprice} nRLC)`,
              dataset:
                requestorder.dataset !== NULL_ADDRESS
                  ? `${requestorder.dataset} (${requestorder.datasetmaxprice} nRLC)`
                  : undefined,
              workerpool: `${requestorder.workerpool} (${requestorder.workerpoolmaxprice} nRLC)`,
              params: requestorder.params || undefined,
              category: requestorder.category,
              tag:
                requestorder.tag !== NULL_BYTES32
                  ? requestorder.tag
                  : undefined,
              callback:
                requestorder.callback !== NULL_ADDRESS
                  ? requestorder.callback
                  : undefined,
              beneficiary:
                requestorder.beneficiary !== requestorder.requester
                  ? requestorder.beneficiary
                  : undefined,
            },
          )}`,
        );
      }

      spinner.start('Submitting deal');
      const { dealid, volume, txHash } = await matchOrders(
        chain.contracts,
        apporder,
        datasetorder,
        workerpoolorder,
        requestorder,
      );

      result.deals.push({ dealid, volume: volume.toString(), txHash });

      if (!watch) {
        spinner.succeed(`Deal submitted with dealid ${dealid}`, {
          raw: result,
        });
      } else {
        spinner.info(`Deal submitted with dealid ${dealid}`);

        const waitDealFinalState = () => new Promise((resolve, reject) => {
          let dealState;
          obsDeal(chain.contracts, dealid).subscribe({
            next: (data) => {
              dealState = data;
              spinner.start(
                `Watching execution...\n${renderTasksStatus(data.tasks)}`,
              );
            },
            error: reject,
            complete: () => resolve(dealState),
          });
        });

        const dealFinalState = await waitDealFinalState();

        const tasksArray = Object.values(dealFinalState.tasks).map(
          stringifyNestedBn,
        );
        result.tasks = tasksArray;
        const failedTasks = tasksArray.reduce(
          (acc, curr) => (curr.status !== 3 ? [...acc, curr] : acc),
          [],
        );
        if (failedTasks.length === 0) {
          spinner.succeed(
            `App run successful:\n${renderTasksStatus(dealFinalState.tasks)}`,
            {
              raw: result,
            },
          );
        } else {
          result.failedTasks = failedTasks;
          spinner.fail(
            `App run failed:\n${renderTasksStatus(dealFinalState.tasks)}`,
            {
              raw: result,
            },
          );
        }
      }
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
