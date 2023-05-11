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
} from '../utils/validator.js';

const debug = Debug('iexec:market:orderbook');

export const fetchAppOrderbook = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  app = throwIfMissing(),
  { dataset, workerpool, requester, minTag, maxTag, minVolume } = {},
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
      ...(workerpool && {
        workerpool: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(workerpool),
      }),
      ...(requester && {
        requester: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(requester),
      }),
      ...(minVolume && {
        minVolume: await positiveStrictIntSchema().validate(minVolume),
      }),
      ...(minTag !== undefined && {
        minTag: await tagSchema().validate(minTag),
      }),
      ...(maxTag !== undefined && {
        maxTag: await tagSchema().validate(maxTag),
      }),
    };
    const { ok, ...response } = await wrapPaginableRequest(jsonApi.get)({
      api: iexecGatewayURL,
      endpoint: '/apporders',
      query,
    });
    if (ok) {
      return response;
    }
    throw Error('An error occured while getting orderbook');
  } catch (error) {
    debug('fetchAppOrderbook()', error);
    throw error;
  }
};

export const fetchDatasetOrderbook = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  dataset = throwIfMissing(),
  { app, workerpool, requester, minTag, maxTag, minVolume } = {},
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
      }),
      ...(workerpool && {
        workerpool: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(workerpool),
      }),
      ...(requester && {
        requester: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(requester),
      }),
      ...(minVolume && {
        minVolume: await positiveStrictIntSchema().validate(minVolume),
      }),
      ...(minTag !== undefined && {
        minTag: await tagSchema().validate(minTag),
      }),
      ...(maxTag !== undefined && {
        maxTag: await tagSchema().validate(maxTag),
      }),
    };
    const { ok, ...response } = await wrapPaginableRequest(jsonApi.get)({
      api: iexecGatewayURL,
      endpoint: '/datasetorders',
      query,
    });
    if (ok) {
      return response;
    }
    throw Error('An error occured while getting orderbook');
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
      ...(dataset && {
        dataset: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(dataset),
      }),
      ...(requester && {
        requester: await addressOrAnySchema({
          ethProvider: contracts.provider,
        }).validate(requester),
      }),
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
    };
    const { ok, ...response } = await wrapPaginableRequest(jsonApi.get)({
      api: iexecGatewayURL,
      endpoint: '/workerpoolorders',
      query,
    });
    if (ok) {
      return response;
    }
    throw Error('An error occured while getting orderbook');
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
    };
    const { ok, ...response } = await wrapPaginableRequest(jsonApi.get)({
      api: iexecGatewayURL,
      endpoint: '/requestorders',
      query,
    });
    if (ok) {
      return response;
    }
    throw Error('An error occured while getting orderbook');
  } catch (error) {
    debug('fetchRequestOrderbook()', error);
    throw error;
  }
};
