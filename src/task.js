const Debug = require('debug');
const deal = require('./deal');
const {
  checkEvent,
  isBytes32,
  bnifyNestedEthersBn,
  cleanRPC,
} = require('./utils');

const debug = Debug('iexec:task');
const objName = 'task';

const taskStatusMap = {
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
    const { chainId } = contracts;
    const hubContract = contracts.getHubContract();
    const task = bnifyNestedEthersBn(
      cleanRPC(await hubContract.viewTask(taskid)),
    );
    if (
      task.dealid
      === '0x0000000000000000000000000000000000000000000000000000000000000000'
    ) throw Error(`no task found for taskid ${taskid} on chain ${chainId}`);
    return Object.assign(
      {},
      task,
      {
        statusName: taskStatusMap[task.status],
      },
      {
        results:
          task.results
          && Buffer.from(task.results.substr(2), 'hex').toString('utf8'),
      },
    );
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
    debug('taskStatus', taskStatus);
    const taskStatusName = taskStatusMap[taskStatus];
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

    if (
      ['COMPLETED', 'FAILLED'].includes(taskStatusMap[taskStatus.toString()])
    ) {
      throw Error(
        `cannot claim a ${objName} having status ${
          taskStatusMap[taskStatus.toString()]
        }`,
      );
    }
    const tasksDeal = await deal.show(contracts, task.dealid);
    debug('tasksDeal', tasksDeal);

    if (tasksDeal.requester.toLowerCase() !== userAddress.toLowerCase()) {
      throw Error(
        `cannot claim a ${objName} requested by someone else: ${
          tasksDeal.requester
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
  taskStatusMap,
  show,
  waitForTaskStatusChange,
  claim,
};
