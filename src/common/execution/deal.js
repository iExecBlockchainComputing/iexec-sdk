import Debug from 'debug';
import { AbiCoder, keccak256 } from 'ethers';
import { showCategory } from '../protocol/category.js';
import { getTimeoutRatio } from '../protocol/configuration.js';
import { bigIntToBn, BN, checkSigner } from '../utils/utils.js';
import { jsonApi, wrapPaginableRequest } from '../utils/api-utils.js';
import {
  chainIdSchema,
  addressSchema,
  bytes32Schema,
  uint256Schema,
  positiveIntSchema,
  positiveStrictIntSchema,
  throwIfMissing,
} from '../utils/validator.js';
import { wrapCall, wrapSend, wrapWait } from '../utils/errorWrappers.js';
import {
  APP_ORDER,
  DATASET_ORDER,
  WORKERPOOL_ORDER,
  REQUEST_ORDER,
} from '../utils/constant.js';
import { viewDeal, viewTask } from './common.js';
import { obsTask } from './task.js';
import { Observable, SafeObserver } from '../utils/reactive.js';
import { MarketCallError } from '../utils/errors.js';

const debug = Debug('iexec:execution:deal');

export const fetchRequesterDeals = async (
  contracts = throwIfMissing(),
  iexecGatewayURL = throwIfMissing(),
  requesterAddress = throwIfMissing(),
  {
    appAddress,
    datasetAddress,
    workerpoolAddress,
    page = 0,
    pageSize = 20,
  } = {},
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
      ...(page !== undefined && {
        pageIndex: await positiveIntSchema().label('page').validate(page),
      }),
      ...(pageSize !== undefined && {
        pageSize: await positiveStrictIntSchema()
          .min(10)
          .label('pageSize')
          .validate(pageSize),
      }),
    };
    const response = await wrapPaginableRequest(jsonApi.get)({
      api: iexecGatewayURL,
      endpoint: '/deals',
      query,
      ApiCallErrorClass: MarketCallError,
    });
    if (response.ok && response.deals) {
      return response;
    }
    throw Error('An error occurred while getting deals');
  } catch (error) {
    debug('fetchRequesterDeals()', error);
    throw error;
  }
};

export const computeTaskId = async (
  dealid = throwIfMissing(),
  taskIdx = throwIfMissing(),
) => {
  try {
    const encodedTypes = ['bytes32', 'uint256'];
    const values = [
      await bytes32Schema().validate(dealid),
      await uint256Schema().validate(taskIdx),
    ];
    const encoded = AbiCoder.defaultAbiCoder().encode(encodedTypes, values);
    return keccak256(encoded);
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
  return Promise.all(tasksIdx.map((idx) => computeTaskId(vDealid, idx)));
};

export const show = async (
  contracts = throwIfMissing(),
  dealid = throwIfMissing(),
) => {
  try {
    const vDealid = await bytes32Schema().validate(dealid);
    const deal = await viewDeal(contracts, dealid);
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
    return {
      dealid: vDealid,
      ...deal,
      finalTime,
      deadlineReached,
      tasks,
    };
  } catch (error) {
    debug('show()', error);
    throw error;
  }
};

const obsDealMessages = {
  DEAL_UPDATED: 'DEAL_UPDATED',
  DEAL_COMPLETED: 'DEAL_COMPLETED',
  DEAL_TIMEDOUT: 'DEAL_TIMEDOUT',
};

export const obsDeal = (
  contracts = throwIfMissing(),
  dealid = throwIfMissing(),
) =>
  new Observable((observer) => {
    const safeObserver = new SafeObserver(observer);
    let taskWatchers = [];

    const startWatch = async () => {
      try {
        const deal = await show(contracts, dealid);
        const tasks = Object.entries(deal.tasks).reduce(
          (acc, [idx, taskid]) => {
            acc[idx] = { idx, taskid };
            return acc;
          },
          {},
        );

        const callNext = () => {
          const tasksCopy = { ...tasks };
          const tasksArray = Object.values(tasksCopy);
          if (!tasksArray.find(({ status }) => status === undefined)) {
            let complete = false;
            const tasksCount = tasksArray.length;
            const completedTasksCount = tasksArray.filter(
              (task) => task.status === 3,
            ).length;
            const failedTasksCount = tasksArray.filter(
              (task) => task.taskTimedOut === true,
            ).length;
            let message;
            if (completedTasksCount === tasksCount) {
              message = obsDealMessages.DEAL_COMPLETED;
              complete = true;
            } else if (completedTasksCount + failedTasksCount === tasksCount) {
              message = obsDealMessages.DEAL_TIMEDOUT;
              complete = true;
            } else {
              message = obsDealMessages.DEAL_UPDATED;
            }
            safeObserver.next({
              message,
              tasksCount,
              completedTasksCount,
              failedTasksCount,
              deal: { ...deal },
              tasks: tasksCopy,
            });
            if (complete) {
              safeObserver.complete();
            }
          }
        };

        taskWatchers = Object.entries(tasks).map(([idx, { taskid }]) =>
          obsTask(contracts, taskid, { dealid }).subscribe({
            next: ({ task }) => {
              tasks[idx] = { ...tasks[idx], ...task };
              callNext();
            },
            error: (e) => {
              safeObserver.error(e);
              taskWatchers.forEach((unsub) => unsub());
            },
          }),
        );
      } catch (e) {
        safeObserver.error(e);
      }
    };

    safeObserver.unsub = () => {
      taskWatchers.forEach((unsub) => unsub());
    };
    startWatch();
    return safeObserver.unsubscribe.bind(safeObserver);
  });

const numericStringPropAscSort = (propName) => (a, b) =>
  parseInt(a[propName], 10) > parseInt(b[propName], 10) ? 1 : -1;

export const claim = async (
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
        const task = await viewTask(contracts, taskid, { strict: false });
        const taskStatus = new BN(task.status).toNumber();
        if (taskStatus === 0) {
          notInitialized.push({ idx, taskid });
        } else if (taskStatus < 3) {
          initialized.push({ idx, taskid });
        }
      }),
    );
    if (initialized.length === 0 && notInitialized.length === 0)
      throw Error('Nothing to claim');

    initialized.sort(numericStringPropAscSort('idx'));
    notInitialized.sort(numericStringPropAscSort('idx'));
    const lastBlock = await wrapCall(contracts.provider.getBlock('latest'));
    const blockGasLimit = bigIntToBn(lastBlock.gasLimit);
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

const apiDealField = {
  [APP_ORDER]: 'apporderHash',
  [DATASET_ORDER]: 'datasetorderHash',
  [WORKERPOOL_ORDER]: 'workerpoolorderHash',
  [REQUEST_ORDER]: 'requestorderHash',
};

export const fetchDealsByOrderHash = async (
  iexecGatewayURL = throwIfMissing(),
  orderName = throwIfMissing(),
  chainId = throwIfMissing(),
  orderHash = throwIfMissing(),
  { page = 0, pageSize = 20 } = {},
) => {
  try {
    const vChainId = await chainIdSchema().validate(chainId);
    const vOrderHash = await bytes32Schema().validate(orderHash);
    const hashName = apiDealField[orderName];
    const query = {
      chainId: vChainId,
      [hashName]: vOrderHash,
      ...(page !== undefined && {
        pageIndex: await positiveIntSchema().label('page').validate(page),
      }),
      ...(pageSize !== undefined && {
        pageSize: await positiveStrictIntSchema()
          .min(10)
          .label('pageSize')
          .validate(pageSize),
      }),
    };
    const response = await jsonApi.get({
      api: iexecGatewayURL,
      endpoint: '/deals',
      query,
      ApiCallErrorClass: MarketCallError,
    });
    if (response.ok && response.deals) {
      return { count: response.count, deals: response.deals };
    }
    throw Error('An error occurred while getting deals');
  } catch (error) {
    debug('fetchDealsByOrderHash()', error);
    throw error;
  }
};
