#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const {
  help,
  handleError,
  desc,
  option,
  Spinner,
  prettyRPC,
  info,
} = require('./cli-helper');
const { loadDeployedObj } = require('./fs');
const { loadChain } = require('./chains.js');

const debug = Debug('iexec:iexec-work');
const objName = 'work';

cli
  .command('show [address]')
  .option(...option.chain())
  .description(desc.showObj(objName))
  .action(async (address, cmd) => {
    const spinner = Spinner();
    try {
      const [chain, deployedObj] = await Promise.all([
        loadChain(cmd.chain),
        loadDeployedObj(objName),
      ]);

      const objAddress = address || deployedObj[chain.id];

      spinner.start(info.showing(objName));
      const obj = await chain.contracts.getObjProps(objName)(objAddress);
      debug('obj', obj);
      spinner.succeed(`${objName} ${objAddress} details:${prettyRPC(obj)}`);
    } catch (error) {
      handleError(error, cli);
    }
  });

help(cli);
