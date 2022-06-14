#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const path = require('path');
const fs = require('fs-extra');
const { show, claim, obsTask } = require('../../common/execution/task');
const { fetchTaskResults } = require('../../common/execution/result');
const {
  fetchTaskOffchainInfo,
  fetchAllReplicatesLogs,
} = require('../../common/execution/debug');
const {
  stringifyNestedBn,
  decryptResult,
} = require('../../common/utils/utils');
const {
  finalizeCli,
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
  createEncFolderPaths,
  privateKeyName,
} = require('../utils/cli-helper');
const { Keystore } = require('../utils/keystore');
const { loadChain, connectKeystore } = require('../utils/chains');

const debug = Debug('iexec:iexec-task');
const objName = 'task';

cli.name('iexec task').usage('<command> [options]');

const showTask = cli.command('show <taskid>');
addGlobalOptions(showTask);
addWalletLoadOptions(showTask);
showTask
  .option(...option.chain())
  .option(...option.watch())
  .option(...option.download())
  .option(...option.decrypt())
  .option(...option.beneficiaryKeystoredir())
  .option(...option.beneficiaryKeyFile())
  .description(desc.showObj(objName))
  .action(async (taskid, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore(
        Object.assign(walletOptions, !opts.download && { isSigner: false }),
      );
      const chain = await loadChain(opts.chain, { spinner });
      if (opts.download) {
        await connectKeystore(chain, keystore);
      }

      debug('opts.watch', opts.watch);
      debug('opts.download', opts.download);

      spinner.start(info.showing(objName));

      let taskFinalState;
      if (opts.watch) {
        taskFinalState = await new Promise((resolve, reject) => {
          let taskState;
          obsTask(chain.contracts, taskid).subscribe({
            next: ({ task }) => {
              taskState = task;
              spinner.start(
                `${info.showing(objName)}\nTask status ${task.statusName}`,
              );
            },
            error: (e) => reject(e),
            complete: () => {
              resolve(taskState);
            },
          });
        });
      }
      const taskResult =
        taskFinalState || (await show(chain.contracts, taskid));
      spinner.info(`Task status ${taskResult.statusName}`);
      let resultPath;
      if (opts.download) {
        if (taskResult.status === 3) {
          const resultFileName =
            opts.download !== true ? opts.download : taskid;

          resultPath = path.join(
            process.cwd(),
            resultFileName.length > 4 &&
              resultFileName.substr(resultFileName.length - 4) === '.zip'
              ? resultFileName
              : `${resultFileName}.zip`,
          );

          spinner.start(info.downloading());
          const res = await fetchTaskResults(chain.contracts, taskid, {
            ipfsGatewayURL: chain.ipfsGateway,
          });
          if (opts.decrypt) {
            spinner.start(info.decrypting());
            const { beneficiarySecretsFolderPath } = createEncFolderPaths(opts);
            const exists = await fs.pathExists(beneficiarySecretsFolderPath);
            if (!exists) {
              throw Error(
                'Beneficiary secrets folder is missing did you forget to run "iexec results generate-encryption-keypair"?',
              );
            }
            let beneficiaryKeyPath;
            if (opts.beneficiaryKeyFile) {
              beneficiaryKeyPath = path.join(
                beneficiarySecretsFolderPath,
                opts.beneficiaryKeyFile,
              );
            } else {
              const [address] = await keystore.accounts();
              spinner.info(`Using beneficiary key for wallet ${address}`);
              beneficiaryKeyPath = path.join(
                beneficiarySecretsFolderPath,
                privateKeyName(address),
              );
            }
            let beneficiaryKey;
            try {
              beneficiaryKey = await fs.readFile(beneficiaryKeyPath, 'utf8');
            } catch (error) {
              debug(error);
              throw Error(
                `Failed to load beneficiary key from "${beneficiaryKeyPath}"`,
              );
            }
            const result = await decryptResult(
              await res.arrayBuffer(),
              beneficiaryKey,
            );
            await fs.writeFile(resultPath, result);
          } else {
            const stream = fs.createWriteStream(resultPath);
            await res.body.pipe(stream);
          }
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
      const raw = {
        task: cleanTask,
        claimable,
        resultPath,
      };
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
      handleError(error, cli, opts);
    }
  });

const debugTask = cli.command('debug <taskid>');
addGlobalOptions(debugTask);
addWalletLoadOptions(debugTask);
debugTask
  .option(...option.chain())
  .option('--logs', 'show application logs')
  .description(desc.debugTask())
  .action(async (taskid, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const chain = await loadChain(opts.chain, { spinner });

      if (opts.logs) {
        // Requester wallet authentiation is required to access logs
        const walletOptions = await computeWalletLoadOptions(opts);
        const keystore = Keystore(walletOptions);
        await connectKeystore(chain, keystore);
      }

      spinner.start('Fetching debug information');
      const onchainData = await show(chain.contracts, taskid);
      const offchainData = await fetchTaskOffchainInfo(
        chain.contracts,
        taskid,
      ).catch((e) => {
        spinner.warn(`Failed to fetch off-chain data: ${e.message}`);
      });

      const appLogs = opts.logs
        ? await fetchAllReplicatesLogs(chain.contracts, taskid).catch((e) => {
            spinner.warn(`Failed to fetch app logs: ${e.message}`);
          })
        : undefined;

      const raw = {
        onchainData: stringifyNestedBn(onchainData),
        offchainData,
        appLogs,
      };
      spinner.succeed(`Task ${taskid}:\n`, {
        raw,
      });
      spinner.info(`On-chain data:\n${pretty(raw.onchainData)}\n`);
      if (raw.offchainData) {
        spinner.info(`Off-chain data:\n${pretty(raw.offchainData)}`);
      }
      if (raw.appLogs && raw.appLogs.length > 0) {
        spinner.info(`App logs:\n${pretty(raw.appLogs)}`);
      }
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const claimTask = cli.command('claim <taskid>');
addGlobalOptions(claimTask);
addWalletLoadOptions(claimTask);
claimTask
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .description(desc.claimObj(objName))
  .action(async (taskid, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore(walletOptions);
      const txOptions = await computeTxOptions(opts);
      const chain = await loadChain(opts.chain, { txOptions, spinner });
      await connectKeystore(chain, keystore, { txOptions });

      spinner.start(info.claiming(objName));
      const txHash = await claim(chain.contracts, taskid);
      spinner.succeed('Task successfully claimed', { raw: { txHash } });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

finalizeCli(cli);
