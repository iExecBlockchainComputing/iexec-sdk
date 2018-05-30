#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const createIExecClient = require('iexec-server-js-client');
const path = require('path');
const fs = require('fs');
const {
  help,
  handleError,
  desc,
  option,
  Spinner,
  prettyRPC,
  info,
} = require('./cli-helper');
const { loadDeployedObj, loadAccountConf } = require('./fs');
const { loadChain } = require('./chains.js');

const debug = Debug('iexec:iexec-work');
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

cli
  .command('show [address]')
  .option(...option.chain())
  .option(...option.watch())
  .option(...option.download())
  .description(desc.showObj(objName))
  .action(async (address, cmd) => {
    const spinner = Spinner();
    try {
      const [chain, deployedObj, { jwtoken }] = await Promise.all([
        loadChain(cmd.chain),
        loadDeployedObj(objName),
        loadAccountConf(),
      ]);
      debug('cmd.watch', cmd.watch);
      debug('cmd.download', cmd.download);

      const objAddress = address || deployedObj[chain.id];

      spinner.start(info.showing(objName));
      let obj = await chain.contracts.getObjProps(objName)(objAddress);
      debug('obj', obj);
      let workStatusName = statusMap[obj.m_status.toString()];
      debug('workStatusName', workStatusName);

      obj.m_statusName = workStatusName;
      spinner.succeed(`${objName} ${objAddress} status is ${workStatusName}, details:${prettyRPC(obj)}`);

      if (cmd.watch && !['COMPLETED', 'CLAIMED'].includes(workStatusName)) {
        spinner.start(info.watching(objName));
        workStatusName = await waitForWorkStatus(
          chain.contracts.getWorkContract({ at: address }).m_status,
          workStatusName,
        );
        obj = await chain.contracts.getObjProps(objName)(objAddress);
        obj.m_statusName = workStatusName;
        spinner.succeed(`${objName} ${objAddress} status is ${workStatusName}, details:${prettyRPC(obj)}`);
      }
      if (cmd.download) {
        if (workStatusName === 'COMPLETED') {
          const server = 'https://'.concat(obj.m_uri.split('/')[2]);
          debug('server', server);
          const scheduler = createIExecClient({ server });
          await scheduler.getCookieByJWT(jwtoken);

          const resultUID = scheduler.uri2uid(obj.m_uri);
          debug('resultUID', resultUID);
          const resultObj = await scheduler.getByUID(resultUID);
          const extension = scheduler
            .getFieldValue(resultObj, 'type')
            .toLowerCase();

          const resultPath = path.join(
            process.cwd(),
            address.concat('.', extension),
          );
          const resultStream = fs.createWriteStream(resultPath);
          await scheduler.downloadStream(resultUID, resultStream);
          spinner.succeed(info.downloaded(resultPath));
        } else {
          spinner.info('--download option ignored because work status is not COMPLETED');
        }
      }
    } catch (error) {
      handleError(error, cli);
    }
  });

help(cli);
