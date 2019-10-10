const Debug = require('debug');
const { defaultAbiCoder, keccak256 } = require('ethers').utils;
const {
  cleanRPC,
  bnifyNestedEthersBn,
  ethersBnToBn,
  http,
  NULL_ADDRESS,
  BN,
} = require('./utils');
const {
  chainIdSchema,
  addressSchema,
  bytes32Schema,
  uint256Schema,
  positiveIntSchema,
  positiveStrictIntSchema,
  throwIfMissing,
} = require('./validator');
const { ObjectNotFoundError } = require('./errors');
const { wrapCall, wrapSend, wrapWait } = require('./errorWrappers');
const { showCategory, getTimeoutRatio } = require('./hub');
const showTask = require('./task').show;

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
    const clerkAddress = await wrapCall(contracts.fetchClerkAddress());
    const clerkContract = contracts.getClerkContract({ at: clerkAddress });
    const deal = bnifyNestedEthersBn(
      cleanRPC(await wrapCall(clerkContract.viewDeal(vDealid))),
    );
    const dealExists = deal && deal.app && deal.app.pointer && deal.app.pointer !== NULL_ADDRESS;
    if (!dealExists) {
      throw new ObjectNotFoundError('deal', dealid, chainId);
    }
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

const claim = async (
  contracts = throwIfMissing(),
  dealid = throwIfMissing(),
) => {
  const transactions = [];
  const claimed = {};
  try {
    const vDealid = await bytes32Schema().validate(dealid);
    const deal = await show(contracts, vDealid);
    const [{ workClockTimeRef }, timeoutRatio] = await Promise.all([
      showCategory(contracts, deal.category),
      getTimeoutRatio(contracts),
    ]);
    const consensusTimeout = deal.startTime
      .add(timeoutRatio.mul(workClockTimeRef))
      .toNumber();
    const now = Math.floor(Date.now() / 1000);
    if (now < consensusTimeout) {
      throw Error(
        `Cannot claim a deal before reaching the consensus timeout date: ${new Date(
          1000 * consensusTimeout,
        )}`,
      );
    }
    const { tasks } = deal;
    const initialized = [];
    const notInitialized = [];

    await Promise.all(
      Object.entries(tasks).map(async ([idx, taskid]) => {
        try {
          const task = await showTask(contracts, taskid);
          if (task.status < 3) {
            initialized.push({ idx, taskid });
          }
        } catch (error) {
          if (error instanceof ObjectNotFoundError) {
            notInitialized.push({ idx, taskid });
          } else throw error;
        }
      }),
    );
    if (initialized.length === 0 && notInitialized.length === 0) throw Error('Nothing to claim');
    initialized.sort((a, b) => (parseInt(a.idx, 10) > parseInt(b.idx, 10) ? 1 : -1));
    notInitialized.sort((a, b) => (parseInt(a.idx, 10) > parseInt(b.idx, 10) ? 1 : -1));
    const lastBlock = await wrapCall(
      contracts.jsonRpcProvider.getBlock('latest'),
    );
    const blockGasLimit = ethersBnToBn(lastBlock.gasLimit);
    debug('blockGasLimit', blockGasLimit.toString());
    const hubContract = contracts.getHubContract();
    if (initialized.length > 0) {
      const EST_GAS_PER_CLAIM = new BN(55000);
      const maxClaimPerTx = blockGasLimit.div(EST_GAS_PER_CLAIM);
      const processClaims = async () => {
        if (!initialized.length) return;
        const initializedToProcess = initialized.splice(
          0,
          maxClaimPerTx.toNumber(),
        );
        const taskidToProcess = initializedToProcess.map(
          ({ taskid }) => taskid,
        );
        const tx = await wrapSend(
          hubContract.claimArray(taskidToProcess, contracts.txOptions),
        );
        debug(`claimArray ${tx.hash} (${initializedToProcess.length} tasks)`);
        await wrapWait(tx.wait());
        transactions.push({
          txHash: tx.hash,
          type: 'claimArray',
        });
        Object.assign(
          claimed,
          ...initializedToProcess.map(e => ({ [e.idx]: e.taskid })),
        );
        await processClaims();
      };
      await processClaims();
    }
    if (notInitialized.length > 0) {
      const EST_GAS_PER_CLAIM = new BN(250000);
      const maxClaimPerTx = blockGasLimit.div(EST_GAS_PER_CLAIM);

      const processInitAndClaims = async () => {
        if (!notInitialized.length) return;
        const notInitializedToProcess = notInitialized.splice(
          0,
          maxClaimPerTx.toNumber(),
        );
        const idxToProcess = notInitializedToProcess.map(({ idx }) => idx);
        const dealidArray = new Array(idxToProcess.length).fill(vDealid);
        const tx = await wrapSend(
          hubContract.initializeAndClaimArray(
            dealidArray,
            idxToProcess,
            contracts.txOptions,
          ),
        );
        debug(
          `initializeAndClaimArray ${tx.hash} (${notInitializedToProcess.length} tasks)`,
        );
        await wrapWait(tx.wait());
        transactions.push({
          txHash: tx.hash,
          type: 'initializeAndClaimArray',
        });
        Object.assign(
          claimed,
          ...notInitializedToProcess.map(e => ({ [e.idx]: e.taskid })),
        );
        await processInitAndClaims();
      };
      await processInitAndClaims();
    }
    return { transactions, claimed };
  } catch (error) {
    debug('claim()', error);
    throw error;
  }
};

module.exports = {
  show,
  computeTaskId,
  fetchRequesterDeals,
  claim,
};
