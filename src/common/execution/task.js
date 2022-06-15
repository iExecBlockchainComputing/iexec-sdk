const Debug = require('debug');
const { Buffer } = require('buffer');
const { checkEvent, checkSigner, FETCH_INTERVAL } = require('../utils/utils');
const { NULL_BYTES } = require('../utils/constant');
const { bytes32Schema, throwIfMissing } = require('../utils/validator');
const { ObjectNotFoundError } = require('../utils/errors');
const { wrapSend, wrapWait } = require('../utils/errorWrappers');
const { Observable, SafeObserver } = require('../utils/reactive');
const { viewDeal, viewTask } = require('./common');
const { showCategory } = require('../protocol/category');
const { getTimeoutRatio } = require('../protocol/configuration');

const debug = Debug('iexec:execution:task');

const TASK_STATUS_MAP = {
  0: 'UNSET',
  1: 'ACTIVE',
  2: 'REVEALING',
  3: 'COMPLETED',
  4: 'FAILED',
  timeout: 'TIMEOUT',
};

const decodeTaskResult = (results) => {
  try {
    if (results !== NULL_BYTES) {
      const json = JSON.parse(
        Buffer.from(results.substr(2), 'hex').toString('utf8'),
      );
      return json;
    }
  } catch (e) {
    // nothing to do
  }
  return { storage: 'none' };
};

const show = async (
  contracts = throwIfMissing(),
  taskid = throwIfMissing(),
) => {
  try {
    const vTaskId = await bytes32Schema().validate(taskid);
    const task = await viewTask(contracts, vTaskId);
    const now = Math.floor(Date.now() / 1000);
    const consensusTimeout = parseInt(task.finalDeadline, 10);
    const taskTimedOut = task.status !== 3 && now >= consensusTimeout;
    const decodedResult = decodeTaskResult(task.results);
    return {
      taskid: vTaskId,
      ...task,
      statusName:
        task.status < 3 && taskTimedOut
          ? TASK_STATUS_MAP.timeout
          : TASK_STATUS_MAP[task.status],
      taskTimedOut,
      results: decodedResult,
    };
  } catch (error) {
    debug('show()', error);
    throw error;
  }
};

const obsTaskMessages = {
  TASK_UPDATED: 'TASK_UPDATED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_TIMEDOUT: 'TASK_TIMEDOUT',
  TASK_FAILED: 'TASK_FAILED',
};

const obsTask = (
  contracts = throwIfMissing(),
  taskid = throwIfMissing(),
  { dealid } = {},
) =>
  new Observable((observer) => {
    const safeObserver = new SafeObserver(observer);

    let task;
    let interval;
    let abort = false;

    const handleTaskNotFound = async (e) => {
      const vDealid = await bytes32Schema().validate(dealid);
      if (e instanceof ObjectNotFoundError && vDealid) {
        const vTaskid = await bytes32Schema().validate(taskid);
        const deal = await viewDeal(contracts, vDealid);

        const [{ workClockTimeRef }, timeoutRatio] = await Promise.all([
          showCategory(contracts, deal.category),
          getTimeoutRatio(contracts),
        ]);
        const finalTime = deal.startTime.add(
          timeoutRatio.mul(workClockTimeRef),
        );
        const now = Math.floor(Date.now() / 1000);
        const deadlineReached = now >= finalTime.toNumber();

        return {
          taskid: vTaskid,
          dealid: vDealid,
          status: 0,
          statusName: deadlineReached
            ? TASK_STATUS_MAP.timeout
            : TASK_STATUS_MAP[0],
          taskTimedOut: deadlineReached,
        };
      }
      throw e;
    };

    const checkTaskEnded = ({ status, taskTimedOut } = {}) =>
      taskTimedOut || status === 3 || status === 4;

    const fetchTaskAndNotify = async () => {
      try {
        const vTaskid = await bytes32Schema().validate(taskid);
        const newTask = await show(contracts, vTaskid).catch(
          handleTaskNotFound,
        );
        if (!task || newTask.status !== task.status || newTask.taskTimedOut) {
          task = newTask;
          if (task.status === 3) {
            safeObserver.next({
              message: obsTaskMessages.TASK_COMPLETED,
              task,
            });
            safeObserver.complete();
            return;
          }
          if (task.status === 4) {
            safeObserver.next({
              message: obsTaskMessages.TASK_FAILED,
              task,
            });
            safeObserver.complete();
            return;
          }
          if (task.taskTimedOut) {
            safeObserver.next({
              message: obsTaskMessages.TASK_TIMEDOUT,
              task,
            });
            safeObserver.complete();
            return;
          }
          safeObserver.next({
            message: obsTaskMessages.TASK_UPDATED,
            task,
          });
        }
      } catch (e) {
        safeObserver.error(e);
      }
    };

    fetchTaskAndNotify().then(() => {
      if (!abort && !checkTaskEnded(task)) {
        interval = setInterval(fetchTaskAndNotify, FETCH_INTERVAL);
      }
    });

    safeObserver.unsub = () => {
      abort = true;
      if (interval) {
        clearInterval(interval);
      }
    };
    return safeObserver.unsubscribe.bind(safeObserver);
  });

const claim = async (
  contracts = throwIfMissing(),
  taskid = throwIfMissing(),
) => {
  try {
    checkSigner(contracts);
    const vTaskId = await bytes32Schema().validate(taskid);
    const task = await show(contracts, vTaskId);
    const taskStatus = task.status;

    if ([3, 4].includes(taskStatus)) {
      throw Error(
        `Cannot claim a task having status ${
          TASK_STATUS_MAP[taskStatus.toString()]
        }`,
      );
    }

    if (!task.taskTimedOut) {
      throw Error(
        `Cannot claim a task before reaching the consensus deadline date: ${new Date(
          1000 * parseInt(task.finalDeadline, 10),
        )}`,
      );
    }

    const iexecContract = contracts.getIExecContract();
    const claimTx = await wrapSend(
      iexecContract.claim(taskid, contracts.txOptions),
    );

    const claimTxReceipt = await wrapWait(claimTx.wait(contracts.confirms));
    if (!checkEvent('TaskClaimed', claimTxReceipt.events))
      throw Error('TaskClaimed not confirmed');

    return claimTx.hash;
  } catch (error) {
    debug('claim()', error);
    throw error;
  }
};

module.exports = {
  TASK_STATUS_MAP,
  show,
  obsTask,
  claim,
};
