#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const {
  help,
  addGlobalOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  handleError,
  desc,
  option,
  Spinner,
  info,
  pretty,
} = require('./cli-helper');
const { stringifyNestedBn } = require('./utils');
const { Keystore } = require('./keystore');
const { loadChain } = require('./chains.js');
const deal = require('./deal');

const debug = Debug('iexec:iexec-deal');
const objName = 'deal';

const show = cli.command('show <dealid>');
addGlobalOptions(show);
addWalletLoadOptions(show);
show
  .option(...option.dealTasks())
  .option(...option.chain())
  .description(desc.showObj(objName))
  .action(async (dealid, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const chain = await loadChain(cmd.chain, Keystore({ isSigner: false }), {
        spinner,
      });

      spinner.start(info.showing(objName));
      const dealResult = await deal.show(chain.contracts, dealid);

      let tasks;
      if (cmd.tasks) {
        const tasksIndex = cmd.tasks.split(',');
        const botFirst = parseInt(dealResult.botFirst, 10);
        const botSize = parseInt(dealResult.botFirst, 10);
        tasks = tasksIndex.map((i) => {
          const index = parseInt(i, 10);
          if (Number.isNaN(index) || index < 0) throw Error(`Invalid index ${i} in ${option.dealTasks()[0]}`);
          if (index >= botSize) {
            throw Error(
              `Invalid index ${index} greather than bag of tasks size (${botSize})`,
            );
          }
          const idx = botFirst + index;
          const taskid = deal.computeTaskId(dealid, idx);
          return { idx, taskid };
        });
      }
      const cleanDeal = stringifyNestedBn(dealResult);
      const tasksString = tasks ? `\nTasks: ${pretty(tasks)}` : '';
      spinner.succeed(
        `Deal ${dealid} details: ${pretty(cleanDeal)}${tasksString}`,
        {
          raw: { deal: cleanDeal, tasks },
        },
      );
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const claim = cli.command('claim <dealid>');
addGlobalOptions(claim);
addWalletLoadOptions(claim);
claim
  .option(...option.chain())
  .description(desc.claimObj(objName))
  .action(async (dealid, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [chain, [address]] = await Promise.all([
        loadChain(cmd.chain, keystore, { spinner }),
        keystore.account(),
      ]);
      spinner.start(info.claiming(objName));
      const txHash = await deal.claim(chain.contracts, dealid, address);
      spinner.succeed(`${objName} successfully claimed`, { raw: { txHash } });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
