const Debug = require('debug');
const { jsonApi, wrapPaginableRequest } = require('./api-utils');
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
  iexecGatewayURL = throwIfMissing(),
  appAddress = throwIfMissing(),
  {
    minVolume, dataset, workerpool, requester, minTag, maxTag,
  } = {},
) => {
  try {
    const query = {
      chainId: await chainIdSchema().validate(contracts.chainId),
      app: await addressSchema({
        ethProvider: contracts.provider,
      }).validate(appAddress),
      ...(dataset && {
        dataset: await addressSchema({
          ethProvider: contracts.provider,
        }).validate(dataset),
      }),
      ...(workerpool && {
        workerpool: await addressSchema({
          ethProvider: contracts.provider,
        }).validate(workerpool),
      }),
      ...(requester && {
        requester: await addressSchema({
          ethProvider: contracts.provider,
        }).validate(requester),
      }),
      ...(minVolume && {
        minVolume: await positiveStrictIntSchema().validate(minVolume),
      }),
      ...(minTag && {
        minTag: await tagSchema().validate(minTag),
      }),
      ...(maxTag && {
        maxTag: await tagSchema().validate(maxTag),
      }),
    };
    const response = await wrapPaginableRequest(jsonApi.get)({
      api: iexecGatewayURL,
      endpoint: '/apporders',
      query,
    });
    if (response.ok) return { count: response.count, appOrders: response.orders };
    throw Error('An error occured while getting orderbook');
  } catch (error) {
    debug('fetchAppOrderbook()', error);
    throw error;
  }
};

const fetchDatasetOrderbook = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  datasetAddress = throwIfMissing(),
  {
    minVolume, app, workerpool, requester, minTag, maxTag,
  } = {},
) => {
  try {
    const query = {
      chainId: await chainIdSchema().validate(contracts.chainId),
      dataset: await addressSchema({
        ethProvider: contracts.provider,
      }).validate(datasetAddress),
      ...(app && {
        app: await addressSchema({
          ethProvider: contracts.provider,
        }).validate(app),
      }),
      ...(workerpool && {
        workerpool: await addressSchema({
          ethProvider: contracts.provider,
        }).validate(workerpool),
      }),
      ...(requester && {
        requester: await addressSchema({
          ethProvider: contracts.provider,
        }).validate(requester),
      }),
      ...(minVolume && {
        minVolume: await positiveStrictIntSchema().validate(minVolume),
      }),
      ...(minTag && {
        minTag: await tagSchema().validate(minTag),
      }),
      ...(maxTag && {
        maxTag: await tagSchema().validate(maxTag),
      }),
    };
    const response = await wrapPaginableRequest(jsonApi.get)({
      api: iexecGatewayURL,
      endpoint: '/datasetorders',
      query,
    });
    if (response.ok) {
      return {
        ...response,
        datasetOrders: response.orders,
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
  iexecGatewayURL = throwIfMissing(),
  category = throwIfMissing(),
  {
    workerpoolAddress, minTag, signerAddress, minTrust, minVolume,
  } = {},
) => {
  try {
    const query = {
      chainId: await chainIdSchema().validate(contracts.chainId),
      category: await uint256Schema().validate(category),
      ...(workerpoolAddress && {
        workerpool: await addressSchema({
          ethProvider: contracts.provider,
        }).validate(workerpoolAddress),
      }),
      ...(minTag && {
        minTag: await tagSchema().validate(minTag),
      }),
      ...(signerAddress && {
        workerpoolOwner: await addressSchema({
          ethProvider: contracts.provider,
        }).validate(signerAddress),
      }),
      ...(minTrust && {
        minTrust: await positiveIntSchema().validate(minTrust),
      }),
      ...(minVolume && {
        minVolume: await positiveStrictIntSchema().validate(minVolume),
      }),
    };
    const response = await wrapPaginableRequest(jsonApi.get)({
      api: iexecGatewayURL,
      endpoint: '/workerpoolorders',
      query,
    });
    if (response.ok) {
      return {
        ...response,
        workerpoolOrders: response.orders,
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
  iexecGatewayURL = throwIfMissing(),
  category = throwIfMissing(),
  {
    requesterAddress, beneficiaryAddress, maxTag, maxTrust, minVolume,
  } = {},
) => {
  try {
    const query = {
      chainId: await chainIdSchema().validate(contracts.chainId),
      category: await uint256Schema().validate(category),
      ...(requesterAddress && {
        requester: await addressSchema({
          ethProvider: contracts.provider,
        }).validate(requesterAddress),
      }),
      ...(beneficiaryAddress && {
        beneficiary: await addressSchema({
          ethProvider: contracts.provider,
        }).validate(beneficiaryAddress),
      }),
      ...(maxTag && {
        maxTag: await tagSchema().validate(maxTag),
      }),
      ...(maxTrust && {
        maxTrust: await positiveIntSchema().validate(maxTrust),
      }),
      ...(minVolume && {
        minVolume: await positiveStrictIntSchema().validate(minVolume),
      }),
    };
    const response = await wrapPaginableRequest(jsonApi.get)({
      api: iexecGatewayURL,
      endpoint: '/requestorders',
      query,
    });
    if (response.ok) {
      return {
        ...response,
        requestOrders: response.orders,
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
