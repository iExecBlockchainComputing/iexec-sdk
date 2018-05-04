#!/usr/bin/env node

const cli = require('commander');
const {
  help, handleError, info, option,
} = require('./cli-helper');
const hub = require('./hub');
const { loadChain, loadIExecConf } = require('./loader');
const { loadAddress } = require('./keystore');

const objName = 'app';

cli
  .option(...option.chain())
  .option(...option.hub())
  .option(...option.user());

cli
  .command('create')
  .description(info.createObj(objName))
  .action(async () => {
    try {
      const [chain, iexecConf] = await Promise.all([
        loadChain(cli.chain),
        loadIExecConf(),
      ]);
      await hub.createObj(objName)(
        cli.hub,
        iexecConf[objName],
        chain.contracts,
      );
    } catch (error) {
      handleError(error, objName);
    }
  });

cli
  .command('show')
  .description(info.showObj(objName))
  .arguments('<addressOrIndex>')
  .action(async (addressOrIndex) => {
    try {
      const [chain, walletAddress] = await Promise.all([
        loadChain(cli.chain),
        loadAddress(),
      ]);
      const userAddress = cli.user || walletAddress;

      await hub.showObj(objName)(
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
  .description(info.countObj(objName))
  .action(async () => {
    try {
      const [chain, walletAddress] = await Promise.all([
        loadChain(cli.chain),
        loadAddress(),
      ]);
      const userAddress = cli.user || walletAddress;

      await hub.countObj(objName)(
        cli.user,
        cli.hub,
        userAddress,
        chain.contracts,
      );
    } catch (error) {
      handleError(error, objName);
    }
  });

help(cli);
