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
  createEncFolderPaths,
  privateKeyName,
} = require('./cli-helper');
const { Keystore } = require('./keystore');
const { loadChain, connectKeystore } = require('./chains.js');
const { stringifyNestedBn, decryptResult } = require('./utils');
const taskModule = require('./task');
const { obsTask } = require('./iexecProcess');
const { fetchTaskResults } = require('./iexecProcess');

const debug = Debug('iexec:iexec-task');
const objName = 'task';

cli.name('iexec task').usage('<command> [options]');

const show = cli.command('show <taskid>');
addGlobalOptions(show);
addWalletLoadOptions(show);
show
  .option(...option.chain())
  .option(...option.watch())
  .option(...option.download())
  .option(...option.decrypt())
  .option(...option.beneficiaryKeystoredir())
  .option(...option.beneficiaryKeyFile())
  .description(desc.showObj(objName))
  .action(async (taskid, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(
        Object.assign(walletOptions, !cmd.download && { isSigner: false }),
      );
      const chain = await loadChain(cmd.chain, {
        spinner,
      });
      if (cmd.download) {
        await connectKeystore(chain, keystore);
      }

      debug('cmd.watch', cmd.watch);
      debug('cmd.download', cmd.download);

      spinner.start(info.showing(objName));

      let taskFinalState;
      if (cmd.watch) {
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
      const taskResult = taskFinalState || (await taskModule.show(chain.contracts, taskid));
      spinner.info(`Task status ${taskResult.statusName}`);
      let resultPath;
      if (cmd.download) {
        if (taskResult.status === 3) {
          const resultFileName = cmd.download !== true ? cmd.download : taskid;

          resultPath = path.join(
            process.cwd(),
            resultFileName.length > 4
              && resultFileName.substr(resultFileName.length - 4) === '.zip'
              ? resultFileName
              : `${resultFileName}.zip`,
          );

          spinner.start(info.downloading());
          const res = await fetchTaskResults(chain.contracts, taskid, {
            ipfsGatewayURL: chain.ipfsGateway,
          });
          if (cmd.decrypt) {
            spinner.start(info.decrypting());
            const { beneficiarySecretsFolderPath } = createEncFolderPaths(cmd);
            const exists = await fs.pathExists(beneficiarySecretsFolderPath);
            if (!exists) {
              throw Error(
                'Beneficiary secrets folder is missing did you forget to run "iexec results generate-encryption-keypair"?',
              );
            }
            let beneficiaryKeyPath;
            if (cmd.beneficiaryKeyFile) {
              beneficiaryKeyPath = path.join(
                beneficiarySecretsFolderPath,
                cmd.beneficiaryKeyFile,
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
      const txOptions = await computeTxOptions(cmd);
      const chain = await loadChain(cmd.chain, { spinner });
      await connectKeystore(chain, keystore, { txOptions });

      spinner.start(info.claiming(objName));
      const txHash = await taskModule.claim(chain.contracts, taskid);
      spinner.succeed('Task successfully claimed', { raw: { txHash } });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
