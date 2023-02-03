import Debug from 'debug';
import { getAddress } from '../wallet/address';
import { checkSigner } from '../utils/utils';
import {
  APP_ORDER,
  DATASET_ORDER,
  WORKERPOOL_ORDER,
  REQUEST_ORDER,
} from '../utils/constant';
import { jsonApi, getAuthorization } from '../utils/api-utils';
import {
  addressSchema,
  signedApporderSchema,
  signedDatasetorderSchema,
  signedWorkerpoolorderSchema,
  signedRequestorderSchema,
  chainIdSchema,
  bytes32Schema,
  throwIfMissing,
} from '../utils/validator';

const debug = Debug('iexec:market:marketplace');

const apiEndpoints = {
  [APP_ORDER]: '/apporders',
  [DATASET_ORDER]: '/datasetorders',
  [WORKERPOOL_ORDER]: '/workerpoolorders',
  [REQUEST_ORDER]: '/requestorders',
};

const addressFieldNames = {
  [APP_ORDER]: 'app',
  [DATASET_ORDER]: 'dataset',
  [WORKERPOOL_ORDER]: 'workerpool',
  [REQUEST_ORDER]: 'requester',
};

const publishOrder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  orderName = throwIfMissing(),
  chainId = throwIfMissing(),
  signedOrder = throwIfMissing(),
) => {
  try {
    checkSigner(contracts);
    const address = await getAddress(contracts);
    const body = { order: signedOrder };
    const authorization = await getAuthorization(iexecGatewayURL, '/challenge')(
      chainId,
      address,
      contracts.signer,
    );
    const response = await jsonApi.post({
      api: iexecGatewayURL,
      endpoint: apiEndpoints[orderName],
      query: {
        chainId,
      },
      body,
      headers: { authorization },
    });
    if (response.ok && response.published && response.published.orderHash) {
      return response.published.orderHash;
    }
    throw Error('An error occured while publishing order');
  } catch (error) {
    debug('publishOrder()', error);
    throw error;
  }
};

export const publishApporder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  signedApporder = throwIfMissing(),
) =>
  publishOrder(
    contracts,
    iexecGatewayURL,
    APP_ORDER,
    await chainIdSchema().validate(contracts.chainId),
    await signedApporderSchema().validate(signedApporder),
  );

export const publishDatasetorder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  signedDatasetorder = throwIfMissing(),
) =>
  publishOrder(
    contracts,
    iexecGatewayURL,
    DATASET_ORDER,
    await chainIdSchema().validate(contracts.chainId),
    await signedDatasetorderSchema().validate(signedDatasetorder),
  );

export const publishWorkerpoolorder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  signedWorkerpoolorder = throwIfMissing(),
) =>
  publishOrder(
    contracts,
    iexecGatewayURL,
    WORKERPOOL_ORDER,
    await chainIdSchema().validate(contracts.chainId),
    await signedWorkerpoolorderSchema().validate(signedWorkerpoolorder),
  );

export const publishRequestorder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  signedRequestorder = throwIfMissing(),
) =>
  publishOrder(
    contracts,
    iexecGatewayURL,
    REQUEST_ORDER,
    await chainIdSchema().validate(contracts.chainId),
    await signedRequestorderSchema().validate(signedRequestorder),
  );

const UNPUBLISH_TARGET_ORDERHASH = 'unpublish_orderHash';
const UNPUBLISH_TARGET_ALL_ORDERS = 'unpublish_all';
const UNPUBLISH_TARGET_LAST_ORDER = 'unpublish_last';

const unpublishOrder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  orderName = throwIfMissing(),
  chainId = throwIfMissing(),
  { target = UNPUBLISH_TARGET_ORDERHASH, orderHash, address } = {},
) => {
  try {
    checkSigner(contracts);
    const body = { target };
    if (target === UNPUBLISH_TARGET_ORDERHASH) {
      if (!orderHash) throwIfMissing();
      body.orderHash = orderHash;
    } else if (
      target === UNPUBLISH_TARGET_LAST_ORDER ||
      target === UNPUBLISH_TARGET_ALL_ORDERS
    ) {
      if (!address) throwIfMissing();
      body[addressFieldNames[orderName]] = address;
    }
    const userAddress = await getAddress(contracts);
    const authorization = await getAuthorization(iexecGatewayURL, '/challenge')(
      contracts.chainId,
      userAddress,
      contracts.signer,
    );
    const response = await jsonApi.put({
      api: iexecGatewayURL,
      endpoint: apiEndpoints[orderName],
      query: {
        chainId,
      },
      body,
      headers: { authorization },
    });
    if (response.ok && response.unpublished) {
      return response.unpublished;
    }
    throw new Error('An error occured while unpublishing order');
  } catch (error) {
    debug('unpublishOrder()', error);
    throw error;
  }
};

export const unpublishApporder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  apporderHash = throwIfMissing(),
) => {
  const unpublished = await unpublishOrder(
    contracts,
    iexecGatewayURL,
    APP_ORDER,
    await chainIdSchema().validate(contracts.chainId),
    { orderHash: await bytes32Schema().validate(apporderHash) },
  );
  return unpublished[0];
};

export const unpublishDatasetorder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  datasetorderHash = throwIfMissing(),
) => {
  const unpublished = await unpublishOrder(
    contracts,
    iexecGatewayURL,
    DATASET_ORDER,
    await chainIdSchema().validate(contracts.chainId),
    { orderHash: await bytes32Schema().validate(datasetorderHash) },
  );
  return unpublished[0];
};

export const unpublishWorkerpoolorder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  workerpoolorderHash = throwIfMissing(),
) => {
  const unpublished = await unpublishOrder(
    contracts,
    iexecGatewayURL,
    WORKERPOOL_ORDER,
    await chainIdSchema().validate(contracts.chainId),
    { orderHash: await bytes32Schema().validate(workerpoolorderHash) },
  );
  return unpublished[0];
};

export const unpublishRequestorder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  requestorderHash = throwIfMissing(),
) => {
  const unpublished = await unpublishOrder(
    contracts,
    iexecGatewayURL,
    REQUEST_ORDER,
    await chainIdSchema().validate(contracts.chainId),
    { orderHash: await bytes32Schema().validate(requestorderHash) },
  );
  return unpublished[0];
};

export const unpublishAllApporders = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  appAddress = throwIfMissing(),
) =>
  unpublishOrder(
    contracts,
    iexecGatewayURL,
    APP_ORDER,
    await chainIdSchema().validate(contracts.chainId),
    {
      target: UNPUBLISH_TARGET_ALL_ORDERS,
      address: await addressSchema({
        ethProvider: contracts.provider,
      }).validate(appAddress),
    },
  );

export const unpublishAllDatasetorders = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  datasetAddress = throwIfMissing(),
) =>
  unpublishOrder(
    contracts,
    iexecGatewayURL,
    DATASET_ORDER,
    await chainIdSchema().validate(contracts.chainId),
    {
      target: UNPUBLISH_TARGET_ALL_ORDERS,
      address: await addressSchema({
        ethProvider: contracts.provider,
      }).validate(datasetAddress),
    },
  );

export const unpublishAllWorkerpoolorders = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  workerpoolAddress = throwIfMissing(),
) =>
  unpublishOrder(
    contracts,
    iexecGatewayURL,
    WORKERPOOL_ORDER,
    await chainIdSchema().validate(contracts.chainId),
    {
      target: UNPUBLISH_TARGET_ALL_ORDERS,
      address: await addressSchema({
        ethProvider: contracts.provider,
      }).validate(workerpoolAddress),
    },
  );

export const unpublishAllRequestorders = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
) =>
  unpublishOrder(
    contracts,
    iexecGatewayURL,
    REQUEST_ORDER,
    await chainIdSchema().validate(contracts.chainId),
    {
      target: UNPUBLISH_TARGET_ALL_ORDERS,
      address: await getAddress(contracts),
    },
  );

export const unpublishLastApporder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  appAddress = throwIfMissing(),
) => {
  const unpublished = await unpublishOrder(
    contracts,
    iexecGatewayURL,
    APP_ORDER,
    await chainIdSchema().validate(contracts.chainId),
    {
      target: UNPUBLISH_TARGET_LAST_ORDER,
      address: await addressSchema({
        ethProvider: contracts.provider,
      }).validate(appAddress),
    },
  );
  return unpublished[0];
};

export const unpublishLastDatasetorder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  datasetAddress = throwIfMissing(),
) => {
  const unpublished = await unpublishOrder(
    contracts,
    iexecGatewayURL,
    DATASET_ORDER,
    await chainIdSchema().validate(contracts.chainId),
    {
      target: UNPUBLISH_TARGET_LAST_ORDER,
      address: await addressSchema({
        ethProvider: contracts.provider,
      }).validate(datasetAddress),
    },
  );
  return unpublished[0];
};

export const unpublishLastWorkerpoolorder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  workerpoolAddress = throwIfMissing(),
) => {
  const unpublished = await unpublishOrder(
    contracts,
    iexecGatewayURL,
    WORKERPOOL_ORDER,
    await chainIdSchema().validate(contracts.chainId),
    {
      target: UNPUBLISH_TARGET_LAST_ORDER,
      address: await addressSchema({
        ethProvider: contracts.provider,
      }).validate(workerpoolAddress),
    },
  );
  return unpublished[0];
};

export const unpublishLastRequestorder = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
) => {
  const unpublished = await unpublishOrder(
    contracts,
    iexecGatewayURL,
    REQUEST_ORDER,
    await chainIdSchema().validate(contracts.chainId),
    {
      target: UNPUBLISH_TARGET_LAST_ORDER,
      address: await getAddress(contracts),
    },
  );
  return unpublished[0];
};

export const fetchPublishedOrderByHash = async (
  iexecGatewayURL = throwIfMissing(),
  orderName = throwIfMissing(),
  chainId = throwIfMissing(),
  orderHash = throwIfMissing(),
) => {
  try {
    const vChainId = await chainIdSchema().validate(chainId);
    const vOrderHash = await bytes32Schema().validate(orderHash);
    const endpoint = apiEndpoints[orderName];
    if (!endpoint) throw Error(`Unsupported orderName ${orderName}`);
    const query = {
      chainId: vChainId,
    };
    const { ok, ...res } = await jsonApi.get({
      api: iexecGatewayURL,
      endpoint: `${apiEndpoints[orderName]}/${vOrderHash}`,
      query,
    });
    return res;
  } catch (error) {
    debug('fetchPublishedOrderByHash()', error);
    throw error;
  }
};
