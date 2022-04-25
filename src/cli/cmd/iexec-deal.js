#!/usr/bin/env node

const cli = require('commander');
const { show, obsDeal, claim } = require('../../common/execution/deal');
const { stringifyNestedBn } = require('../../common/utils/utils');
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
  renderTasksStatus,
} = require('../utils/cli-helper');
const { Keystore } = require('../utils/keystore');
const { loadChain, connectKeystore } = require('../utils/chains');

const objName = 'deal';

cli.name('iexec deal').usage('<command> [options]');

const showDeal = cli.command('show <dealid>');
addGlobalOptions(showDeal);
addWalletLoadOptions(showDeal);
showDeal
  .option(...option.chain())
  .option(...option.watch())
  .description(desc.showObj(objName))
  .action(async (dealid, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const chain = await loadChain(opts.chain, { spinner });
      let result;
      if (opts.watch) {
        const waitDealFinalState = () =>
          new Promise((resolve, reject) => {
            let dealState;
            obsDeal(chain.contracts, dealid).subscribe({
              next: (data) => {
                dealState = data;
                spinner.start(
                  `Watching execution...\n${renderTasksStatus(data.tasks)}`,
                );
              },
              error: reject,
              complete: () => {
                const tasks = Object.values(stringifyNestedBn(dealState.tasks));
                const failedTasks = tasks.filter((task) => task.taskTimedOut);
                resolve({
                  tasksCount: dealState.tasksCount,
                  completedTasksCount: dealState.completedTasksCount,
                  failedTasksCount: dealState.failedTasksCount,
                  deal: stringifyNestedBn(dealState.deal),
                  tasks,
                  failedTasks,
                });
              },
            });
          });
        result = await waitDealFinalState();

        const dealStatus =
          result.failedTasksCount > 0 ? 'TIMEOUT' : 'COMPLETED';
        spinner.stop();
        spinner.info(
          `Deal status ${dealStatus}\n${renderTasksStatus(result.tasks, {
            detailed: true,
          })}`,
        );
      } else {
        spinner.start(info.showing(objName));
        const dealResult = await show(chain.contracts, dealid);
        result = {
          deal: stringifyNestedBn(dealResult),
        };
      }

      spinner.succeed(`Deal ${dealid} details: ${pretty(result.deal)}`, {
        raw: result,
      });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const claimDeal = cli.command('claim <dealid>');
addGlobalOptions(claimDeal);
addWalletLoadOptions(claimDeal);
claimDeal
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .description(desc.claimObj(objName))
  .action(async (dealid, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = await computeWalletLoadOptions(opts);
      const keystore = Keystore(walletOptions);
      const txOptions = await computeTxOptions(opts);
      const chain = await loadChain(opts.chain, { txOptions, spinner });
      await connectKeystore(chain, keystore, { txOptions });
      spinner.start(info.claiming(objName));
      const { claimed, transactions } = await claim(chain.contracts, dealid);
      spinner.succeed(
        `Deal successfully claimed (${
          Object.keys(claimed).length
        } tasks claimed)`,
        { raw: { claimed, transactions } },
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

finalizeCli(cli);
