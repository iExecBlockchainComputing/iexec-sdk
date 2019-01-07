const Debug = require('debug');
const { http, checkEvent, isBytes32 } = require('./utils');

const debug = Debug('iexec:task');
const objName = 'task';

const statusMap = {
  0: 'UNSET',
  1: 'ACTIVE',
  2: 'REVEALING',
  3: 'COMPLETED',
  4: 'FAILLED',
};
const FETCH_INTERVAL = 5000;
const sleep = ms => new Promise(res => setTimeout(res, ms));

const show = async (contracts, taskid) => {
  try {
    if (!isBytes32(taskid, { strict: false })) throw Error('invalid taskid');
    const { chainID } = contracts;
    const body = { chainID, find: { taskid } };
    const response = await http.post('tasks', body);
    let task;
    if (response.tasks && response.tasks[0]) [task] = response.tasks;
    else throw new Error(`no task found for taskid ${taskid} on chain ${chainID}`);
    return task;
  } catch (error) {
    debug('show()', error);
    throw error;
  }
};

const waitForTaskStatusChange = async (
  contracts,
  taskid,
  prevStatus,
  counter = 0,
) => {
  try {
    if (!isBytes32(taskid, { strict: false })) throw Error('invalid taskid');
    const task = await show(contracts, taskid);
    const taskStatus = task.status;
    const taskStatusName = statusMap[taskStatus];
    if (taskStatus !== prevStatus) {
      return { status: taskStatus, statusName: taskStatusName };
    }
    await sleep(FETCH_INTERVAL);
    return waitForTaskStatusChange(contracts, taskid, taskStatus, counter + 1);
  } catch (error) {
    debug('waitForTaskStatusChange()', error);
    throw error;
  }
};

const claim = async (contracts, taskid, userAddress) => {
  try {
    if (!isBytes32(taskid, { strict: false })) throw Error('invalid taskid');
    const task = await show(contracts, taskid);
    const taskStatus = task.status;

    if (['COMPLETED', 'FAILLED'].includes(statusMap[taskStatus.toString()])) {
      throw Error(
        `cannot claim a ${objName} having status: ${
          statusMap[taskStatus.toString()]
        }`,
      );
    }
    if (task.requester.toLowerCase() !== userAddress.toLowerCase()) {
      throw Error(
        `cannot claim a ${objName} requested by someone else: ${
          task.requester
        }`,
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const consensusTimeout = parseInt(task.finalDeadline, 10);

    if (now < consensusTimeout) {
      throw Error(
        `cannot claim a work before reaching the consensus timeout date: ${new Date(
          1000 * consensusTimeout,
        )}`,
      );
    }

    const hubContract = contracts.getHubContract();
    const claimTx = await hubContract.claim(taskid);

    const claimTxReceipt = await claimTx.wait();
    const claimEvents = contracts.decodeHubLogs(claimTxReceipt.logs);
    if (!checkEvent('TaskClaimed', claimEvents)) throw Error('TaskClaimed not confirmed');

    return claimTx.hash;
  } catch (error) {
    debug('claim()', error);
    throw error;
  }
};

module.exports = {
  statusMap,
  show,
  waitForTaskStatusChange,
  claim,
};
