const Debug = require('debug');
const deal = require('./deal');
const {
  checkEvent,
  isBytes32,
  isEthAddress,
  bnifyNestedEthersBn,
  cleanRPC,
  throwIfMissing,
  getAuthorization,
  download,
  NULL_ADDRESS,
  NULL_BYTES32,
} = require('./utils');

const debug = Debug('iexec:task');
const objName = 'task';

const TASK_STATUS_MAP = {
  0: 'UNSET',
  1: 'ACTIVE',
  2: 'REVEALING',
  3: 'COMPLETED',
  4: 'FAILLED',
};
const FETCH_INTERVAL = 5000;
const sleep = ms => new Promise(res => setTimeout(res, ms));

const show = async (
  contracts = throwIfMissing(),
  taskid = throwIfMissing(),
) => {
  try {
    if (!isBytes32(taskid, { strict: false })) throw Error('Invalid taskid');
    const { chainId } = contracts;
    const hubContract = contracts.getHubContract();
    const task = bnifyNestedEthersBn(
      cleanRPC(await hubContract.viewTask(taskid)),
    );
    if (task.dealid === NULL_BYTES32) throw Error(`No task found for taskid ${taskid} on chain ${chainId}`);
    return Object.assign(
      {},
      task,
      {
        statusName: TASK_STATUS_MAP[task.status],
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
  contracts = throwIfMissing(),
  taskid = throwIfMissing(),
  prevStatus = throwIfMissing(),
  counter = 0,
) => {
  try {
    isBytes32(taskid, { strict: true });
    const task = await show(contracts, taskid);
    const taskStatus = task.status;
    debug('taskStatus', taskStatus);
    const taskStatusName = TASK_STATUS_MAP[taskStatus];
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

const fetchResults = async (
  contracts = throwIfMissing(),
  taskid = throwIfMissing(),
  userAddress = throwIfMissing(),
) => {
  try {
    isEthAddress(userAddress, { strict: true });
    const task = await show(contracts, taskid);
    if (TASK_STATUS_MAP[task.status] !== 'COMPLETED') throw Error('Task is not completed');
    const tasksDeal = await deal.show(contracts, task.dealid);
    const beneficiary = tasksDeal.beneficiary === NULL_ADDRESS
      ? tasksDeal.requester
      : tasksDeal.beneficiary;
    if (userAddress.toLowerCase() !== beneficiary.toLowerCase()) {
      throw Error(`Only beneficiary ${beneficiary} can download the result`);
    }
    const resultRepoBaseURL = task.results.split(`${taskid}`)[0];
    const authorization = await getAuthorization(
      contracts.chainId,
      userAddress,
      contracts.ethProvider,
      { apiUrl: resultRepoBaseURL },
    );
    const res = await download('GET')(
      taskid,
      { chainId: contracts.chainId },
      { authorization },
      resultRepoBaseURL,
    );
    return res;
  } catch (error) {
    debug('fetchResults()', error);
    throw error;
  }
};

const claim = async (
  contracts = throwIfMissing(),
  taskid = throwIfMissing(),
  userAddress = throwIfMissing(),
) => {
  try {
    isBytes32(taskid, { strict: true });
    isEthAddress(userAddress, { strict: true });
    const task = await show(contracts, taskid);
    const taskStatus = task.status;

    if (
      ['COMPLETED', 'FAILLED'].includes(TASK_STATUS_MAP[taskStatus.toString()])
    ) {
      throw Error(
        `Cannot claim a ${objName} having status ${
          TASK_STATUS_MAP[taskStatus.toString()]
        }`,
      );
    }
    const tasksDeal = await deal.show(contracts, task.dealid);
    debug('tasksDeal', tasksDeal);

    if (tasksDeal.requester.toLowerCase() !== userAddress.toLowerCase()) {
      throw Error(
        `Cannot claim a ${objName} requested by someone else: ${
          tasksDeal.requester
        }`,
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const consensusTimeout = parseInt(task.finalDeadline, 10);

    if (now < consensusTimeout) {
      throw Error(
        `Cannot claim a ${objName} before reaching the consensus timeout date: ${new Date(
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
  TASK_STATUS_MAP,
  show,
  fetchResults,
  waitForTaskStatusChange,
  claim,
};
