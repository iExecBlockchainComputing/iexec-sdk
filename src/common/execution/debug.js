import Debug from 'debug';
import {
  throwIfMissing,
  addressSchema,
  workerpoolApiUrlSchema,
  bytes32Schema,
} from '../utils/validator.js';
import { lookupAddress } from '../ens/resolution.js';
import { readTextRecord } from '../ens/text-record.js';
import { show as dealShow } from './deal.js';
import { show as taskShow } from './task.js';
import { WORKERPOOL_URL_TEXT_RECORD_KEY } from '../utils/constant.js';
import { jsonApi, getAuthorization } from '../utils/api-utils.js';
import { checkSigner } from '../utils/utils.js';
import { getAddress } from '../wallet/address.js';
import { WorkerpoolCallError } from '../utils/errors.js';

const debug = Debug('iexec:execution:debug');

export const getWorkerpoolApiUrl = async (
  contracts = throwIfMissing(),
  workerpoolAddress,
) => {
  try {
    const vAddress = await addressSchema({
      ethProvider: contracts.provider,
    })
      .label('workerpool address')
      .validate(workerpoolAddress);
    const name = await lookupAddress(contracts, vAddress).catch(() => {
      /** return undefined */
    });
    if (!name) {
      return undefined;
    }
    const url = await readTextRecord(
      contracts,
      name,
      WORKERPOOL_URL_TEXT_RECORD_KEY,
    );
    return await workerpoolApiUrlSchema()
      .required()
      .validate(url)
      .catch(() => {
        /** return undefined */
      });
  } catch (e) {
    debug('getWorkerpoolApiUrl()', e);
    throw e;
  }
};

const getTaskOffchainApiUrl = async (
  contracts = throwIfMissing(),
  taskid = throwIfMissing(),
) => {
  try {
    const vTaskid = await bytes32Schema().validate(taskid);
    const { dealid } = await taskShow(contracts, vTaskid);
    const deal = await dealShow(contracts, dealid);
    const workerpool = deal.workerpool && deal.workerpool.pointer;
    if (!workerpool) {
      throw Error(`Cannot find task's workerpool`);
    }
    const workerpoolApiUrl = await getWorkerpoolApiUrl(contracts, workerpool);
    if (!workerpoolApiUrl) {
      throw Error(`Impossible to resolve API url for workerpool ${workerpool}`);
    }
    return workerpoolApiUrl;
  } catch (error) {
    debug('getTaskOffchainApiUrl()', error);
    throw error;
  }
};

export const fetchTaskOffchainInfo = async (
  contracts = throwIfMissing(),
  taskid = throwIfMissing(),
) => {
  try {
    const vTaskid = await bytes32Schema().validate(taskid);
    const workerpoolApiUrl = await getTaskOffchainApiUrl(contracts, vTaskid);
    return await jsonApi.get({
      api: workerpoolApiUrl,
      endpoint: `/tasks/${vTaskid}`,
      ApiCallErrorClass: WorkerpoolCallError,
    });
  } catch (error) {
    debug('fetchTaskOffchainInfo()', error);
    throw error;
  }
};

export const fetchAllReplicatesLogs = async (
  contracts = throwIfMissing(),
  taskid = throwIfMissing(),
) => {
  try {
    checkSigner(contracts);
    const vTaskid = await bytes32Schema().validate(taskid);
    const workerpoolApiUrl = await getTaskOffchainApiUrl(contracts, vTaskid);
    const { dealid } = await taskShow(contracts, vTaskid);
    const { requester } = await dealShow(contracts, dealid);
    const userAddress = await getAddress(contracts);
    if (requester !== userAddress) {
      throw Error(
        `Only task requester ${requester} can access replicates logs`,
      );
    }
    const authorization = await getAuthorization({
      api: workerpoolApiUrl,
      endpoint: '/tasks/logs/challenge',
      chainId: contracts.chainId,
      address: userAddress,
      signer: contracts.signer,
      ApiCallErrorClass: WorkerpoolCallError,
    });
    const json = await jsonApi.get({
      api: workerpoolApiUrl,
      endpoint: `/tasks/${vTaskid}/logs`,
      headers: { Authorization: authorization },
      ApiCallErrorClass: WorkerpoolCallError,
    });
    const { computeLogsList = [] } = json;
    return computeLogsList.map(({ walletAddress, stdout, stderr }) => ({
      worker: walletAddress,
      stdout,
      stderr,
    }));
  } catch (error) {
    debug('fetchAllReplicatesLogs()', error);
    throw error;
  }
};
