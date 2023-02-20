#!/usr/bin/env node

import { program as cli } from 'commander';
import Debug from 'debug';
import {
  tagSchema,
  catidSchema,
  addressSchema,
  paramsSchema,
  positiveIntSchema,
  positiveStrictIntSchema,
  paramsArgsSchema,
  paramsInputFilesArraySchema,
  paramsStorageProviderSchema,
  paramsEncryptResultSchema,
  paramsRequesterSecretsSchema,
  nRlcAmountSchema,
  teeFrameworkSchema,
  datasetorderSchema,
  apporderSchema,
  requestorderSchema,
} from '../../common/utils/validator.js';
import { sconeTeeApp, gramineTeeApp } from '../utils/templates.js';
import {
  deployApp,
  showApp,
  showUserApp,
  countUserApps,
  getAppOwner,
  getDatasetOwner,
  getWorkerpoolOwner,
  checkDeployedApp,
  checkDeployedDataset,
  checkDeployedWorkerpool,
  resolveTeeFrameworkFromApp,
} from '../../common/protocol/registries.js';
import { showCategory } from '../../common/protocol/category.js';
import {
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
} from '../../common/market/order.js';
import {
  publishApporder,
  publishRequestorder,
  unpublishLastApporder,
  unpublishAllApporders,
} from '../../common/market/marketplace.js';
import {
  fetchAppOrderbook,
  fetchDatasetOrderbook,
  fetchWorkerpoolOrderbook,
} from '../../common/market/orderbook.js';
import { checkBalance } from '../../common/account/balance.js';
import { obsDeal } from '../../common/execution/deal.js';
import {
  encodeTag,
  sumTags,
  checkActiveBitInTag,
  BN,
  stringifyNestedBn,
  formatRLC,
  TAG_MAP,
} from '../../common/utils/utils.js';
import {
  NULL_ADDRESS,
  NULL_BYTES32,
  NULL_DATASETORDER,
  WORKERPOOL_ORDER,
  DATASET,
  APP,
  WORKERPOOL,
  TEE_FRAMEWORKS,
  IEXEC_REQUEST_PARAMS,
} from '../../common/utils/constant.js';
import {
  checkRequestRequirements,
  checkDatasetRequirements,
  resolveTeeFrameworkFromTag,
  checkAppRequirements,
} from '../../common/execution/order-helper.js';
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
  orderOption,
  prompt,
  Spinner,
  pretty,
  info,
  isEthAddress,
  renderTasksStatus,
  getPropertyFormChain,
  getDefaultTeeFrameworkFromChain,
  getSmsUrlFromChain,
  optionCreator,
} from '../utils/cli-helper.js';
import {
  loadIExecConf,
  initObj,
  saveDeployedObj,
  loadDeployedObj,
} from '../utils/fs.js';
import { Keystore } from '../utils/keystore.js';
import { loadChain, connectKeystore } from '../utils/chains.js';
import { lookupAddress } from '../../common/ens/resolution.js';
import {
  ConfigurationError,
  ValidationError,
} from '../../common/utils/errors.js';
import { pushAppSecret } from '../../common/sms/push.js';
import { checkAppSecretExists } from '../../common/sms/check.js';

const debug = Debug('iexec:iexec-app');

const objName = APP;

cli
  .name('iexec app')
  .usage('<command> [options]')
  .storeOptionsAsProperties(false);

const init = cli.command('init');
addGlobalOptions(init);
addWalletLoadOptions(init);
init
  .option(...option.initTee())
  .addOption(optionCreator.teeFramework())
  .description(desc.initObj(objName))
  .action(async (opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore({ ...walletOptions, isSigner: false });
      const [address] = await keystore.accounts();

      const teeFramework =
        (await teeFrameworkSchema().validate(opts.teeFramework)) ||
        (opts.tee &&
          getDefaultTeeFrameworkFromChain(
            await loadChain(opts.chain, { spinner }),
          ));
      let teeTemplate = {};
      if (teeFramework === TEE_FRAMEWORKS.SCONE) {
        teeTemplate = sconeTeeApp;
      }
      if (teeFramework === TEE_FRAMEWORKS.GRAMINE) {
        teeTemplate = gramineTeeApp;
      }
      const { saved, fileName } = await initObj(objName, {
        overwrite: { ...teeTemplate, owner: address },
      });
      spinner.succeed(
        `Saved default ${objName} in "${fileName}", you can edit it:${pretty(
          saved,
        )}`,
        { raw: { app: saved } },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const deploy = cli.command('deploy');
addGlobalOptions(deploy);
addWalletLoadOptions(deploy);
deploy
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .description(desc.deployObj(objName))
  .action(async (opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const [chain, iexecConf] = await Promise.all([
        loadChain(opts.chain, { txOptions, spinner }),
        loadIExecConf(),
      ]);
      if (!iexecConf[objName]) {
        throw Error(
          `Missing ${objName} in "iexec.json". Did you forget to run "iexec ${objName} init"?`,
        );
      }
      await connectKeystore(chain, keystore, { txOptions });
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
      handleError(error, cli, opts);
    }
  });

const show = cli.command('show [addressOrIndex]');
addGlobalOptions(show);
addWalletLoadOptions(show);
show
  .option(...option.chain())
  .option(...option.user())
  .description(desc.showObj(objName))
  .action(async (cliAddressOrIndex, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore({ ...walletOptions, isSigner: false });
      const [chain, [address]] = await Promise.all([
        loadChain(opts.chain, { spinner }),
        keystore.accounts(),
      ]);
      const addressOrIndex =
        cliAddressOrIndex ||
        (await loadDeployedObj(objName).then(
          (deployedObj) => deployedObj && deployedObj[chain.id],
        ));

      const isAddress = isEthAddress(addressOrIndex, { strict: false });
      const userAddress = opts.user || (address !== NULL_ADDRESS && address);
      if (!isAddress && !userAddress)
        throw Error(`Missing option ${option.user()[0]} or wallet`);

      if (!addressOrIndex) throw Error(info.missingAddress(objName));
      spinner.start(info.showing(objName));

      let res;
      let ens;
      if (isAddress) {
        [res, ens] = await Promise.all([
          showApp(chain.contracts, addressOrIndex),
          lookupAddress(chain.contracts, addressOrIndex).catch((e) => {
            if (e instanceof ConfigurationError) {
              /** no ENS */
            } else {
              throw e;
            }
          }),
        ]);
      } else {
        res = await showUserApp(chain.contracts, addressOrIndex, userAddress);
        ens = await lookupAddress(chain.contracts, res.objAddress).catch(
          (e) => {
            if (e instanceof ConfigurationError) {
              /** no ENS */
            } else {
              throw e;
            }
          },
        );
      }
      const { app, objAddress } = res;
      spinner.succeed(
        `App ${objAddress} details:${pretty({
          ...(ens && { ENS: ens }),
          ...app,
        })}`,
        {
          raw: { address: objAddress, ens, app },
        },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const count = cli.command('count');
addGlobalOptions(count);
addWalletLoadOptions(count);
count
  .option(...option.chain())
  .option(...option.user())
  .description(desc.countObj(objName))
  .action(async (opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    const walletOptions = await computeWalletLoadOptions(opts);
    const keystore = Keystore({ ...walletOptions, isSigner: false });
    try {
      const [chain, [address]] = await Promise.all([
        loadChain(opts.chain, { spinner }),
        keystore.accounts(),
      ]);
      const userAddress = opts.user || (address !== NULL_ADDRESS && address);
      if (!userAddress)
        throw Error(`Missing option ${option.user()[0]} or wallet`);
      spinner.start(info.counting(objName));
      const objCountBN = await countUserApps(chain.contracts, userAddress);
      spinner.succeed(
        `User ${userAddress} has a total of ${objCountBN} ${objName}`,
        { raw: { count: objCountBN.toString() } },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const checkSecret = cli.command('check-secret [appAddress]');
addGlobalOptions(checkSecret);
checkSecret
  .option(...option.chain())
  .addOption(optionCreator.teeFramework())
  .description(desc.checkSecret())
  .action(async (objAddress, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const chain = await loadChain(opts.chain, { spinner });
      const resourceAddress =
        objAddress ||
        (await loadDeployedObj(objName).then(
          (deployedObj) => deployedObj && deployedObj[chain.id],
        ));
      if (!resourceAddress) {
        throw Error(
          'Missing appAddress argument and no app found in "deployed.json"',
        );
      }
      spinner.info(`Checking secret for address ${resourceAddress}`);
      let teeFramework = await teeFrameworkSchema().validate(opts.teeFramework);
      if (!teeFramework) {
        const { app } = await showApp(chain.contracts, resourceAddress);
        teeFramework = await resolveTeeFrameworkFromApp(app);
      }
      const sms = getSmsUrlFromChain(chain, { teeFramework });
      const secretIsSet = await checkAppSecretExists(
        chain.contracts,
        sms,
        resourceAddress,
      );
      if (secretIsSet) {
        spinner.succeed(`Secret found for app ${resourceAddress}`, {
          raw: { isSecretSet: true },
        });
      } else {
        spinner.succeed(`No secret found for app ${resourceAddress}`, {
          raw: { isSecretSet: false },
        });
      }
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const pushSecret = cli.command('push-secret [appAddress]');
addGlobalOptions(pushSecret);
addWalletLoadOptions(pushSecret);
pushSecret
  .option(...option.chain())
  .option(...option.secretValue())
  .addOption(optionCreator.teeFramework())
  .description('push the app secret to the secret management service')
  .action(async (objAddress, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore(Object.assign(walletOptions));
      const chain = await loadChain(opts.chain, { spinner });
      const { contracts } = chain;
      await keystore.accounts();
      const resourceAddress =
        objAddress ||
        (await loadDeployedObj(objName).then(
          (deployedObj) => deployedObj && deployedObj[chain.id],
        ));
      if (!resourceAddress) {
        throw Error(
          'Missing appAddress argument and no app found in "deployed.json"',
        );
      }
      spinner.info(`App ${resourceAddress}`);
      let teeFramework = await teeFrameworkSchema().validate(opts.teeFramework);
      if (!teeFramework) {
        const { app } = await showApp(chain.contracts, resourceAddress);
        teeFramework = await resolveTeeFrameworkFromApp(app);
      }
      const sms = getSmsUrlFromChain(chain, { teeFramework });
      const secretValue =
        opts.secretValue ||
        (await prompt.password(`Paste your secret`, {
          useMask: true,
        }));

      await connectKeystore(chain, keystore);
      const isPushed = await pushAppSecret(
        contracts,
        sms,
        resourceAddress,
        secretValue,
      );
      if (isPushed) {
        spinner.succeed('Secret successfully pushed', {
          raw: {},
        });
      } else {
        throw Error('Something went wrong');
      }
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const publish = cli.command('publish [appAddress]');
addGlobalOptions(publish);
addWalletLoadOptions(publish);
publish
  .description(desc.publishObj(objName))
  .option(...option.chain())
  .option(...option.force())
  .option(...orderOption.price())
  .option(...orderOption.volume())
  .option(...orderOption.tag())
  .option(...orderOption.datasetrestrict())
  .option(...orderOption.workerpoolrestrict())
  .option(...orderOption.requesterrestrict())
  .option(...option.skipPreflightCheck())
  .action(async (objAddress, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    const walletOptions = await computeWalletLoadOptions(opts);
    const keystore = Keystore(walletOptions);
    try {
      const chain = await loadChain(opts.chain, { spinner });
      const useDeployedObj = !objAddress;
      const address =
        objAddress ||
        (await loadDeployedObj(objName).then(
          (deployedObj) => deployedObj && deployedObj[chain.id],
        ));
      if (!address) {
        throw Error(info.missingAddressOrDeployed(objName, chain.id));
      }
      debug('useDeployedObj', useDeployedObj, 'address', address);
      if (useDeployedObj) {
        spinner.info(
          `No ${objName} specified, using last ${objName} deployed from "deployed.json"`,
        );
      }
      spinner.info(`Creating ${objName}order for ${objName} ${address}`);
      if (!(await checkDeployedApp(chain.contracts, address))) {
        throw Error(`No ${objName} deployed at address ${address}`);
      }
      const overrides = {
        app: address,
        appprice: opts.price,
        volume: opts.volume || '1000000',
        tag: opts.tag,
        datasetrestrict: opts.datasetRestrict,
        workerpoolrestrict: opts.workerpoolRestrict,
        requesterrestrict: opts.requesterRestrict,
      };
      const orderToSign = await createApporder(chain.contracts, overrides);
      if (!opts.skipPreflightCheck) {
        await checkAppRequirements({ contracts: chain.contracts }, orderToSign);
      }
      if (!opts.force) {
        await prompt.publishOrder(`${objName}order`, pretty(orderToSign));
      }
      await connectKeystore(chain, keystore);
      const signedOrder = await signApporder(chain.contracts, orderToSign);
      const orderHash = await publishApporder(
        chain.contracts,
        getPropertyFormChain(chain, 'iexecGateway'),
        signedOrder,
      );
      spinner.succeed(
        `Successfully published ${objName}order with orderHash ${orderHash}\nRun "iexec orderbook ${objName} ${address}" to show published ${objName}orders`,
        {
          raw: {
            orderHash,
          },
        },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const unpublish = cli.command('unpublish [appAddress]');
addGlobalOptions(unpublish);
addWalletLoadOptions(unpublish);
unpublish
  .description(desc.unpublishObj(objName))
  .option(...option.chain())
  .option(...option.force())
  .option(...option.unpublishAllOrders())
  .action(async (objAddress, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    const walletOptions = await computeWalletLoadOptions(opts);
    const keystore = Keystore(walletOptions);
    try {
      const chain = await loadChain(opts.chain, { spinner });
      const useDeployedObj = !objAddress;
      const address =
        objAddress ||
        (await loadDeployedObj(objName).then(
          (deployedObj) => deployedObj && deployedObj[chain.id],
        ));
      if (!address) {
        throw Error(info.missingAddressOrDeployed(objName, chain.id));
      }
      debug('useDeployedObj', useDeployedObj, 'address', address);
      if (useDeployedObj) {
        spinner.info(
          `No ${objName} specified, using last ${objName} deployed from "deployed.json"`,
        );
      }
      const all = !!opts.all;
      if (!opts.force) {
        await prompt.unpublishOrder(objName, address, all);
      }
      await connectKeystore(chain, keystore);
      const unpublished = all
        ? await unpublishAllApporders(
            chain.contracts,
            getPropertyFormChain(chain, 'iexecGateway'),
            address,
          )
        : await unpublishLastApporder(
            chain.contracts,
            getPropertyFormChain(chain, 'iexecGateway'),
            address,
          );
      spinner.succeed(
        `Successfully unpublished ${all ? 'all' : 'last'} ${objName}order${
          all ? 's' : ''
        }`,
        {
          raw: {
            unpublished,
          },
        },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const run = cli.command('run [appAddress]');
addGlobalOptions(run);
addWalletLoadOptions(run);
run
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .option(...option.force())
  .option(...option.appRunWatch())
  .option(...orderOption.dataset())
  .option(...orderOption.workerpool())
  .option(...orderOption.requestArgs())
  .option(...orderOption.requestInputFiles())
  .option(...orderOption.requestSecrets())
  .option(...orderOption.category())
  .option(...orderOption.tag())
  .option(...orderOption.requestStorageProvider())
  .option(...orderOption.callback())
  .option(...orderOption.requestEncryptResult())
  .option(...orderOption.trust())
  .option(...orderOption.beneficiary())
  .option(...orderOption.params())
  .option(...option.skipPreflightCheck())
  .description(desc.appRun())
  .action(async (appAddress, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const chain = await loadChain(opts.chain, { txOptions, spinner });
      const result = { deals: [] };
      const useDeployedApp = !appAddress;
      const app =
        appAddress ||
        (await loadDeployedObj(APP).then(
          (deployedApp) => deployedApp && deployedApp[chain.id],
        ));
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

      const useDataset = opts.dataset !== undefined;
      const useDeployedDataset = useDataset && opts.dataset === 'deployed';
      const dataset =
        useDataset &&
        (useDeployedDataset
          ? await loadDeployedObj(DATASET).then(
              (deployedDataset) => deployedDataset && deployedDataset[chain.id],
            )
          : opts.dataset);
      if (useDataset && !dataset) {
        throw Error(
          `No dataset found in "deployed.json" for chain ${chain.id}`,
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
        spinner.info('Using last dataset deployed from "deployed.json"');
      }

      const runOnWorkerpool = opts.workerpool !== undefined;
      const useDeployedWorkerpool =
        runOnWorkerpool && opts.workerpool === 'deployed';
      const workerpool =
        runOnWorkerpool &&
        (useDeployedWorkerpool
          ? await loadDeployedObj(WORKERPOOL).then(
              (deployedWorkerpool) =>
                deployedWorkerpool && deployedWorkerpool[chain.id],
            )
          : opts.workerpool);
      if (runOnWorkerpool && !workerpool) {
        throw Error(
          `No workerpool found in "deployed.json" for chain ${chain.id}`,
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
        spinner.info('Using last workerpool deployed from "deployed.json"');
      }

      const [requester] = await keystore.accounts();
      debug('requester', requester);

      const inputParams = await paramsSchema().validate(opts.params);
      const inputParamsArgs = await paramsArgsSchema().validate(opts.args);
      const inputParamsInputFiles =
        await paramsInputFilesArraySchema().validate(opts.inputFiles);

      const inputParamsSecrets =
        opts.secret &&
        (await paramsRequesterSecretsSchema()
          .label('requester secret')
          .validate(
            opts.secret.reduce((mappings, currMapping) => {
              const separatorIndex = currMapping.indexOf('=');
              if (separatorIndex === -1) {
                throw new ValidationError(
                  `'${currMapping}' is not a valid secret mapping syntax (must be <appSecretKey>=<requesterSecretName>)`,
                  currMapping,
                );
              }
              return {
                ...mappings,
                [currMapping.slice(0, separatorIndex)]: currMapping.slice(
                  separatorIndex + 1,
                ),
              };
            }, {}),
          ));
      const inputParamsStorageProvider =
        await paramsStorageProviderSchema().validate(opts.storageProvider);
      const inputParamsResultEncryption =
        await paramsEncryptResultSchema().validate(opts.encryptResult);

      const params = {
        ...(inputParams !== undefined && JSON.parse(inputParams)),
        ...(inputParamsArgs !== undefined && {
          [IEXEC_REQUEST_PARAMS.IEXEC_ARGS]: inputParamsArgs,
        }),
        ...(inputParamsInputFiles !== undefined && {
          [IEXEC_REQUEST_PARAMS.IEXEC_INPUT_FILES]: inputParamsInputFiles,
        }),
        ...(inputParamsSecrets !== undefined && {
          [IEXEC_REQUEST_PARAMS.IEXEC_SECRETS]: inputParamsSecrets,
        }),
        ...(inputParamsStorageProvider !== undefined && {
          [IEXEC_REQUEST_PARAMS.IEXEC_RESULT_STORAGE_PROVIDER]:
            inputParamsStorageProvider,
        }),
        ...(inputParamsResultEncryption !== undefined && {
          [IEXEC_REQUEST_PARAMS.IEXEC_RESULT_ENCRYPTION]:
            inputParamsResultEncryption,
        }),
      };
      debug('params', params);
      const category = await catidSchema().validate(opts.category);
      const useCategory = category !== undefined;
      debug('useCategory', useCategory, 'category', category);
      const tag = await tagSchema().validate(opts.tag || NULL_BYTES32);
      debug('tag', tag);
      const trust = await positiveIntSchema().validate(opts.trust || '0');
      debug('trust', trust);
      const callback = await addressSchema({
        ethProvider: chain.contracts.provider,
      }).validate(opts.callback || NULL_ADDRESS);
      debug('callback', callback);
      const beneficiary =
        opts.beneficiary === undefined
          ? undefined
          : await addressSchema({
              ethProvider: chain.contracts.provider,
            }).validate(opts.beneficiary);
      debug('beneficiary', beneficiary);

      const watch = !!opts.watch || !!opts.download;
      debug('watch', watch);
      const download = !!opts.download;
      debug('download', download);

      const getApporder = async () => {
        spinner.info(`Using app ${app}`);
        if (!(await checkDeployedApp(chain.contracts, app)))
          throw Error(`No app deployed at address ${app}`);
        const appOwner = await getAppOwner(chain.contracts, app);
        const isAppOwner = appOwner.toLowerCase() === requester.toLowerCase();
        if (isAppOwner) {
          spinner.info('Creating apporder');
          await connectKeystore(chain, keystore);
          return await createApporder(chain.contracts, {
            app,
            appprice: 0,
            volume: 1,
            requesterrestrict: requester,
            tag,
          }).then((o) => signApporder(chain.contracts, o));
        }
        spinner.info('Fetching apporder from iExec Marketplace');
        const minTags = [];
        if (checkActiveBitInTag(tag, TAG_MAP.tee)) {
          minTags.push('tee');
        }
        Object.values(TEE_FRAMEWORKS).forEach((teeFrameworkTag) => {
          if (checkActiveBitInTag(tag, TAG_MAP[teeFrameworkTag])) {
            minTags.push(teeFrameworkTag);
          }
        });
        const { orders } = await fetchAppOrderbook(
          chain.contracts,
          getPropertyFormChain(chain, 'iexecGateway'),
          app,
          {
            requester,
            ...(useDataset && { dataset }),
            ...(runOnWorkerpool && { workerpool }),
            ...{ minTag: encodeTag(minTags) },
            maxTag: tag,
          },
        );
        const order = orders[0] && orders[0].order;
        if (!order) throw Error(`No order available for app ${app}`);
        return order;
      };

      const getDatasetorder = async () => {
        spinner.info(
          useDataset ? `Using dataset ${dataset}` : 'Not using dataset',
        );
        if (!useDataset) return NULL_DATASETORDER;
        if (
          typeof dataset === 'string' &&
          dataset.toLowerCase() === NULL_ADDRESS
        )
          return NULL_DATASETORDER;
        if (!(await checkDeployedDataset(chain.contracts, dataset)))
          throw Error(`No dataset deployed at address ${dataset}`);
        const datasetOwner = await getDatasetOwner(chain.contracts, dataset);
        const isDatasetOwner =
          datasetOwner.toLowerCase() === requester.toLowerCase();
        if (isDatasetOwner) {
          spinner.info('Creating datasetorder');
          await connectKeystore(chain, keystore);
          return await createDatasetorder(chain.contracts, {
            dataset,
            datasetprice: 0,
            volume: 1,
            requesterrestrict: requester,
            tag,
          }).then((o) => signDatasetorder(chain.contracts, o));
        }
        spinner.info('Fetching datasetorder from iExec Marketplace');
        const { orders } = await fetchDatasetOrderbook(
          chain.contracts,
          getPropertyFormChain(chain, 'iexecGateway'),
          dataset,
          {
            app,
            requester,
            ...(runOnWorkerpool && { workerpool }),
            maxTag: tag,
          },
        );
        const order = orders[0] && orders[0].order;
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
          if (!(await checkDeployedWorkerpool(chain.contracts, workerpool)))
            throw Error(`No workerpool deployed at address ${workerpool}`);
          const workerpoolOwner = await getWorkerpoolOwner(
            chain.contracts,
            workerpool,
          );
          const isWorkerpoolOwner =
            workerpoolOwner.toLowerCase() === requester.toLowerCase();
          if (isWorkerpoolOwner) {
            spinner.info('Creating workerpoolorder');
            await connectKeystore(chain, keystore);
            return await createWorkerpoolorder(chain.contracts, {
              workerpool,
              workerpoolprice: 0,
              volume: 1,
              requesterrestrict: requester,
              tag: minTag,
              trust,
              category: category || 0,
            }).then((o) => signWorkerpoolorder(chain.contracts, o));
          }
        }
        spinner.info('Fetching workerpoolorder from iExec Marketplace');
        const fetchWorkerpoolOrder = async (
          catid = 0,
          { strict = false } = {},
        ) => {
          debug('try category', catid, 'strict', strict);
          const { orders } = await fetchWorkerpoolOrderbook(
            chain.contracts,
            getPropertyFormChain(chain, 'iexecGateway'),
            {
              category: catid,
              app,
              ...(useDataset && { dataset }),
              ...(runOnWorkerpool && { workerpool }),
              requester,
              minTag,
              minTrust: trust,
            },
          );

          const getFirstOpen = async (i = 0) => {
            const order = orders[i] && orders[i].order;
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
      await connectKeystore(chain, keystore, { txOptions });
      const requestorderToSign = await createRequestorder(
        {
          contracts: chain.contracts,
          resultProxyURL: getPropertyFormChain(chain, 'resultProxy'),
        },
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
      if (!opts.skipPreflightCheck) {
        const resolvedTag = sumTags([
          (
            await requestorderSchema()
              .label('requestorder')
              .validate(requestorderToSign)
          ).tag,
          (await apporderSchema().label('apporder').validate(apporder)).tag,
          (
            await datasetorderSchema()
              .label('datasetorder')
              .validate(datasetorder)
          ).tag,
        ]);
        await checkAppRequirements(
          {
            contracts: chain.contracts,
          },
          apporder,
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
          datasetorder,
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
          requestorderToSign,
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
          `Not enough RLC on your account (${formatRLC(
            totalCost,
          )} RLC required). Run "iexec account deposit" to topup your account.`,
        );
      }

      spinner.stop();

      if (!opts.force) {
        await prompt.custom(
          `Do you want to spend ${formatRLC(
            totalCost,
          )} RLC to execute the following request: ${pretty({
            app: `${requestorder.app} (${formatRLC(
              requestorder.appmaxprice,
            )} RLC)`,
            dataset:
              requestorder.dataset !== NULL_ADDRESS
                ? `${requestorder.dataset} (${formatRLC(
                    requestorder.datasetmaxprice,
                  )} RLC)`
                : undefined,
            workerpool: `${requestorder.workerpool} (${formatRLC(
              requestorder.workerpoolmaxprice,
            )} RLC)`,
            params:
              (requestorder.params && JSON.parse(requestorder.params)) ||
              undefined,
            category: requestorder.category,
            tag:
              requestorder.tag !== NULL_BYTES32 ? requestorder.tag : undefined,
            callback:
              requestorder.callback !== NULL_ADDRESS
                ? requestorder.callback
                : undefined,
            beneficiary:
              requestorder.beneficiary !== requestorder.requester
                ? requestorder.beneficiary
                : undefined,
          })}`,
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

        const waitDealFinalState = () =>
          new Promise((resolve, reject) => {
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
            `App run successful:\n${renderTasksStatus(dealFinalState.tasks, {
              detailed: true,
            })}`,
            {
              raw: result,
            },
          );
        } else {
          result.failedTasks = failedTasks;
          spinner.fail(
            `App run failed:\n${renderTasksStatus(dealFinalState.tasks, {
              detailed: true,
            })}`,
            {
              raw: result,
            },
          );
        }
      }
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const requestRun = cli.command('request-execution <appAddress>');
addGlobalOptions(requestRun);
addWalletLoadOptions(requestRun);
requestRun
  .option(...option.chain())
  .option(...option.force())
  .option(...orderOption.dataset({ allowDeployed: false }))
  .option(...orderOption.workerpool({ allowDeployed: false }))
  .option(...orderOption.appprice())
  .option(...orderOption.datasetprice())
  .option(...orderOption.workerpoolprice())
  .option(...orderOption.requestArgs())
  .option(...orderOption.requestInputFiles())
  .option(...orderOption.requestSecrets())
  .option(...orderOption.category())
  .option(...orderOption.tag())
  .option(...orderOption.volume())
  .option(...orderOption.requestStorageProvider())
  .option(...orderOption.callback())
  .option(...orderOption.requestEncryptResult())
  .option(...orderOption.trust())
  .option(...orderOption.beneficiary())
  .option(...orderOption.params())
  .option(...option.skipPreflightCheck())
  .description(desc.requestRun())
  .action(async (app, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore(walletOptions);
      const chain = await loadChain(opts.chain, { spinner });
      debug('app', app);
      if (!(await checkDeployedApp(chain.contracts, app))) {
        throw Error(`No app deployed at address ${app}`);
      }
      const dataset = opts.dataset || NULL_ADDRESS;
      debug('dataset', dataset);
      if (
        dataset !== NULL_ADDRESS &&
        !(await checkDeployedDataset(chain.contracts, dataset))
      ) {
        throw Error(`No dataset deployed at address ${dataset}`);
      }
      const workerpool = opts.workerpool || NULL_ADDRESS;
      debug('workerpool', workerpool);
      if (
        workerpool !== NULL_ADDRESS &&
        !(await checkDeployedWorkerpool(chain.contracts, workerpool))
      ) {
        throw Error(`No workerpool deployed at address ${workerpool}`);
      }
      const appprice = await nRlcAmountSchema().validate(opts.appPrice || 0);
      debug('appprice', appprice);
      const datasetprice = await nRlcAmountSchema().validate(
        (dataset !== NULL_ADDRESS && opts.datasetPrice) || 0,
      );
      debug('datasetprice', datasetprice);
      const workerpoolprice = await nRlcAmountSchema().validate(
        opts.workerpoolPrice || 0,
      );
      debug('workerpoolprice', workerpoolprice);

      const volume = await positiveStrictIntSchema().validate(opts.volume || 1);
      debug('volume', volume);

      const [requester] = await keystore.accounts();
      debug('requester', requester);

      const inputParams = await paramsSchema().validate(opts.params);
      const inputParamsArgs = await paramsArgsSchema().validate(opts.args);
      const inputParamsInputFiles =
        await paramsInputFilesArraySchema().validate(opts.inputFiles);
      const inputParamsSecrets =
        opts.secret &&
        (await paramsRequesterSecretsSchema()
          .label('requester secret')
          .validate(
            opts.secret.reduce((mappings, currMapping) => {
              const separatorIndex = currMapping.indexOf('=');
              if (separatorIndex === -1) {
                throw new ValidationError(
                  `'${currMapping}' is not a valid secret mapping syntax (must be <appSecretKey>=<requesterSecretName>)`,
                  currMapping,
                );
              }
              return {
                ...mappings,
                [currMapping.slice(0, separatorIndex)]: currMapping.slice(
                  separatorIndex + 1,
                ),
              };
            }, {}),
          ));
      const inputParamsStorageProvider =
        await paramsStorageProviderSchema().validate(opts.storageProvider);
      const inputParamsResultEncryption =
        await paramsEncryptResultSchema().validate(opts.encryptResult);

      const params = {
        ...(inputParams !== undefined && JSON.parse(inputParams)),
        ...(inputParamsArgs !== undefined && {
          [IEXEC_REQUEST_PARAMS.IEXEC_ARGS]: inputParamsArgs,
        }),
        ...(inputParamsInputFiles !== undefined && {
          [IEXEC_REQUEST_PARAMS.IEXEC_INPUT_FILES]: inputParamsInputFiles,
        }),
        ...(inputParamsSecrets !== undefined && {
          [IEXEC_REQUEST_PARAMS.IEXEC_SECRETS]: inputParamsSecrets,
        }),
        ...(inputParamsStorageProvider !== undefined && {
          [IEXEC_REQUEST_PARAMS.IEXEC_RESULT_STORAGE_PROVIDER]:
            inputParamsStorageProvider,
        }),
        ...(inputParamsResultEncryption !== undefined && {
          [IEXEC_REQUEST_PARAMS.IEXEC_RESULT_ENCRYPTION]:
            inputParamsResultEncryption,
        }),
      };
      debug('params', params);
      const category = await catidSchema().validate(opts.category || 0);
      const useCategory = category !== undefined;
      debug('useCategory', useCategory, 'category', category);
      const tag = await tagSchema().validate(opts.tag || NULL_BYTES32);
      debug('tag', tag);
      const trust = await positiveIntSchema().validate(opts.trust || 0);
      debug('trust', trust);
      const callback = await addressSchema({
        ethProvider: chain.contracts.provider,
      }).validate(opts.callback || NULL_ADDRESS);
      debug('callback', callback);
      const beneficiary =
        opts.beneficiary === undefined
          ? undefined
          : await addressSchema({
              ethProvider: chain.contracts.provider,
            }).validate(opts.beneficiary);
      debug('beneficiary', beneficiary);

      spinner.info('Creating requestorder');
      await connectKeystore(chain, keystore);
      const requestorderToSign = await createRequestorder(
        {
          contracts: chain.contracts,
          resultProxyURL: getPropertyFormChain(chain, 'resultProxy'),
        },
        {
          app,
          appmaxprice: appprice,
          dataset: dataset || NULL_ADDRESS,
          datasetmaxprice: datasetprice,
          workerpool: workerpool || NULL_ADDRESS,
          workerpoolmaxprice: workerpoolprice,
          requester,
          volume,
          tag,
          category,
          trust,
          beneficiary: beneficiary || requester,
          callback,
          params,
        },
      );
      if (!opts.skipPreflightCheck) {
        await checkRequestRequirements(
          {
            contracts: chain.contracts,
            smsURL: getSmsUrlFromChain(chain),
          },
          requestorderToSign,
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
          `Not enough RLC on your account (${formatRLC(
            totalCost,
          )} RLC required). Run "iexec account deposit" to topup your account.`,
        );
      }

      spinner.stop();

      if (!opts.force) {
        await prompt.custom(
          `Do you want to place the following execution request for ${formatRLC(
            totalCost,
          )} RLC \n - The amount will be taken from your account only if your request is filled.\n - Your request will be disabled if your stake drops under ${formatRLC(
            totalCost,
          )} RLC. ${pretty({
            app: `${requestorder.app} (${formatRLC(
              requestorder.appmaxprice,
            )} RLC)`,
            dataset:
              requestorder.dataset !== NULL_ADDRESS
                ? `${requestorder.dataset} (${formatRLC(
                    requestorder.datasetmaxprice,
                  )} RLC)`
                : undefined,
            workerpool: `${requestorder.workerpool} (${formatRLC(
              requestorder.workerpoolmaxprice,
            )} RLC)`,
            volume: requestorder.volume,
            params:
              (requestorder.params && JSON.parse(requestorder.params)) ||
              undefined,
            category: requestorder.category,
            tag:
              requestorder.tag !== NULL_BYTES32 ? requestorder.tag : undefined,
            callback:
              requestorder.callback !== NULL_ADDRESS
                ? requestorder.callback
                : undefined,
            beneficiary:
              requestorder.beneficiary !== requestorder.requester
                ? requestorder.beneficiary
                : undefined,
          })}`,
        );
      }

      spinner.start('Publishing requestorder');
      const orderHash = await publishRequestorder(
        chain.contracts,
        getPropertyFormChain(chain, 'iexecGateway'),
        requestorder,
      );
      spinner.succeed(
        `Successfully published requestorder with orderHash ${orderHash}\nRun "iexec orderbook requester ${requester}" to show published requestorders`,
        {
          raw: {
            orderHash,
          },
        },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

finalizeCli(cli);
