import Debug from 'debug';
import { jsonApi, wrapPaginableRequest } from '../utils/api-utils.js';
import {
  addressSchema,
  addressOrAnySchema,
  chainIdSchema,
  uint256Schema,
  positiveIntSchema,
  positiveStrictIntSchema,
  tagSchema,
  throwIfMissing,
  booleanSchema,
} from '../utils/validator.js';
import { MarketCallError } from '../utils/errors.js';

const debug = Debug('iexec:market:orderbook');

const ERROR_GETTING_ORDERBOOK = 'An error occurred while getting orderbook';

export const fetchAppOrderbook = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  app = throwIfMissing(),
  {
    dataset,
    workerpool,
    requester,
    minTag,
    maxTag,
    minVolume,
    page = 0,
    pageSize = 20,
    isDatasetStrict = false,
    isWorkerpoolStrict = false,
    isRequesterStrict = false,
  } = {},
) => {
  try {
    const query = {
      chainId: await chainIdSchema().validate(contracts.chainId),
      app: await addressOrAnySchema({
        ethProvider: contracts.provider,
      }).validate(app),
      ...(dataset && {
        dataset: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(dataset),
      }),
      isDatasetStrict: await booleanSchema().validate(isDatasetStrict),
      ...(workerpool && {
        workerpool: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(workerpool),
      }),
      isWorkerpoolStrict: await booleanSchema().validate(isWorkerpoolStrict),
      ...(requester && {
        requester: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(requester),
      }),
      isRequesterStrict: await booleanSchema().validate(isRequesterStrict),
      ...(minVolume && {
        minVolume: await positiveStrictIntSchema().validate(minVolume),
      }),
      ...(minTag !== undefined && {
        minTag: await tagSchema().validate(minTag),
      }),
      ...(maxTag !== undefined && {
        maxTag: await tagSchema().validate(maxTag),
      }),
      ...(page !== undefined && {
        pageIndex: await positiveIntSchema().label('page').validate(page),
      }),
      ...(pageSize !== undefined && {
        pageSize: await positiveStrictIntSchema()
          .min(10)
          .label('pageSize')
          .validate(pageSize),
      }),
    };
    const { ok, ...response } = await wrapPaginableRequest(jsonApi.get)({
      api: iexecGatewayURL,
      endpoint: '/apporders',
      query,
      ApiCallErrorClass: MarketCallError,
    });
    if (ok) {
      return response;
    }
    throw Error(ERROR_GETTING_ORDERBOOK);
  } catch (error) {
    debug('fetchAppOrderbook()', error);
    throw error;
  }
};

export const fetchDatasetOrderbook = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  dataset = throwIfMissing(),
  {
    app,
    workerpool,
    requester,
    minTag,
    maxTag,
    minVolume,
    page = 0,
    pageSize = 20,
    isAppStrict = false,
    isWorkerpoolStrict = false,
    isRequesterStrict = false,
  } = {},
) => {
  try {
    const query = {
      chainId: await chainIdSchema().validate(contracts.chainId),
      dataset: await addressOrAnySchema({
        ethProvider: contracts.provider,
      }).validate(dataset),
      ...(app && {
        app: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(app),
        isAppStrict: await booleanSchema().validate(isAppStrict),
      }),
      ...(workerpool && {
        workerpool: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(workerpool),
      }),
      isWorkerpoolStrict: await booleanSchema().validate(isWorkerpoolStrict),
      ...(requester && {
        requester: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(requester),
      }),
      isRequesterStrict: await booleanSchema().validate(isRequesterStrict),
      ...(minVolume && {
        minVolume: await positiveStrictIntSchema().validate(minVolume),
      }),
      ...(minTag !== undefined && {
        minTag: await tagSchema().validate(minTag),
      }),
      ...(maxTag !== undefined && {
        maxTag: await tagSchema().validate(maxTag),
      }),
      ...(page !== undefined && {
        pageIndex: await positiveIntSchema().label('page').validate(page),
      }),
      ...(pageSize !== undefined && {
        pageSize: await positiveStrictIntSchema()
          .min(10)
          .label('pageSize')
          .validate(pageSize),
      }),
    };
    const { ok, ...response } = await wrapPaginableRequest(jsonApi.get)({
      api: iexecGatewayURL,
      endpoint: '/datasetorders',
      query,
      ApiCallErrorClass: MarketCallError,
    });
    if (ok) {
      return response;
    }
    throw Error(ERROR_GETTING_ORDERBOOK);
  } catch (error) {
    debug('fetchDatasetOrderbook()', error);
    throw error;
  }
};

export const fetchWorkerpoolOrderbook = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  {
    category,
    workerpool,
    minTag,
    maxTag,
    workerpoolOwner,
    minTrust,
    minVolume,
    app,
    dataset,
    requester,
    page = 0,
    pageSize = 20,
    isAppStrict = false,
    isDatasetStrict = false,
    isRequesterStrict = false,
  } = {},
) => {
  try {
    const query = {
      chainId: await chainIdSchema().validate(contracts.chainId),
      category: await uint256Schema().validate(category),
      ...(workerpool && {
        workerpool: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(workerpool),
      }),
      ...(app && {
        app: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(app),
      }),
      isAppStrict: await booleanSchema().validate(isAppStrict),
      ...(dataset && {
        dataset: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(dataset),
      }),
      isDatasetStrict: await booleanSchema().validate(isDatasetStrict),
      ...(requester && {
        requester: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(requester),
      }),
      isRequesterStrict: await booleanSchema().validate(isRequesterStrict),
      ...(minTag && {
        minTag: await tagSchema().validate(minTag),
      }),
      ...(maxTag && {
        maxTag: await tagSchema().validate(maxTag),
      }),
      ...(workerpoolOwner && {
        workerpoolOwner: await addressSchema({
          ethProvider: contracts.provider,
        }).validate(workerpoolOwner),
      }),
      ...(minTrust && {
        minTrust: await positiveIntSchema().validate(minTrust),
      }),
      ...(minVolume && {
        minVolume: await positiveStrictIntSchema().validate(minVolume),
      }),
      ...(page !== undefined && {
        pageIndex: await positiveIntSchema().label('page').validate(page),
      }),
      ...(pageSize !== undefined && {
        pageSize: await positiveStrictIntSchema()
          .min(10)
          .label('pageSize')
          .validate(pageSize),
      }),
    };
    const { ok, ...response } = await wrapPaginableRequest(jsonApi.get)({
      api: iexecGatewayURL,
      endpoint: '/workerpoolorders',
      query,
      ApiCallErrorClass: MarketCallError,
    });
    if (ok) {
      return response;
    }
    throw Error(ERROR_GETTING_ORDERBOOK);
  } catch (error) {
    debug('fetchWorkerpoolOrderbook()', error);
    throw error;
  }
};

export const fetchRequestOrderbook = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  {
    category,
    requester,
    beneficiary,
    app,
    dataset,
    workerpool,
    minTag,
    maxTag,
    maxTrust,
    minVolume,
    page = 0,
    pageSize = 20,
    isWorkerpoolStrict = false,
  } = {},
) => {
  try {
    const query = {
      chainId: await chainIdSchema().validate(contracts.chainId),
      category: await uint256Schema().validate(category),
      ...(requester && {
        requester: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(requester),
      }),
      ...(beneficiary && {
        beneficiary: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(beneficiary),
      }),
      ...(app && {
        app: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(app),
      }),
      ...(dataset && {
        dataset: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(dataset),
      }),
      ...(workerpool && {
        workerpool: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(workerpool),
      }),
      isWorkerpoolStrict: await booleanSchema().validate(isWorkerpoolStrict),
      ...(minTag !== undefined && {
        minTag: await tagSchema().validate(minTag),
      }),
      ...(maxTag !== undefined && {
        maxTag: await tagSchema().validate(maxTag),
      }),
      ...(maxTrust !== undefined && {
        maxTrust: await positiveIntSchema().validate(maxTrust),
      }),
      ...(minVolume && {
        minVolume: await positiveStrictIntSchema().validate(minVolume),
      }),
      ...(page !== undefined && {
        pageIndex: await positiveIntSchema().label('page').validate(page),
      }),
      ...(pageSize !== undefined && {
        pageSize: await positiveStrictIntSchema()
          .min(10)
          .label('pageSize')
          .validate(pageSize),
      }),
    };
    const { ok, ...response } = await wrapPaginableRequest(jsonApi.get)({
      api: iexecGatewayURL,
      endpoint: '/requestorders',
      query,
      ApiCallErrorClass: MarketCallError,
    });
    if (ok) {
      return response;
    }
    throw Error(ERROR_GETTING_ORDERBOOK);
  } catch (error) {
    debug('fetchRequestOrderbook()', error);
    throw error;
  }
};
