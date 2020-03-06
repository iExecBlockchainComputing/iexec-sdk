const Debug = require('debug');
const JSZip = require('jszip');
const NodeRSA = require('node-rsa');
const aesjs = require('aes-js');
const { Observable, SafeObserver } = require('./reactive');
const dealModule = require('./deal');
const taskModule = require('./task');
const {
  getAuthorization,
  download,
  NULL_ADDRESS,
  sleep,
  FETCH_INTERVAL,
} = require('./utils');
const { getAddress } = require('./wallet');
const { bytes32Schema, throwIfMissing } = require('./validator');
const { ObjectNotFoundError } = require('./errors');

const debug = Debug('iexec:process');

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

const decryptResultsFile = async (encResultsZip, beneficiaryKey) => {
  const rootFolder = 'iexec_out';
  const encKeyFile = 'encrypted_key';
  const encResultsFile = 'result.zip.aes';

  let zip;
  try {
    zip = await new JSZip().loadAsync(encResultsZip);
  } catch (error) {
    debug(error);
    throw Error('Failed to load encrypted results zip file');
  }

  let encryptedResultsKeyArrayBuffer;
  try {
    encryptedResultsKeyArrayBuffer = await zip
      .file(`${rootFolder}/${encKeyFile}`)
      .async('arraybuffer');
  } catch (error) {
    throw Error(`Missing ${encKeyFile} file in zip input file`);
  }
  const encryptedResultsKeyBuffer = Buffer.from(
    encryptedResultsKeyArrayBuffer,
    'ArrayBuffer',
  );

  debug('Decrypting results key');
  let resultsKey;
  try {
    const key = new NodeRSA(beneficiaryKey);
    resultsKey = key.decrypt(encryptedResultsKeyBuffer);
  } catch (error) {
    debug(error);
    throw Error('Failed to decrypt results key with beneficiary key');
  }
  debug('resultsKey', resultsKey);
  debug('Decrypting results');
  try {
    const iv = await new Promise((resolve, reject) => {
      zip
        .file(`${rootFolder}/${encResultsFile}`)
        .nodeStream()
        .on('data', (data) => {
          try {
            resolve(Buffer.from(data.slice(0, 16)));
          } catch (e) {
            debug('error', e);
            reject(e);
          }
        })
        .on('error', (e) => {
          debug('error', e);
          reject(e);
        })
        .resume();
    });
    debug('iv', iv);

    const decryptedFile = await new Promise((resolve, reject) => {
      /* eslint new-cap: ["error", { "newIsCapExceptions": ["cbc"] }] */
      const aesCbc = new aesjs.ModeOfOperation.cbc(resultsKey, iv);
      const chunks = [];
      zip
        .file(`${rootFolder}/${encResultsFile}`)
        .nodeStream()
        .on('data', (data) => {
          try {
            // remove 16 bytes iv from enc file
            const buffer = chunks.length !== 0
              ? Buffer.from(aesCbc.decrypt(data))
              : Buffer.from(aesCbc.decrypt(data.slice(16)));
            chunks.push(buffer);
          } catch (e) {
            debug('error', e);
            reject(e);
          }
        })
        .on('error', (e) => {
          debug('error', e);
          reject(e);
        })
        .on('end', async () => {
          // remove pkcs7 padding
          const lastChunk = chunks[chunks.length - 1];
          const padding = lastChunk[lastChunk.length - 1];
          if (!padding || padding > 16 || padding > lastChunk.length) throw Error('invalid padding');
          const unpaddedChunk = lastChunk.slice(0, lastChunk.length - padding);
          chunks[chunks.length - 1] = unpaddedChunk;
          resolve(Buffer.concat(chunks));
        })
        .resume();
    });
    return decryptedFile;
  } catch (error) {
    debug(error);
    throw Error('Failed to decrypt results with decrypted results key');
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
  decryptResultsFile,
  obsTask,
  obsDeal,
};
