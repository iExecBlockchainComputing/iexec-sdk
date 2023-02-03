import Debug from 'debug';
import {
  throwIfMissing,
  addressSchema,
  workerpoolApiUrlSchema,
  bytes32Schema,
} from '../utils/validator';
import { lookupAddress } from '../ens/resolution';
import { readTextRecord } from '../ens/text-record';
import { show as dealShow } from './deal';
import { show as taskShow } from './task';
import { WORKERPOOL_URL_TEXT_RECORD_KEY } from '../utils/constant';
import { jsonApi, getAuthorization } from '../utils/api-utils';
import { checkSigner } from '../utils/utils';
import { getAddress } from '../wallet/address';

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
    const vUrl = await workerpoolApiUrlSchema()
      .required()
      .validate(url)
      .catch(() => {
        /** return undefined */
      });
    return vUrl;
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
    const json = await jsonApi.get({
      api: workerpoolApiUrl,
      endpoint: `/tasks/${vTaskid}`,
    });
    return json;
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
    const authorization = await getAuthorization(
      workerpoolApiUrl,
      '/tasks/logs/challenge',
    )(contracts.chainId, userAddress, contracts.signer);
    const json = await jsonApi.get({
      api: workerpoolApiUrl,
      endpoint: `/tasks/${vTaskid}/logs`,
      headers: { Authorization: authorization },
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
