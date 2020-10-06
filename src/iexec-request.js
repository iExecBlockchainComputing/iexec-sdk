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
  orderOption,
  prompt,
  Spinner,
  pretty,
  getPropertyFormChain,
} = require('./cli-helper');
const {
  checkDeployedApp,
  checkDeployedDataset,
  checkDeployedWorkerpool,
} = require('./hub');
const { checkRequestRequirements } = require('./request-helper');
const {
  createRequestorder,
  signRequestorder,
  publishRequestorder,
} = require('./order');
const { checkBalance } = require('./account');
const { Keystore } = require('./keystore');
const { loadChain, connectKeystore } = require('./chains');
const {
  NULL_ADDRESS, NULL_BYTES32, BN, formatRLC,
} = require('./utils');
const { paramsKeyName } = require('./params-utils');
const {
  tagSchema,
  catidSchema,
  addressSchema,
  paramsSchema,
  positiveIntSchema,
  positiveStrictIntSchema,
  nRlcAmountSchema,
  paramsArgsSchema,
  paramsInputFilesArraySchema,
  paramsStorageProviderSchema,
  paramsEncryptResultSchema,
} = require('./validator');

const debug = Debug('iexec-request');

const requestRun = cli.command('run <appAddress>');
addGlobalOptions(requestRun);
addWalletLoadOptions(requestRun);
requestRun
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.force())
  .option(...orderOption.dataset({ allowDeployed: false }))
  .option(...orderOption.workerpool({ allowDeployed: false }))
  .option(...orderOption.appprice())
  .option(...orderOption.datasetprice())
  .option(...orderOption.workerpoolprice())
  .option(...orderOption.requestArgs())
  .option(...orderOption.requestInputFiles())
  .option(...orderOption.category())
  .option(...orderOption.tag())
  .option(...orderOption.volume())
  .option(...orderOption.requestStorageProvider())
  .option(...orderOption.callback())
  .option(...orderOption.requestEncryptResult())
  .option(...orderOption.trust())
  .option(...orderOption.beneficiary())
  .option(...orderOption.params())
  .option(...option.skipRequestCheck())
  .description(desc.requestRun())
  .action(async (appAddress, cmd) => {
    const opts = cmd.opts();
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    const walletOptions = await computeWalletLoadOptions(opts);
    const txOptions = await computeTxOptions(opts);
    const keystore = Keystore(walletOptions);
    try {
      const chain = await loadChain(opts.chain, { spinner });
      const app = appAddress;
      debug('app', app);
      if (!(await checkDeployedApp(chain.contracts, app))) {
        throw Error(`No app deployed at address ${app}`);
      }
      const dataset = opts.dataset || NULL_ADDRESS;
      debug('dataset', dataset);
      if (
        dataset !== NULL_ADDRESS
        && !(await checkDeployedDataset(chain.contracts, dataset))
      ) {
        throw Error(`No dataset deployed at address ${dataset}`);
      }
      const workerpool = opts.workerpool || NULL_ADDRESS;
      debug('workerpool', workerpool);
      if (
        workerpool !== NULL_ADDRESS
        && !(await checkDeployedWorkerpool(chain.contracts, workerpool))
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
      const inputParamsInputFiles = await paramsInputFilesArraySchema().validate(
        opts.inputFiles,
      );
      const inputParamsStorageProvider = await paramsStorageProviderSchema().validate(
        opts.storageProvider,
      );
      const inputParamsResultEncrytion = await paramsEncryptResultSchema().validate(
        opts.encryptResult,
      );

      const params = {
        ...(inputParams !== undefined && JSON.parse(inputParams)),
        ...(inputParamsArgs !== undefined && {
          [paramsKeyName.IEXEC_ARGS]: inputParamsArgs,
        }),
        ...(inputParamsInputFiles !== undefined && {
          [paramsKeyName.IEXEC_INPUT_FILES]: inputParamsInputFiles,
        }),
        ...(inputParamsStorageProvider !== undefined && {
          [paramsKeyName.IEXEC_RESULT_STORAGE_PROVIDER]: inputParamsStorageProvider,
        }),
        ...(inputParamsResultEncrytion !== undefined && {
          [paramsKeyName.IEXEC_RESULT_ENCRYPTION]: inputParamsResultEncrytion,
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
      const beneficiary = opts.beneficiary === undefined
        ? undefined
        : await addressSchema({
          ethProvider: chain.contracts.provider,
        }).validate(opts.beneficiary);
      debug('beneficiary', beneficiary);

      spinner.info('Creating requestorder');
      await connectKeystore(chain, keystore, { txOptions });
      const requestorderToSign = await createRequestorder(
        { contracts: chain.contracts, resultProxyURL: chain.resultProxy },
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
      if (!opts.skipRequestCheck) {
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
              (requestorder.params && JSON.parse(requestorder.params))
              || undefined,
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

help(cli);
