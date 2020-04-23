const Debug = require('debug');
const { http } = require('./utils');
const {
  addressSchema,
  chainIdSchema,
  uint256Schema,
  positiveIntSchema,
  positiveStrictIntSchema,
  tagSchema,
  throwIfMissing,
} = require('./validator');

const debug = Debug('iexec:orderbook');

const fetchAppOrderbook = async (
  contracts = throwIfMissing(),
  appAddress = throwIfMissing(),
  {
    minVolume, skip, dataset, workerpool, requester, minTag, maxTag,
  } = {},
) => {
  debug({
    minVolume,
    skip,
    dataset,
    workerpool,
    requester,
    minTag,
    maxTag,
  });
  try {
    const body = Object.assign(
      { chainId: await chainIdSchema().validate(contracts.chainId) },
      {
        app: await addressSchema({
          ethProvider: contracts.jsonRpcProvider,
        }).validate(appAddress),
      },
      dataset && {
        dataset: await addressSchema({
          ethProvider: contracts.jsonRpcProvider,
        }).validate(dataset),
      },
      workerpool && {
        workerpool: await addressSchema({
          ethProvider: contracts.jsonRpcProvider,
        }).validate(workerpool),
      },
      requester && {
        requester: await addressSchema({
          ethProvider: contracts.jsonRpcProvider,
        }).validate(requester),
      },
      minVolume && {
        minVolume: await positiveStrictIntSchema().validate(minVolume),
      },
      minTag && {
        minTag: await tagSchema().validate(minTag),
      },
      maxTag && {
        maxTag: await tagSchema().validate(maxTag),
      },
      skip && {
        skip: await positiveIntSchema().validate(skip),
      },
    );
    const response = await http.get('orderbook/app', body);
    if (response.ok) return { count: response.count, appOrders: response.appOrderbook };
    throw Error('An error occured while getting orderbook');
  } catch (error) {
    debug('fetchAppOrderbook()', error);
    throw error;
  }
};

const fetchDatasetOrderbook = async (
  contracts = throwIfMissing(),
  datasetAddress = throwIfMissing(),
  {
    minVolume, skip, app, workerpool, requester, minTag, maxTag,
  } = {},
) => {
  try {
    const body = Object.assign(
      { chainId: await chainIdSchema().validate(contracts.chainId) },
      {
        dataset: await addressSchema({
          ethProvider: contracts.jsonRpcProvider,
        }).validate(datasetAddress),
      },
      app && {
        app: await addressSchema({
          ethProvider: contracts.jsonRpcProvider,
        }).validate(app),
      },
      workerpool && {
        workerpool: await addressSchema({
          ethProvider: contracts.jsonRpcProvider,
        }).validate(workerpool),
      },
      requester && {
        requester: await addressSchema({
          ethProvider: contracts.jsonRpcProvider,
        }).validate(requester),
      },
      minVolume && {
        minVolume: await positiveStrictIntSchema().validate(minVolume),
      },
      minTag && {
        minTag: await tagSchema().validate(minTag),
      },
      maxTag && {
        maxTag: await tagSchema().validate(maxTag),
      },
      skip && {
        skip: await positiveIntSchema().validate(skip),
      },
    );
    const response = await http.get('orderbook/dataset', body);
    if (response.ok) {
      return {
        count: response.count,
        datasetOrders: response.datasetOrderbook,
      };
    }
    throw Error('An error occured while getting orderbook');
  } catch (error) {
    debug('fetchDatasetOrderbook()', error);
    throw error;
  }
};

const fetchWorkerpoolOrderbook = async (
  contracts = throwIfMissing(),
  category = throwIfMissing(),
  {
    workerpoolAddress, minTag, signerAddress, minTrust, minVolume, skip,
  } = {},
) => {
  try {
    const body = Object.assign(
      {},
      { chainId: await chainIdSchema().validate(contracts.chainId) },
      { category: await uint256Schema().validate(category) },
      workerpoolAddress && {
        workerpool: await addressSchema({
          ethProvider: contracts.jsonRpcProvider,
        }).validate(workerpoolAddress),
      },
      minTag && {
        minTag: await tagSchema().validate(minTag),
      },
      signerAddress && {
        signer: await addressSchema({
          ethProvider: contracts.jsonRpcProvider,
        }).validate(signerAddress),
      },
      minTrust && {
        minTrust: await positiveIntSchema().validate(minTrust),
      },
      minVolume && {
        minVolume: await positiveStrictIntSchema().validate(minVolume),
      },
      skip && {
        skip: await positiveIntSchema().validate(skip),
      },
    );
    const response = await http.get('orderbook/workerpool', body);
    if (response.ok) {
      return {
        count: response.count,
        openVolume: response.openVolume,
        workerpoolOrders: response.workerpoolOrderbook,
      };
    }
    throw Error('An error occured while getting orderbook');
  } catch (error) {
    debug('fetchWorkerpoolOrderbook()', error);
    throw error;
  }
};

const fetchRequestOrderbook = async (
  contracts = throwIfMissing(),
  category = throwIfMissing(),
  {
    requesterAddress,
    beneficiaryAddress,
    maxTag,
    maxTrust,
    minVolume,
    skip,
  } = {},
) => {
  try {
    const body = Object.assign(
      { chainId: await chainIdSchema().validate(contracts.chainId) },
      { category: await uint256Schema().validate(category) },
      requesterAddress && {
        requester: await addressSchema({
          ethProvider: contracts.jsonRpcProvider,
        }).validate(requesterAddress),
      },
      beneficiaryAddress && {
        beneficiary: await addressSchema({
          ethProvider: contracts.jsonRpcProvider,
        }).validate(beneficiaryAddress),
      },
      maxTag && {
        maxTag: await tagSchema().validate(maxTag),
      },
      maxTrust && {
        maxTrust: await positiveIntSchema().validate(maxTrust),
      },
      minVolume && {
        minVolume: await positiveStrictIntSchema().validate(minVolume),
      },
      skip && {
        skip: await positiveIntSchema().validate(skip),
      },
    );
    const response = await http.get('orderbook/request', body);
    if (response.ok) {
      return {
        count: response.count,
        requestOrders: response.requestOrderbook,
      };
    }
    throw Error('An error occured while getting orderbook');
  } catch (error) {
    debug('fetchRequestOrderbook()', error);
    throw error;
  }
};

module.exports = {
  fetchAppOrderbook,
  fetchDatasetOrderbook,
  fetchWorkerpoolOrderbook,
  fetchRequestOrderbook,
};
