const Debug = require('debug');
const { defaultAbiCoder, keccak256 } = require('ethers').utils;
const { showCategory, getTimeoutRatio } = require('./hub');
const {
  cleanRPC,
  bnifyNestedEthersBn,
  ethersBnToBn,
  NULL_ADDRESS,
  BN,
  checkSigner,
} = require('../utils/utils');
const { jsonApi, wrapPaginableRequest } = require('../utils/api-utils');
const {
  chainIdSchema,
  addressSchema,
  bytes32Schema,
  uint256Schema,
  positiveIntSchema,
  positiveStrictIntSchema,
  throwIfMissing,
} = require('../utils/validator');
const { ObjectNotFoundError } = require('../utils/errors');
const { wrapCall, wrapSend, wrapWait } = require('../utils/errorWrappers');

const debug = Debug('iexec:deal');

const fetchRequesterDeals = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  requesterAddress = throwIfMissing(),
  { appAddress, datasetAddress, workerpoolAddress } = {},
) => {
  try {
    const vRequesterAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(requesterAddress);
    const vChainId = await chainIdSchema().validate(contracts.chainId);
    let vAppAddress;
    let vDatasetAddress;
    let vWorkerpoolAddress;
    if (appAddress) {
      vAppAddress = await addressSchema({
        ethProvider: contracts.provider,
      }).validate(appAddress);
    }
    if (datasetAddress) {
      vDatasetAddress = await addressSchema({
        ethProvider: contracts.provider,
      }).validate(datasetAddress);
    }
    if (workerpoolAddress) {
      vWorkerpoolAddress = await addressSchema({
        ethProvider: contracts.provider,
      }).validate(workerpoolAddress);
    }
    const query = {
      chainId: vChainId,
      requester: vRequesterAddress,
      ...(appAddress && { app: vAppAddress }),
      ...(datasetAddress && {
        dataset: vDatasetAddress,
      }),
      ...(workerpoolAddress && {
        workerpool: vWorkerpoolAddress,
      }),
    };
    const response = await wrapPaginableRequest(jsonApi.get)({
      api: iexecGatewayURL,
      endpoint: '/deals',
      query,
    });
    if (response.ok && response.deals) {
      return response;
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
  const tasksIdx = [...Array(vBotSize).keys()].map((n) => n + vFirstTaskIdx);
  const taskids = await Promise.all(
    tasksIdx.map((idx) => computeTaskId(vDealid, idx)),
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
    const iexecContract = contracts.getIExecContract();
    const deal = bnifyNestedEthersBn(
      cleanRPC(await wrapCall(iexecContract.viewDeal(vDealid))),
    );
    const dealExists =
      deal && deal.app && deal.app.pointer && deal.app.pointer !== NULL_ADDRESS;
    if (!dealExists) {
      throw new ObjectNotFoundError('deal', dealid, chainId);
    }
    const [{ workClockTimeRef }, timeoutRatio] = await Promise.all([
      showCategory(contracts, deal.category),
      getTimeoutRatio(contracts),
    ]);
    const finalTime = deal.startTime.add(timeoutRatio.mul(workClockTimeRef));
    const now = Math.floor(Date.now() / 1000);
    const deadlineReached = now >= finalTime.toNumber();

    const tasks = await computeTaskIdsArray(
      dealid,
      deal.botFirst.toString(),
      deal.botSize.toString(),
    );
    const enhancedDeal = {
      dealid: vDealid,
      ...deal,
      finalTime,
      deadlineReached,
      tasks,
    };
    return enhancedDeal;
  } catch (error) {
    debug('show()', error);
    throw error;
  }
};

const getTaskStatus = async (
  contracts = throwIfMissing(),
  taskid = throwIfMissing(),
) => {
  try {
    const vTaskId = await bytes32Schema().validate(taskid);
    const iexecContract = contracts.getIExecContract();
    const task = bnifyNestedEthersBn(
      cleanRPC(await wrapCall(iexecContract.viewTask(vTaskId))),
    );
    return new BN(task.status).toNumber();
  } catch (error) {
    debug('getTaskStatus()', error);
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
    checkSigner(contracts);
    const vDealid = await bytes32Schema().validate(dealid);
    const deal = await show(contracts, vDealid);
    if (!deal.deadlineReached) {
      throw Error(
        `Cannot claim a deal before reaching the final time: ${new Date(
          1000 * deal.finalTime,
        )}`,
      );
    }
    const { tasks } = deal;
    const initialized = [];
    const notInitialized = [];

    await Promise.all(
      Object.entries(tasks).map(async ([idx, taskid]) => {
        const taskStatus = await getTaskStatus(contracts, taskid);
        if (taskStatus === 0) {
          notInitialized.push({ idx, taskid });
        } else if (taskStatus < 3) {
          initialized.push({ idx, taskid });
        }
      }),
    );
    if (initialized.length === 0 && notInitialized.length === 0)
      throw Error('Nothing to claim');
    initialized.sort((a, b) =>
      parseInt(a.idx, 10) > parseInt(b.idx, 10) ? 1 : -1,
    );
    notInitialized.sort((a, b) =>
      parseInt(a.idx, 10) > parseInt(b.idx, 10) ? 1 : -1,
    );
    const lastBlock = await wrapCall(contracts.provider.getBlock('latest'));
    const blockGasLimit = ethersBnToBn(lastBlock.gasLimit);
    debug('blockGasLimit', blockGasLimit.toString());
    const iexecContract = contracts.getIExecContract();
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
          iexecContract.claimArray(taskidToProcess, contracts.txOptions),
        );
        debug(`claimArray ${tx.hash} (${initializedToProcess.length} tasks)`);
        await wrapWait(tx.wait(contracts.confirms));
        transactions.push({
          txHash: tx.hash,
          type: 'claimArray',
        });
        Object.assign(
          claimed,
          ...initializedToProcess.map((e) => ({ [e.idx]: e.taskid })),
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
          iexecContract.initializeAndClaimArray(
            dealidArray,
            idxToProcess,
            contracts.txOptions,
          ),
        );
        debug(
          `initializeAndClaimArray ${tx.hash} (${notInitializedToProcess.length} tasks)`,
        );
        await wrapWait(tx.wait(contracts.confirms));
        transactions.push({
          txHash: tx.hash,
          type: 'initializeAndClaimArray',
        });
        Object.assign(
          claimed,
          ...notInitializedToProcess.map((e) => ({ [e.idx]: e.taskid })),
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
