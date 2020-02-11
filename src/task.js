const Debug = require('debug');
const { Buffer } = require('buffer');
const deal = require('./deal');
const {
  checkEvent,
  bnifyNestedEthersBn,
  cleanRPC,
  getAuthorization,
  download,
  NULL_ADDRESS,
  NULL_BYTES32,
  sleep,
} = require('./utils');
const { getAddress } = require('./wallet');
const { bytes32Schema, uint256Schema, throwIfMissing } = require('./validator');
const { ObjectNotFoundError } = require('./errors');
const { wrapCall, wrapSend, wrapWait } = require('./errorWrappers');

const debug = Debug('iexec:task');
const objName = 'task';

const TASK_STATUS_MAP = {
  0: 'UNSET',
  1: 'ACTIVE',
  2: 'REVEALING',
  3: 'COMPLETED',
  4: 'FAILED',
  timeout: 'TIMEOUT',
};
const FETCH_INTERVAL = 5000;

const show = async (
  contracts = throwIfMissing(),
  taskid = throwIfMissing(),
) => {
  try {
    const vTaskId = await bytes32Schema().validate(taskid);
    const { chainId } = contracts;
    const hubContract = contracts.getHubContract();
    const task = bnifyNestedEthersBn(
      cleanRPC(await wrapCall(hubContract.viewTask(vTaskId))),
    );
    if (task.dealid === NULL_BYTES32) {
      throw new ObjectNotFoundError('task', vTaskId, chainId);
    }

    const now = Math.floor(Date.now() / 1000);
    const consensusTimeout = parseInt(task.finalDeadline, 10);
    const taskTimedOut = task.status !== 3 && now >= consensusTimeout;

    const decodedResult = task.results
      && Buffer.from(task.results.substr(2), 'hex').toString('utf8');
    const displayResult = decodedResult
      && (decodedResult.substr(0, 6) === '/ipfs/'
        || decodedResult.substr(0, 4) === 'http')
      ? decodedResult
      : task.results;
    return Object.assign(
      {},
      task,
      {
        statusName:
          task.status < 3 && taskTimedOut
            ? TASK_STATUS_MAP.timeout
            : TASK_STATUS_MAP[task.status],
      },
      { taskTimedOut },
      {
        results: displayResult,
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
) => {
  try {
    const vTaskId = await bytes32Schema().validate(taskid);
    const vPrevStatus = await uint256Schema().validate(prevStatus);
    const task = await show(contracts, vTaskId);
    const taskStatusName = task.taskTimedOut
      ? TASK_STATUS_MAP.timeout
      : TASK_STATUS_MAP[task.status];
    if (task.status.toString() !== vPrevStatus || task.taskTimedOut) {
      return {
        status: task.status,
        statusName: taskStatusName,
        taskTimedOut: task.taskTimedOut,
      };
    }
    await sleep(FETCH_INTERVAL);
    return waitForTaskStatusChange(contracts, vTaskId, task.status);
  } catch (error) {
    debug('waitForTaskStatusChange()', error);
    throw error;
  }
};

const downloadFromIpfs = async (
  ipfsAddress,
  { ipfsGatewayURL = 'https://gateway.ipfs.io' } = {},
) => {
  try {
    debug(
      'downloadFromIpfs()',
      'ipfsGatewayURL',
      ipfsGatewayURL,
      'ipfsAddress',
      ipfsAddress,
    );
    const res = await download('GET')(ipfsAddress, {}, {}, ipfsGatewayURL);
    return res;
  } catch (error) {
    throw Error(`Failed to download from ${ipfsGatewayURL}: ${error.message}`);
  }
};

const downloadFromResultRepo = async (contracts, taskid, task, userAddress) => {
  const resultRepoBaseURL = task.results.split(`${taskid}`)[0];
  const authorization = await getAuthorization(
    contracts.chainId,
    userAddress,
    contracts.jsonRpcProvider,
    { apiUrl: resultRepoBaseURL },
  );
  const res = await download('GET')(
    taskid,
    { chainId: contracts.chainId },
    { authorization },
    resultRepoBaseURL,
  );
  return res;
};

const fetchResults = async (
  contracts = throwIfMissing(),
  taskid = throwIfMissing(),
  { ipfsGatewayURL } = {},
) => {
  try {
    const vTaskId = await bytes32Schema().validate(taskid);
    const userAddress = await getAddress(contracts);
    const task = await show(contracts, vTaskId);
    if (task.status !== 3) throw Error('Task is not completed');
    const tasksDeal = await deal.show(contracts, task.dealid);
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

const claim = async (
  contracts = throwIfMissing(),
  taskid = throwIfMissing(),
) => {
  try {
    const vTaskId = await bytes32Schema().validate(taskid);
    const task = await show(contracts, vTaskId);
    const taskStatus = task.status;

    if ([3, 4].includes(taskStatus)) {
      throw Error(
        `Cannot claim a ${objName} having status ${
          TASK_STATUS_MAP[taskStatus.toString()]
        }`,
      );
    }
    const tasksDeal = await deal.show(contracts, task.dealid);
    debug('tasksDeal', tasksDeal);

    if (!task.taskTimedOut) {
      throw Error(
        `Cannot claim a ${objName} before reaching the consensus deadline date: ${new Date(
          1000 * parseInt(task.finalDeadline, 10),
        )}`,
      );
    }

    const hubContract = contracts.getHubContract();
    const claimTx = await wrapSend(
      hubContract.claim(taskid, contracts.txOptions),
    );

    const claimTxReceipt = await wrapWait(claimTx.wait());
    if (!checkEvent('TaskClaimed', claimTxReceipt.events)) throw Error('TaskClaimed not confirmed');

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
