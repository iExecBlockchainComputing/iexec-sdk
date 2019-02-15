const Debug = require('debug');
const ethers = require('ethers');
const {
  isBytes32,
  isEthAddress,
  cleanRPC,
  bnifyNestedEthersBn,
  throwIfMissing,
  http,
  checksummedAddress,
} = require('./utils');

const debug = Debug('iexec:deal');

const fetchRequesterDeals = async (
  chainId = throwIfMissing(),
  requesterAddress = throwIfMissing(),
  {
    appAddress, datasetAddress, workerpoolAddress, beforeTimestamp,
  } = {},
) => {
  try {
    isEthAddress(requesterAddress, { strict: true });
    if (appAddress) isEthAddress(appAddress, { strict: true });
    if (datasetAddress) isEthAddress(datasetAddress, { strict: true });
    if (workerpoolAddress) isEthAddress(workerpoolAddress, { strict: true });
    const find = Object.assign(
      { requester: checksummedAddress(requesterAddress) },
      appAddress && { 'app.pointer': checksummedAddress(appAddress) },
      datasetAddress && {
        'dataset.pointer': checksummedAddress(datasetAddress),
      },
      workerpoolAddress && {
        'workerpool.pointer': checksummedAddress(workerpoolAddress),
      },
      beforeTimestamp && { blockTimestamp: { $lt: beforeTimestamp } },
    );
    const body = {
      chainId,
      sort: {
        blockTimestamp: -1,
      },
      find,
    };
    const response = await http.post('deals', body);
    if (response.ok && response.deals) {
      return {
        count: response.count,
        deals: response.deals,
      };
    }
    throw Error('An error occured while getting deals');
  } catch (error) {
    debug('fetchRequesterDeals()', error);
    throw error;
  }
};

const show = async (
  contracts = throwIfMissing(),
  dealid = throwIfMissing(),
) => {
  try {
    isBytes32(dealid, { strict: true });
    const clerkAddress = await contracts.fetchClerkAddress();
    const clerkContract = contracts.getClerkContract({ at: clerkAddress });
    const deal = bnifyNestedEthersBn(
      cleanRPC(await clerkContract.viewDeal(dealid)),
    );
    return deal;
  } catch (error) {
    debug('show()', error);
    throw error;
  }
};

// const claim = async (
//   contracts = throwIfMissing(),
//   dealid = throwIfMissing(),
//   userAddress = throwIfMissing(),
// ) => {
//   try {
//     throw new Error('Not implemented');
//   } catch (error) {
//     debug('claim()', error);
//     throw error;
//   }
// };

const computeTaskId = (
  dealid = throwIfMissing(),
  taskIdx = throwIfMissing(),
) => {
  try {
    isBytes32(dealid, { strict: true });
    const encodedTypes = ['bytes32', 'uint256'];
    const values = [dealid, taskIdx];
    const encoded = ethers.utils.defaultAbiCoder.encode(encodedTypes, values);
    const taskid = ethers.utils.keccak256(encoded);
    return taskid;
  } catch (error) {
    debug('computeTaskId()', error);
    throw error;
  }
};

const computeTaskIdsArray = (
  dealid = throwIfMissing(),
  firstTaskIdx = throwIfMissing(),
  botSize = throwIfMissing(),
) => {
  const tasksIdx = [...Array(botSize).keys()].map(n => n + firstTaskIdx);
  const taskids = tasksIdx.map(idx => computeTaskId(dealid, idx));
  return taskids;
};

module.exports = {
  show,
  // claim,
  computeTaskId,
  computeTaskIdsArray,
  fetchRequesterDeals,
};
