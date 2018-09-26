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

const show = async (contracts, workAddress, options) => {
  const spinner = Spinner();
  spinner.start(info.showing(objName));
  let obj = await contracts.getObjProps(objName)(workAddress);
  debug('obj', obj);
  let workStatusName = statusMap[obj.m_status.toString()];
  debug('workStatusName', workStatusName);

  obj.m_statusName = workStatusName;
  spinner.succeed(
    `${objName} ${workAddress} status is ${workStatusName}, details:${prettyRPC(
      obj,
    )}`,
  );
  if (options.watch && !['COMPLETED', 'CLAIMED'].includes(workStatusName)) {
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

module.exports = {
  show,
};
