#!/usr/bin/env node

const cli = require('commander');
const { help, handleError } = require('./cli-helper');
const hub = require('./hub');
const { loadChains, loadIExecConf } = require('./loader');
const { loadAddress } = require('./keystore');

const objName = 'app';

cli
  .option('--chain <name>', 'chain name', 'ropsten')
  .option(
    '--hub <address>',
    'interact with the iExec Hub at a specific smart contract address',
  )
  .option('--user <address>', 'custom user address parameter');

cli
  .command('create')
  .description(`create a new ${objName}`)
  .action(async () => {
    try {
      const [iexecConf, chains] = await Promise.all([
        loadIExecConf(),
        loadChains(),
      ]);
      await hub.createObj(objName)(
        cli.hub,
        iexecConf[objName],
        chains[cli.chain].contracts,
      );
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('show')
  .description(`show user ${objName} details`)
  .arguments('<addressOrIndex>')
  .action(async (addressOrIndex) => {
    try {
      const [chains, walletAddress] = await Promise.all([
        loadChains(),
        loadAddress(),
      ]);
      const userAddress = cli.user || walletAddress;

      await hub.showObj(objName)(
        addressOrIndex,
        cli.hub,
        userAddress,
        chains[cli.chain].contracts,
      );
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('count')
  .description(`get user ${objName} count`)
  .action(async () => {
    try {
      const [chains, walletAddress] = await Promise.all([
        loadChains(),
        loadAddress(),
      ]);
      const userAddress = cli.user || walletAddress;

      await hub.countObj(objName)(
        cli.user,
        cli.hub,
        userAddress,
        chains[cli.chain].contracts,
      );
    } catch (error) {
      handleError(error, objName);
    }
  });

help(cli);
