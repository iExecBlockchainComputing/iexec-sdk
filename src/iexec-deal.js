#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const {
  help,
  addGlobalOptions,
  handleError,
  desc,
  option,
  Spinner,
  info,
  pretty,
} = require('./cli-helper');
const keystore = require('./keystore');
const { loadChain } = require('./chains.js');
const deal = require('./deal');
const hub = require('./hub');

const debug = Debug('iexec:iexec-deal');
const objName = 'deal';

const show = cli.command('show <dealid>');
addGlobalOptions(show);
show
  .option(...option.chain())
  .description(desc.showObj(objName))
  .action(async (dealid, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const chain = await loadChain(cmd.chain, spinner);

      spinner.start(info.showing(objName));
      const dealResult = await deal.show(chain.contracts, dealid);

      let claimable = false;
      const [category, finalDeadlineRatio] = await Promise.all([
        hub.showCategory(chain.contracts, dealResult.category),
        hub.getTimeoutRatio(chain.contracts),
      ]);
      const workClockTimeRef = parseInt(category.workClockTimeRef, 10);
      const startTime = parseInt(dealResult.startTime, 10);
      const consensusTimeout = startTime + workClockTimeRef * finalDeadlineRatio.toNumber();
      const consensusTimeoutDate = new Date(consensusTimeout * 1000);
      const now = Math.floor(Date.now() / 1000);
      if (
        dealResult.unsetTasksCount
          + dealResult.activeTaskCount
          + dealResult.revealingTaskCount
          > 0
        && now > consensusTimeout
      ) claimable = true;

      spinner.succeed(`Deal ${dealid} details: ${pretty(dealResult)}`, {
        raw: { deal: dealResult, claimable },
      });
      if (claimable) {
        spinner.info(
          `consensus timeout date ${consensusTimeoutDate} exceeded but consensus not reached. You can claim the deal to get a refund of uncompleted tasks using "iexec deal claim"`,
        );
      }
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const claim = cli.command('claim <dealid>');
addGlobalOptions(claim);
claim
  .option(...option.chain())
  .description(desc.claimObj(objName))
  .action(async (dealid, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const [chain, wallet] = await Promise.all([
        loadChain(cmd.chain, spinner),
        keystore.load(),
      ]);
      spinner.start(info.claiming(objName));
      const txHash = await deal.claim(chain.contracts, dealid, wallet.address);
      spinner.succeed(`${objName} successfully claimed`, { raw: { txHash } });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
