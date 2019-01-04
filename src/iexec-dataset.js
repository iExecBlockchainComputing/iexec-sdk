#!/usr/bin/env node

const cli = require('commander');
const multiaddr = require('multiaddr');
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
const { load } = require('./keystore');
const { loadChain } = require('./chains');

const objName = 'dataset';

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
      { raw: { dataset: saved } },
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
      const datasetMultiaddrBuffer = multiaddr(iexecConf[objName].multiaddr)
        .buffer;
      const datasetToDeploy = Object.assign({}, iexecConf[objName], {
        multiaddr: datasetMultiaddrBuffer,
      });
      spinner.start(info.deploying(objName));
      const address = await hub.createObj(objName)(
        chain.contracts,
        datasetToDeploy,
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
      spinner.succeed(`${objName} ${objAddress} details:${pretty(obj)}`, {
        raw: { address: objAddress, dataset: obj },
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
