const Debug = require('debug');
const {
  http,
  isString,
  isEthAddress,
  throwIfMissing,
  ensureString,
} = require('./utils');

const debug = Debug('iexec:orderbook');

const fetchAppOrderbook = async (
  chainId = throwIfMissing(),
  appAddress = throwIfMissing(),
) => {
  try {
    isEthAddress(appAddress, { strict: true });
    const body = Object.assign(
      { chainId: ensureString(chainId) },
      { app: appAddress },
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
    isEthAddress(datasetAddress, { strict: true });
    const body = Object.assign(
      { chainId: ensureString(chainId) },
      { dataset: datasetAddress },
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
    isString(category, { strict: true });
    if (workerpoolAddress) isEthAddress(workerpoolAddress, { strict: true });
    const body = Object.assign(
      { chainId: ensureString(chainId) },
      { category },
      workerpoolAddress && { workerpool: workerpoolAddress },
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
    isString(category, { strict: true });
    if (requesterAddress) isEthAddress(requesterAddress, { strict: true });
    const body = Object.assign(
      { chainId: ensureString(chainId) },
      { category },
      requesterAddress && { requester: requesterAddress },
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
