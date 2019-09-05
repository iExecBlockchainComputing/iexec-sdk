const Debug = require('debug');
const { defaultAbiCoder, keccak256 } = require('ethers').utils;
const {
  isBytes32,
  isEthAddress,
  cleanRPC,
  bnifyNestedEthersBn,
  throwIfMissing,
  http,
  checksummedAddress,
  ensureString,
  NULL_ADDRESS,
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
      chainId: ensureString(chainId),
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

const computeTaskId = (
  dealid = throwIfMissing(),
  taskIdx = throwIfMissing(),
) => {
  try {
    isBytes32(dealid, { strict: true });
    const encodedTypes = ['bytes32', 'uint256'];
    const values = [dealid, taskIdx];
    const encoded = defaultAbiCoder.encode(encodedTypes, values);
    const taskid = keccak256(encoded);
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

const show = async (
  contracts = throwIfMissing(),
  dealid = throwIfMissing(),
) => {
  try {
    isBytes32(dealid, { strict: true });
    const { chainId } = contracts;
    const clerkAddress = await contracts.fetchClerkAddress();
    const clerkContract = contracts.getClerkContract({ at: clerkAddress });
    const deal = bnifyNestedEthersBn(
      cleanRPC(await clerkContract.viewDeal(dealid)),
    );
    const dealExists = deal && deal.app && deal.app.pointer && deal.app.pointer !== NULL_ADDRESS;
    if (!dealExists) throw Error(`No deal found for dealid ${dealid} on chain ${chainId}`);
    const tasks = computeTaskIdsArray(
      dealid,
      deal.botFirst.toString(),
      deal.botSize.toString(),
    );
    const dealWithTasks = { ...deal, tasks };
    return dealWithTasks;
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

module.exports = {
  show,
  // claim,
  computeTaskId,
  // computeTaskIdsArray,
  fetchRequesterDeals,
};
