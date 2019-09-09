const Debug = require('debug');
const { defaultAbiCoder, keccak256 } = require('ethers').utils;
const {
  cleanRPC,
  bnifyNestedEthersBn,
  throwIfMissing,
  http,
  NULL_ADDRESS,
} = require('./utils');
const {
  chainIdSchema,
  addressSchema,
  bytes32Schema,
  uint256Schema,
  positiveIntSchema,
  positiveStrictIntSchema,
} = require('./validator');

const debug = Debug('iexec:deal');

const fetchRequesterDeals = async (
  chainId = throwIfMissing(),
  requesterAddress = throwIfMissing(),
  {
    appAddress, datasetAddress, workerpoolAddress, beforeTimestamp,
  } = {},
) => {
  try {
    const vRequesterAddress = await addressSchema().validate(requesterAddress);
    const vChainId = await chainIdSchema().validate(chainId);
    let vAppAddress;
    let vDatasetAddress;
    let vWorkerpoolAddress;
    if (appAddress) vAppAddress = await addressSchema().validate(appAddress);
    if (datasetAddress) vDatasetAddress = await addressSchema().validate(datasetAddress);
    if (workerpoolAddress) vWorkerpoolAddress = await addressSchema().validate(workerpoolAddress);
    const find = Object.assign(
      { requester: vRequesterAddress },
      appAddress && { 'app.pointer': vAppAddress },
      datasetAddress && {
        'dataset.pointer': vDatasetAddress,
      },
      workerpoolAddress && {
        'workerpool.pointer': vWorkerpoolAddress,
      },
      beforeTimestamp && { blockTimestamp: { $lt: beforeTimestamp } },
    );
    const body = {
      chainId: vChainId,
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

const computeTaskId = async (
  dealid = throwIfMissing(),
  taskIdx = throwIfMissing(),
) => {
  try {
    const encodedTypes = ['bytes32', 'uint256'];
    const values = [
      await bytes32Schema().validate(dealid),
      await uint256Schema().validate(taskIdx),
    ];
    const encoded = defaultAbiCoder.encode(encodedTypes, values);
    const taskid = keccak256(encoded);
    return taskid;
  } catch (error) {
    debug('computeTaskId()', error);
    throw error;
  }
};

const computeTaskIdsArray = async (
  dealid = throwIfMissing(),
  firstTaskIdx = throwIfMissing(),
  botSize = throwIfMissing(),
) => {
  const vDealid = await bytes32Schema().validate(dealid);
  const vFirstTaskIdx = await positiveIntSchema().validate(firstTaskIdx);
  const vBotSize = await positiveStrictIntSchema().validate(botSize);
  const tasksIdx = [...Array(vBotSize).keys()].map(n => n + vFirstTaskIdx);
  const taskids = await Promise.all(
    tasksIdx.map(idx => computeTaskId(vDealid, idx)),
  );
  return taskids;
};

const show = async (
  contracts = throwIfMissing(),
  dealid = throwIfMissing(),
) => {
  try {
    const vDealid = await bytes32Schema().validate(dealid);
    const { chainId } = contracts;
    const clerkAddress = await contracts.fetchClerkAddress();
    const clerkContract = contracts.getClerkContract({ at: clerkAddress });
    const deal = bnifyNestedEthersBn(
      cleanRPC(await clerkContract.viewDeal(vDealid)),
    );
    const dealExists = deal && deal.app && deal.app.pointer && deal.app.pointer !== NULL_ADDRESS;
    if (!dealExists) throw Error(`No deal found for dealid ${dealid} on chain ${chainId}`);
    const tasks = await computeTaskIdsArray(
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
  computeTaskId,
  fetchRequesterDeals,
};
