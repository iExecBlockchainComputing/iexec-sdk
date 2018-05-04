#!/usr/bin/env node

const cli = require('commander');
const { help, handleError } = require('./cli-helper');
const hub = require('./hub');
const { loadChain, loadIExecConf } = require('./loader');
const { loadAddress } = require('./keystore');

const objName = 'dataset';

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
      const [chain, iexecConf] = await Promise.all([
        loadChain(cli.chain),
        loadIExecConf(),
      ]);
      hub.createObj(objName)(cli.hub, iexecConf[objName], chain.contracts);
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
      const [chain, walletAddress] = await Promise.all([
        loadChain(cli.chain),
        loadAddress(),
      ]);
      const userAddress = cli.user || walletAddress;

      hub.showObj(objName)(
        addressOrIndex,
        cli.hub,
        userAddress,
        chain.contracts,
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
      const [chain, walletAddress] = await Promise.all([
        loadChain(cli.chain),
        loadAddress(),
      ]);
      const userAddress = cli.user || walletAddress;

      hub.countObj(objName)(cli.user, cli.hub, userAddress, chain.contracts);
    } catch (error) {
      handleError(error, objName);
    }
  });

help(cli);
