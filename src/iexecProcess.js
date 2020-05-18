const Debug = require('debug');
const { Observable, SafeObserver } = require('./reactive');
const dealModule = require('./deal');
const taskModule = require('./task');
const { NULL_ADDRESS, sleep, FETCH_INTERVAL } = require('./utils');
const { getAuthorization, downloadZipApi } = require('./api-utils');
const { getAddress } = require('./wallet');
const { bytes32Schema, throwIfMissing } = require('./validator');
const { ObjectNotFoundError } = require('./errors');

const debug = Debug('iexec:process');

const downloadFromIpfs = async (
  ipfsAddress,
  { ipfsGatewayURL = 'https://gateway.ipfs.io' } = {},
) => {
  try {
    const res = await await downloadZipApi.get({
      api: ipfsGatewayURL,
      endpoint: ipfsAddress,
    });
    return res;
  } catch (error) {
    throw Error(`Failed to download from ${ipfsGatewayURL}: ${error.message}`);
  }
};

const downloadFromResultRepo = async (contracts, taskid, task, userAddress) => {
  const resultRepoBaseURL = task.results.split(`/${taskid}`)[0];
  const authorization = await getAuthorization(resultRepoBaseURL, '/challenge')(
    contracts.chainId,
    userAddress,
    contracts.jsonRpcProvider,
  );
  const res = await downloadZipApi.get({
    api: resultRepoBaseURL,
    endpoint: `/${taskid}`,
    query: { chainId: contracts.chainId },
    headers: { authorization },
  });
  return res;
};

const fetchTaskResults = async (
  contracts = throwIfMissing(),
  taskid = throwIfMissing(),
  { ipfsGatewayURL } = {},
) => {
  try {
    const vTaskId = await bytes32Schema().validate(taskid);
    const userAddress = await getAddress(contracts);
    const task = await taskModule.show(contracts, vTaskId);
    if (task.status !== 3) throw Error('Task is not completed');

    const tasksDeal = await dealModule.show(contracts, task.dealid);
    if (
      userAddress.toLowerCase() !== tasksDeal.beneficiary.toLowerCase()
      && NULL_ADDRESS !== tasksDeal.beneficiary.toLowerCase()
    ) {
      throw Error(
        `Only beneficiary ${tasksDeal.beneficiary} can download the result`,
      );
    }
    const resultAddress = task.results;
    let res;
    if (resultAddress && resultAddress.substr(0, 6) === '/ipfs/') {
      debug('download from ipfs', resultAddress);
      res = await downloadFromIpfs(resultAddress, { ipfsGatewayURL });
    } else if (resultAddress && resultAddress.substr(0, 2) !== '0x') {
      debug('download from result repo', resultAddress);
      res = await downloadFromResultRepo(contracts, vTaskId, task, userAddress);
    } else {
      throw Error('No result uploaded for this task');
    }
    return res;
  } catch (error) {
    debug('fetchResults()', error);
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
) => new Observable((observer) => {
  let stop = false;
  const safeObserver = new SafeObserver(observer);

  const startWatch = async () => {
    try {
      const vTaskid = await bytes32Schema().validate(taskid);
      const vDealid = await bytes32Schema().validate(dealid);
      debug('vTaskid', vTaskid);
      debug('vDealid', vDealid);

      const handleTaskNotFound = async (e) => {
        if (e instanceof ObjectNotFoundError && vDealid) {
          const deal = await dealModule.show(contracts, vDealid);
          const now = Math.floor(Date.now() / 1000);
          const deadlineReached = now >= deal.finalTime.toNumber();
          return {
            taskid: vTaskid,
            dealid: vDealid,
            status: 0,
            statusName: deadlineReached
              ? taskModule.TASK_STATUS_MAP.timeout
              : taskModule.TASK_STATUS_MAP[0],
            taskTimedOut: deadlineReached,
          };
        }
        throw e;
      };

      const waitStatusChangeOrTimeout = async initialStatus => taskModule
        .waitForTaskStatusChange(contracts, vTaskid, initialStatus)
        .catch(async (e) => {
          const task = await handleTaskNotFound(e);
          if (
            task.status === initialStatus
                && !task.taskTimedOut
                && !stop
          ) {
            await sleep(FETCH_INTERVAL);
            return waitStatusChangeOrTimeout(task.status);
          }
          return task;
        });

      const watchTask = async (initialStatus = '') => {
        const task = await waitStatusChangeOrTimeout(initialStatus);
        debug('task', task);
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
        if (!stop) await watchTask(task.status);
      };
      await watchTask();
    } catch (e) {
      safeObserver.error(e);
    }
  };

  safeObserver.unsub = () => {
    // teardown callback
    stop = true;
  };
  startWatch();
  return safeObserver.unsubscribe.bind(safeObserver);
});

const obsDealMessages = {
  DEAL_UPDATED: 'DEAL_UPDATED',
  DEAL_COMPLETED: 'DEAL_COMPLETED',
  DEAL_TIMEDOUT: 'DEAL_TIMEDOUT',
};

const obsDeal = (contracts = throwIfMissing(), dealid = throwIfMissing()) => new Observable((observer) => {
  const safeObserver = new SafeObserver(observer);
  let taskWatchers = [];

  const startWatch = async () => {
    try {
      const deal = await dealModule.show(contracts, dealid);
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
            task => task.status === 3,
          ).length;
          const failedTasksCount = tasksArray.filter(
            task => task.taskTimedOut === true,
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

      taskWatchers = Object.entries(tasks).map(([idx, { taskid }]) => obsTask(contracts, taskid, { dealid }).subscribe({
        next: ({ task }) => {
          tasks[idx] = { ...tasks[idx], ...task };
          callNext();
        },
        error: (e) => {
          safeObserver.error(e);
          taskWatchers.map(unsub => unsub());
        },
      }));
    } catch (e) {
      safeObserver.error(e);
    }
  };

  safeObserver.unsub = () => {
    // teardown callback
    taskWatchers.map(unsub => unsub());
  };
  startWatch();
  return safeObserver.unsubscribe.bind(safeObserver);
});

module.exports = {
  fetchTaskResults,
  obsTask,
  obsDeal,
};
