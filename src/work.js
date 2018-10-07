const Debug = require('debug');
const { Spinner, info, prettyRPC } = require('./cli-helper');

const debug = Debug('iexec:work');
const objName = 'work';

const statusMap = {
  0: 'UNSET',
  1: 'ACTIVE',
  2: 'REVEALING',
  3: 'CLAIMED',
  4: 'COMPLETED',
};
const FETCH_INTERVAL = 5000;
const sleep = ms => new Promise(res => setTimeout(res, ms));

const waitForWorkStatus = async (getWorkStatusFn, prevStatus, counter = 0) => {
  try {
    const workStatus = await getWorkStatusFn();
    debug('workStatus', workStatus);
    const workStatusName = statusMap[workStatus[0].toString()];
    debug('workStatusName', workStatusName);
    if (workStatusName === 'COMPLETED') return workStatusName;
    if (workStatusName === 'CLAIMED') return workStatusName;
    if (workStatusName !== prevStatus) {
      console.log('new status change', workStatusName);
    }
    await sleep(FETCH_INTERVAL);
    return waitForWorkStatus(getWorkStatusFn, workStatusName, counter + 1);
  } catch (error) {
    debug('waitForWorkStatus()', error);
    throw error;
  }
};

const show = async (contracts, workAddress, options = {}) => {
  const opts = Object.assign({ print: true }, options);
  const spinner = Spinner();
  if (opts.print) spinner.start(info.showing(objName));
  let obj = await contracts.getObjProps(objName)(workAddress);
  debug('obj', obj);
  let workStatusName = statusMap[obj.m_status.toString()];
  debug('workStatusName', workStatusName);

  obj.m_statusName = workStatusName;
  if (opts.print) {
    spinner.succeed(
      `${objName} ${workAddress} status is ${workStatusName}, details:${prettyRPC(
        obj,
      )}`,
    );
  }
  if (opts.watch && !['COMPLETED', 'CLAIMED'].includes(workStatusName)) {
    spinner.start(info.watching(objName));
    workStatusName = await waitForWorkStatus(
      contracts.getWorkContract({ at: workAddress }).m_status,
      workStatusName,
    );
    obj = await contracts.getObjProps(objName)(workAddress);
    obj.m_statusName = workStatusName;
    spinner.succeed(
      `${objName} ${workAddress} status is ${workStatusName}, details:${prettyRPC(
        obj,
      )}`,
    );
  }
  return obj;
};

const claim = async (contracts, workAddress, userAddress, { hub } = {}) => {
  const spinner = Spinner();
  spinner.start(info.claiming(objName));

  const workObj = await show(contracts, workAddress, { print: false });

  if (!['ACTIVE', 'REVEALING'].includes(workObj.m_statusName)) {
    throw Error(
      `cannot claim a ${objName} having status: "${workObj.m_statusName}"`,
    );
  }
  if (workObj.m_requester !== userAddress) {
    throw Error(
      `cannot claim a ${objName} requested by someone else: "${
        workObj.m_requester
      }"`,
    );
  }

  const workerPoolContract = await contracts.getWorkerPoolContract({
    at: workObj.m_workerpool,
  });
  const consensuDetails = await workerPoolContract.getConsensusDetails(
    workAddress,
  );

  const now = Math.floor(Date.now() / 1000);
  const consensusTimeout = consensuDetails.c_consensusTimeout.toNumber();

  if (now < consensusTimeout) {
    throw Error(
      `cannot claim a work before reaching the consensus timeout date: "${new Date(
        1000 * consensusTimeout,
      )}"`,
    );
  }

  const hubContract = contracts.getHubContract({ at: hub });
  const claimTxHash = await hubContract.claimFailedConsensus(workAddress);

  const marketplaceAddress = await contracts.fetchMarketplaceAddress({ hub });
  const orderRPC = await contracts
    .getMarketplaceContract({ at: marketplaceAddress })
    .getMarketOrder(workObj.m_marketorderIdx);

  spinner.succeed(info.claimed(orderRPC.value.toString(), workAddress));

  return claimTxHash;
};

module.exports = {
  show,
  claim,
};
