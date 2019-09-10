const Debug = require('debug');
const { http } = require('./utils');
const {
  addressSchema,
  chainIdSchema,
  uint256Schema,
  throwIfMissing,
} = require('./validator');

const debug = Debug('iexec:orderbook');

const fetchAppOrderbook = async (
  chainId = throwIfMissing(),
  appAddress = throwIfMissing(),
) => {
  try {
    const body = Object.assign(
      { chainId: await chainIdSchema().validate(chainId) },
      { app: await addressSchema().validate(appAddress) },
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
  chainId = throwIfMissing(),
  datasetAddress = throwIfMissing(),
) => {
  try {
    const body = Object.assign(
      { chainId: await chainIdSchema().validate(chainId) },
      { dataset: await addressSchema().validate(datasetAddress) },
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
  chainId = throwIfMissing(),
  category = throwIfMissing(),
  { workerpoolAddress } = {},
) => {
  try {
    const body = Object.assign(
      { chainId: await chainIdSchema().validate(chainId) },
      { category: await uint256Schema().validate(category) },
      workerpoolAddress && {
        workerpool: await addressSchema().validate(workerpoolAddress),
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
  chainId = throwIfMissing(),
  category = throwIfMissing(),
  { requesterAddress } = {},
) => {
  try {
    const body = Object.assign(
      { chainId: await chainIdSchema().validate(chainId) },
      { category: await uint256Schema().validate(category) },
      requesterAddress && {
        requester: await addressSchema().validate(requesterAddress),
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
