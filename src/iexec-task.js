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
  checkUpdate,
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
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(
        Object.assign(walletOptions, !cmd.download && { isSigner: false }),
      );
      const chain = await loadChain(cmd.chain, keystore, {
        spinner,
      });
      if (cmd.download) {
        await keystore.load();
      }

      debug('cmd.watch', cmd.watch);
      debug('cmd.download', cmd.download);

      if (cmd.watch) {
        const waitFinalStatus = async (initialStatus = '') => {
          spinner.start(info.watching(objName));
          const {
            status,
            statusName,
            taskTimedOut,
          } = await task.waitForTaskStatusChange(
            chain.contracts,
            taskid,
            initialStatus,
          );
          spinner.info(`Task status ${statusName}`);
          if ([3, 4].includes(status) || taskTimedOut) {
            return { status, statusName, taskTimedOut };
          }
          return waitFinalStatus(status);
        };
        await waitFinalStatus();
      }

      spinner.start(info.showing(objName));
      const taskResult = await task.show(chain.contracts, taskid);

      let resultPath;
      if (cmd.download) {
        if (taskResult.status === 3) {
          spinner.start(info.downloading());
          const { body } = await task.fetchResults(chain.contracts, taskid, {
            ipfsGatewayURL: chain.ipfsGateway,
          });
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

      const claimable = taskResult.status < 3 && !!taskResult.taskTimedOut;

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
          'Consensus deadline reached before consensus. You can claim the task to get a full refund using "iexec task claim"',
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
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);
      const txOptions = computeTxOptions(cmd);
      const [chain] = await Promise.all([
        loadChain(cmd.chain, keystore, { spinner, txOptions }),
        keystore.load(),
      ]);
      spinner.start(info.claiming(objName));
      const txHash = await task.claim(chain.contracts, taskid);
      spinner.succeed(`${objName} successfully claimed`, { raw: { txHash } });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
