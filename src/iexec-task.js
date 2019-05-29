#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const path = require('path');
const fs = require('fs-extra');
const {
  help,
  addGlobalOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  computeTxOptions,
  handleError,
  desc,
  option,
  Spinner,
  info,
  pretty,
} = require('./cli-helper');
const { Keystore } = require('./keystore');
const { loadChain } = require('./chains.js');
const { stringifyNestedBn } = require('./utils');
const task = require('./task');

const debug = Debug('iexec:iexec-task');
const objName = 'task';

const show = cli.command('show <taskid>');
addGlobalOptions(show);
addWalletLoadOptions(show);
show
  .option(...option.chain())
  .option(...option.watch())
  .option(...option.download())
  .description(desc.showObj(objName))
  .action(async (taskid, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(
        Object.assign(walletOptions, !cmd.download && { isSigner: false }),
      );
      const chain = await loadChain(cmd.chain, keystore, {
        spinner,
      });
      let userAddress;
      if (cmd.download) {
        const { address } = await keystore.load();
        userAddress = address;
      }

      debug('cmd.watch', cmd.watch);
      debug('cmd.download', cmd.download);

      if (cmd.watch) {
        const waitCompletedOrClaimed = async (initialStatus) => {
          spinner.start(info.watching(objName));
          const { status, statusName } = await task.waitForTaskStatusChange(
            chain.contracts,
            taskid,
            initialStatus,
          );
          spinner.info(`Task status ${statusName}`);
          if (['FAILED', 'COMPLETED'].includes(task.TASK_STATUS_MAP[status])) {
            return { status, statusName };
          }
          return waitCompletedOrClaimed(status);
        };
        await waitCompletedOrClaimed('');
      }

      spinner.start(info.showing(objName));
      const taskResult = await task.show(chain.contracts, taskid);

      let claimable = false;
      const consensusTimeout = parseInt(taskResult.finalDeadline, 10);
      const consensusTimeoutDate = new Date(consensusTimeout * 1000);
      const now = Math.floor(Date.now() / 1000);
      if (
        ['UNSET', 'ACTIVE', 'REVEALING'].includes(
          task.TASK_STATUS_MAP[taskResult.status],
        )
        && now > consensusTimeout
      ) claimable = true;

      let resultPath;
      if (cmd.download) {
        if (task.TASK_STATUS_MAP[taskResult.status] === 'COMPLETED') {
          spinner.start(info.downloading());
          const { body } = await task.fetchResults(
            chain.contracts,
            taskid,
            userAddress,
            { ipfsGatewayURL: chain.ipfsGateway },
          );
          const resultFileName = cmd.download !== true ? cmd.download : taskid;
          resultPath = path.join(process.cwd(), `${resultFileName}.zip`);
          const stream = fs.createWriteStream(resultPath);
          await body.pipe(stream);
        } else {
          spinner.info(
            `Task status is not COMPLETED, option ${
              option.download()[0]
            } will be ignored`,
          );
        }
      }

      const cleanTask = stringifyNestedBn(taskResult);
      const raw = Object.assign(
        { task: cleanTask },
        { claimable },
        { resultPath },
      );
      spinner.succeed(`Task ${taskid} details: ${pretty(cleanTask)}`, {
        raw,
      });
      if (resultPath) {
        spinner.info(info.downloaded(resultPath));
      }
      if (claimable) {
        spinner.info(
          `Consensus timeout date ${consensusTimeoutDate} exceeded but consensus not reached. You can claim the work to get a full refund using "iexec task claim"`,
        );
      }
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const claim = cli.command('claim <taskid>');
addGlobalOptions(claim);
addWalletLoadOptions(claim);
claim
  .option(...option.chain())
  .option(...option.txGasPrice())
  .description(desc.claimObj(objName))
  .action(async (taskid, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);
      const txOptions = computeTxOptions(cmd);
      const [chain, wallet] = await Promise.all([
        loadChain(cmd.chain, keystore, { spinner, txOptions }),
        keystore.load(),
      ]);
      spinner.start(info.claiming(objName));
      const txHash = await task.claim(chain.contracts, taskid, wallet.address);
      spinner.succeed(`${objName} successfully claimed`, { raw: { txHash } });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
