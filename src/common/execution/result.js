import Debug from 'debug';
import { show } from './task.js';
import { downloadZipApi } from '../utils/api-utils.js';
import { bytes32Schema, throwIfMissing } from '../utils/validator.js';
import { IpfsGatewayCallError } from '../utils/errors.js';

const debug = Debug('iexec:execution:result');

const downloadFromIpfs = async (
  ipfsAddress,
  { ipfsGatewayURL = 'https://gateway.ipfs.io' } = {},
) => {
  try {
    return await downloadZipApi.get({
      api: ipfsGatewayURL,
      endpoint: ipfsAddress,
      ApiCallErrorClass: IpfsGatewayCallError,
    });
  } catch (error) {
    if (error instanceof IpfsGatewayCallError) {
      throw error;
    }
    throw new Error(
      `Failed to download from ${ipfsGatewayURL}: ${error.message}`,
    );
  }
};

export const fetchTaskResults = async (
  contracts = throwIfMissing(),
  taskid = throwIfMissing(),
  { ipfsGatewayURL } = {},
) => {
  try {
    const vTaskId = await bytes32Schema().validate(taskid);
    const task = await show(contracts, vTaskId);
    if (task.status !== 3) throw new Error('Task is not completed');
    const { storage, location } = task.results;
    if (storage === 'none') {
      throw new Error('No result uploaded for this task');
    }
    if (storage !== 'ipfs') {
      throw new Error(
        `Task result stored on ${storage}, download not supported`,
      );
    }
    if (!location) {
      throw new Error(
        'Missing location key in task results, download not supported',
      );
    }
    return await downloadFromIpfs(location, { ipfsGatewayURL });
  } catch (error) {
    debug('fetchResults()', error);
    throw error;
  }
};
