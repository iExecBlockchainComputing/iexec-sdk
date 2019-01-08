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
const { stringifyNestedBn } = require('./utils');
const keystore = require('./keystore');
const { loadChain } = require('./chains.js');
const deal = require('./deal');

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

      const cleanDeal = stringifyNestedBn(dealResult);
      spinner.succeed(`Deal ${dealid} details: ${pretty(cleanDeal)}`, {
        raw: { deal: cleanDeal },
      });
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
