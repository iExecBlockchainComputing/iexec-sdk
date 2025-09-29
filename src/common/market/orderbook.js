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
  appOrOptions = throwIfMissing(),
  options,
) => {
  try {
    let app;
    let appOwner;
    let dataset;
    let workerpool;
    let requester;
    let minTag;
    let maxTag;
    let minVolume;
    let page;
    let pageSize;
    let isDatasetStrict;
    let isWorkerpoolStrict;
    let isRequesterStrict;
    if (typeof appOrOptions === 'object' && appOrOptions !== null) {
      ({
        app,
        appOwner,
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
      } = appOrOptions);
    } else {
      // deprecated
      app = appOrOptions;
      ({
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
      } = options || {});
    }
    if (!app && !appOwner) {
      throw Error('app or appOwner is required');
    }

    const query = {
      chainId: await chainIdSchema().validate(contracts.chainId),
      ...(app && {
        app: await addressOrAnySchema({
          ethProvider: contracts.provider,
        })
          .label('app')
          .validate(app),
      }),
      ...(appOwner && {
        appOwner: await addressOrAnySchema({
          ethProvider: contracts.provider,
        })
          .label('appOwner')
          .validate(appOwner),
      }),
      ...(dataset && {
        dataset: await addressOrAnySchema({
          ethProvider: contracts.provider,
        })
          .label('dataset')
          .validate(dataset),
      }),
      isDatasetStrict: await booleanSchema()
        .label('isDatasetStrict')
        .validate(isDatasetStrict),
      ...(workerpool && {
        workerpool: await addressOrAnySchema({
          ethProvider: contracts.provider,
        })
          .label('workerpool')
          .validate(workerpool),
      }),
      isWorkerpoolStrict: await booleanSchema()
        .label('isWorkerpoolStrict')
        .validate(isWorkerpoolStrict),
      ...(requester && {
        requester: await addressOrAnySchema({
          ethProvider: contracts.provider,
        })
          .label('requester')
          .validate(requester),
      }),
      isRequesterStrict: await booleanSchema()
        .label('isRequesterStrict')
        .validate(isRequesterStrict),
      ...(minVolume && {
        minVolume: await positiveStrictIntSchema()
          .label('minVolume')
          .validate(minVolume),
      }),
      ...(minTag !== undefined && {
        minTag: await tagSchema().label('minTag').validate(minTag),
      }),
      ...(maxTag !== undefined && {
        maxTag: await tagSchema().label('maxTag').validate(maxTag),
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
    throw new Error(ERROR_GETTING_ORDERBOOK);
  } catch (error) {
    debug('fetchAppOrderbook()', error);
    throw error;
  }
};

export const fetchDatasetOrderbook = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  datasetOrOptions = throwIfMissing(),
  options,
) => {
  try {
    let dataset;
    let datasetOwner;
    let app;
    let workerpool;
    let requester;
    let minTag;
    let maxTag;
    let minVolume;
    let page;
    let pageSize;
    let isAppStrict;
    let isWorkerpoolStrict;
    let isRequesterStrict;
    if (typeof datasetOrOptions === 'object' && datasetOrOptions !== null) {
      ({
        dataset,
        datasetOwner,
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
      } = datasetOrOptions);
    } else {
      // deprecated
      dataset = datasetOrOptions;
      ({
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
      } = options || {});
    }
    if (!dataset && !datasetOwner) {
      throw Error('dataset or datasetOwner is required');
    }

    const query = {
      chainId: await chainIdSchema().validate(contracts.chainId),
      ...(dataset && {
        dataset: await addressOrAnySchema({
          ethProvider: contracts.provider,
        })
          .label('dataset')
          .validate(dataset),
      }),
      ...(datasetOwner && {
        datasetOwner: await addressOrAnySchema({
          ethProvider: contracts.provider,
        })
          .label('datasetOwner')
          .validate(datasetOwner),
      }),
      ...(app && {
        app: await addressOrAnySchema({
          ethProvider: contracts.provider,
        })
          .label('app')
          .validate(app),
      }),
      isAppStrict: await booleanSchema()
        .label('isAppStrict')
        .validate(isAppStrict),
      ...(workerpool && {
        workerpool: await addressOrAnySchema({
          ethProvider: contracts.provider,
        })
          .label('workerpool')
          .validate(workerpool),
      }),
      isWorkerpoolStrict: await booleanSchema()
        .label('isWorkerpoolStrict')
        .validate(isWorkerpoolStrict),
      ...(requester && {
        requester: await addressOrAnySchema({
          ethProvider: contracts.provider,
        })
          .label('requester')
          .validate(requester),
      }),
      isRequesterStrict: await booleanSchema()
        .label('isRequesterStrict')
        .validate(isRequesterStrict),
      ...(minVolume && {
        minVolume: await positiveStrictIntSchema()
          .label('minVolume')
          .validate(minVolume),
      }),
      ...(minTag !== undefined && {
        minTag: await tagSchema().label('minTag').validate(minTag),
      }),
      ...(maxTag !== undefined && {
        maxTag: await tagSchema().label('maxTag').validate(maxTag),
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
    throw new Error(ERROR_GETTING_ORDERBOOK);
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
      chainId: await chainIdSchema()
        .label('chainId')
        .validate(contracts.chainId),
      category: await uint256Schema().label('category').validate(category),
      ...(workerpool && {
        workerpool: await addressOrAnySchema({
          ethProvider: contracts.provider,
        })
          .label('workerpool')
          .validate(workerpool),
      }),
      ...(app && {
        app: await addressOrAnySchema({
          ethProvider: contracts.provider,
        })
          .label('app')
          .validate(app),
      }),
      isAppStrict: await booleanSchema()
        .label('isAppStrict')
        .validate(isAppStrict),
      ...(dataset && {
        dataset: await addressOrAnySchema({
          ethProvider: contracts.provider,
        })
          .label('dataset')
          .validate(dataset),
      }),
      isDatasetStrict: await booleanSchema()
        .label('isDatasetStrict')
        .validate(isDatasetStrict),
      ...(requester && {
        requester: await addressOrAnySchema({
          ethProvider: contracts.provider,
        })
          .label('requester')
          .validate(requester),
      }),
      isRequesterStrict: await booleanSchema()
        .label('isRequesterStrict')
        .validate(isRequesterStrict),
      ...(minTag && {
        minTag: await tagSchema().label('minTag').validate(minTag),
      }),
      ...(maxTag && {
        maxTag: await tagSchema().validate(maxTag),
      }),
      ...(workerpoolOwner && {
        workerpoolOwner: await addressSchema({
          ethProvider: contracts.provider,
        })
          .label('workerpoolOwner')
          .validate(workerpoolOwner),
      }),
      ...(minTrust && {
        minTrust: await positiveIntSchema()
          .label('minTrust')
          .validate(minTrust),
      }),
      ...(minVolume && {
        minVolume: await positiveStrictIntSchema()
          .label('minVolume')
          .validate(minVolume),
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
    throw new Error(ERROR_GETTING_ORDERBOOK);
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
      chainId: await chainIdSchema()
        .label('chainId')
        .validate(contracts.chainId),
      category: await uint256Schema().label('category').validate(category),
      ...(requester && {
        requester: await addressOrAnySchema({
          ethProvider: contracts.provider,
        })
          .label('requester')
          .validate(requester),
      }),
      ...(beneficiary && {
        beneficiary: await addressOrAnySchema({
          ethProvider: contracts.provider,
        })
          .label('beneficiary')
          .validate(beneficiary),
      }),
      ...(app && {
        app: await addressOrAnySchema({
          ethProvider: contracts.provider,
        })
          .label('app')
          .validate(app),
      }),
      ...(dataset && {
        dataset: await addressOrAnySchema({
          ethProvider: contracts.provider,
        })
          .label('dataset')
          .validate(dataset),
      }),
      ...(workerpool && {
        workerpool: await addressOrAnySchema({
          ethProvider: contracts.provider,
        })
          .label('workerpool')
          .validate(workerpool),
      }),
      isWorkerpoolStrict: await booleanSchema()
        .label('isWorkerpoolStrict')
        .validate(isWorkerpoolStrict),
      ...(minTag !== undefined && {
        minTag: await tagSchema().label('minTag').validate(minTag),
      }),
      ...(maxTag !== undefined && {
        maxTag: await tagSchema().label('maxTag').validate(maxTag),
      }),
      ...(maxTrust !== undefined && {
        maxTrust: await positiveIntSchema()
          .label('maxTrust')
          .validate(maxTrust),
      }),
      ...(minVolume && {
        minVolume: await positiveStrictIntSchema()
          .label('minVolume')
          .validate(minVolume),
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
    throw new Error(ERROR_GETTING_ORDERBOOK);
  } catch (error) {
    debug('fetchRequestOrderbook()', error);
    throw error;
  }
};
