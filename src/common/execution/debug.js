const Debug = require('debug');
const {
  throwIfMissing,
  addressSchema,
  workerpoolApiUrlSchema,
  bytes32Schema,
} = require('../utils/validator');
const { lookupAddress } = require('../ens/resolution');
const { readTextRecord } = require('../ens/text-record');
const { show: dealShow } = require('./deal');
const { show: taskShow } = require('./task');
const { WORKERPOOL_URL_TEXT_RECORD_KEY } = require('../utils/constant');
const { jsonApi, getAuthorization } = require('../utils/api-utils');
const { checkSigner } = require('../utils/utils');
const { getAddress } = require('../wallet/address');

const debug = Debug('iexec:execution:debug');

const getWorkerpoolApiUrl = async (
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
    const { dealid } = await taskShow(contracts, taskid);
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

const fetchTaskOffchainInfo = async (
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

const fetchReplicateLogs = async (
  contracts = throwIfMissing(),
  taskid = throwIfMissing(),
  workerAddress = throwIfMissing(),
) => {
  try {
    checkSigner(contracts);
    const vTaskid = await bytes32Schema().validate(taskid);
    const vWorkerAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(workerAddress);
    const workerpoolApiUrl = await getTaskOffchainApiUrl(contracts, vTaskid);
    const userAddress = await getAddress(contracts);
    const authorization = await getAuthorization(
      workerpoolApiUrl,
      '/tasks/logs/challenge',
    )(contracts.chainId, userAddress, contracts.signer);
    const json = await jsonApi.get({
      api: workerpoolApiUrl,
      endpoint: `/tasks/${vTaskid}/replicates/${vWorkerAddress.toLowerCase()}/logs`,
      headers: { Authorization: authorization },
    });
    return json;
  } catch (error) {
    debug('fetchReplicateLogs()', error);
    throw error;
  }
};

module.exports = {
  getWorkerpoolApiUrl,
  fetchTaskOffchainInfo,
  fetchReplicateLogs,
};
