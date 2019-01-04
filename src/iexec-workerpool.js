#!/usr/bin/env node

const cli = require('commander');
const {
  help,
  addGlobalOptions,
  handleError,
  desc,
  option,
  Spinner,
  pretty,
  info,
} = require('./cli-helper');
const hub = require('./hub');
const {
  loadIExecConf,
  initObj,
  saveDeployedObj,
  loadDeployedObj,
} = require('./fs');
const { strigifyNestedBn } = require('./utils');
const { load } = require('./keystore');
const { loadChain } = require('./chains');

const objName = 'workerpool';

const init = cli.command('init');
addGlobalOptions(init);
init.description(desc.initObj(objName)).action(async (cmd) => {
  const spinner = Spinner(cmd);
  try {
    const { address } = await load();
    const { saved, fileName } = await initObj(objName, {
      overwrite: { owner: address },
    });
    spinner.succeed(
      `Saved default ${objName} in "${fileName}", you can edit it:${pretty(
        saved,
      )}`,
      { raw: { workerpool: saved } },
    );
  } catch (error) {
    handleError(error, cli, cmd);
  }
});

const deploy = cli.command('deploy');
addGlobalOptions(deploy);
deploy
  .option(...option.chain())
  .description(desc.deployObj(objName))
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      const [chain, iexecConf] = await Promise.all([
        loadChain(cmd.chain, spinner),
        loadIExecConf(),
      ]);

      spinner.start(info.deploying(objName));
      const address = await hub.createObj(objName)(
        chain.contracts,
        iexecConf[objName],
      );
      spinner.succeed(`Deployed new ${objName} at address ${address}`, {
        raw: { address },
      });
      await saveDeployedObj(objName, chain.id, address);
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const show = cli.command('show [addressOrIndex]');
addGlobalOptions(show);
show
  .option(...option.chain())
  .option(...option.user())
  .description(desc.showObj(objName))
  .action(async (cliAddressOrIndex, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const [chain, { address }, deployedObj] = await Promise.all([
        loadChain(cmd.chain, spinner),
        load(),
        loadDeployedObj(objName),
      ]);

      const userAddress = cmd.user || address;
      const addressOrIndex = cliAddressOrIndex || deployedObj[chain.id];

      if (!addressOrIndex) throw Error(info.missingAddress(objName));

      spinner.start(info.showing(objName));
      const { obj, objAddress } = await hub.showObj(objName)(
        chain.contracts,
        addressOrIndex,
        userAddress,
      );
      const cleanObj = strigifyNestedBn(obj);
      spinner.succeed(`${objName} ${objAddress} details:${pretty(cleanObj)}`, {
        raw: { address: objAddress, workerpool: cleanObj },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const count = cli.command('count');
addGlobalOptions(count);
count
  .option(...option.chain())
  .option(...option.user())
  .description(desc.countObj(objName))
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      const [chain, { address }] = await Promise.all([
        loadChain(cmd.chain, spinner),
        load(),
      ]);
      const userAddress = cmd.user || address;
      spinner.start(info.counting(objName));
      const objCountBN = await hub.countObj(objName)(
        chain.contracts,
        userAddress,
      );
      spinner.succeed(
        `User ${userAddress} has a total of ${objCountBN} ${objName}`,
        { raw: { count: objCountBN.toString() } },
      );
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
