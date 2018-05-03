#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const handleError = require('./errors');
const help = require('./help');
const { Spinner, loadIEXECConf, getChains } = require('./utils');

const debug = Debug('iexec:iexec-category');

cli
  .option('--chain <name>', 'network name', 'ropsten')
  .option(
    '--hub <address>',
    'interact with the iExec Hub at a custom smart contract address',
  );

cli
  .command('create')
  .description('create a new category')
  .action(async () => {
    const spinner = Spinner();
    try {
      const iexecConf = await loadIEXECConf();

      spinner.start('creating category...');
      const chain = getChains()[cli.chain];

      const txHash = await chain.contracts.createCategory(iexecConf.category, {
        hub: cli.hub,
      });

      const txReceipt = await chain.contracts.waitForReceipt(txHash);
      debug('txReceipt', txReceipt);

      const events = chain.contracts.decodeHubLogs(txReceipt.logs);
      debug('events', events);

      spinner.succeed(`new category created at index ${events[0].catid}`);
    } catch (error) {
      handleError(error, 'category', spinner);
    }
  });

cli
  .command('show')
  .description('show all details about a category')
  .arguments('<index>')
  .action(async (index) => {
    const spinner = Spinner();
    try {
      const chain = getChains()[cli.chain];

      spinner.start('fetching category...');
      const category = await chain.contracts.getCategoryByIndex(index, {
        hub: cli.hub,
      });

      spinner.succeed(`category index ${index} details:\n ${JSON.stringify(
        category,
        null,
        4,
      )}`);
    } catch (error) {
      handleError(error, 'category', spinner);
    }
  });

cli
  .command('count')
  .description('count categories')
  .action(async () => {
    const spinner = Spinner();
    try {
      const chain = getChains()[cli.chain];

      spinner.start('counting categories...');

      debug('count cat');
      const count = await chain.contracts.getHubCategoryCount({
        address: cli.hub,
      });

      spinner.succeed(`category count: ${count}`);
    } catch (error) {
      handleError(error, 'category', spinner);
    }
  });

help(cli);
