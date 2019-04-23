#!/usr/bin/env node

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
const { Keystore } = require('./keystore');
const { loadChain } = require('./chains');
const {
  NULL_ADDRESS,
  isEthAddress,
  humanToMultiaddrBuffer,
} = require('./utils');

const objName = 'app';

const init = cli.command('init');
addGlobalOptions(init);
addWalletLoadOptions(init);
init.description(desc.initObj(objName)).action(async (cmd) => {
  const spinner = Spinner(cmd);
  try {
    const walletOptions = await computeWalletLoadOptions(cmd);
    const keystore = Keystore(
      Object.assign({}, walletOptions, { isSigner: false }),
    );
    const [address] = await keystore.accounts();
    const { saved, fileName } = await initObj(objName, {
      overwrite: { owner: address },
    });
    spinner.succeed(
      `Saved default ${objName} in "${fileName}", you can edit it:${pretty(
        saved,
      )}`,
      { raw: { app: saved } },
    );
  } catch (error) {
    handleError(error, cli, cmd);
  }
});

const deploy = cli.command('deploy');
addGlobalOptions(deploy);
addWalletLoadOptions(deploy);
deploy
  .option(...option.chain())
  .description(desc.deployObj(objName))
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [chain, iexecConf] = await Promise.all([
        loadChain(cmd.chain, keystore, { spinner }),
        loadIExecConf(),
      ]);
      if (!iexecConf[objName]) {
        throw Error(
          `Missing ${objName} in 'iexec.json'. Did you forget to run 'iexec ${objName} init'?`,
        );
      }
      const appMultiaddrBuffer = humanToMultiaddrBuffer(
        iexecConf[objName].multiaddr,
        { strict: false },
      );
      const appMREnclaveBuffer = Buffer.from(
        iexecConf[objName].mrenclave,
        'utf8',
      );
      const appToDeploy = Object.assign({}, iexecConf[objName], {
        multiaddr: appMultiaddrBuffer,
        mrenclave: appMREnclaveBuffer,
      });
      await keystore.load();
      spinner.start(info.deploying(objName));
      const address = await hub.createObj(objName)(
        chain.contracts,
        appToDeploy,
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
addWalletLoadOptions(show);
show
  .option(...option.chain())
  .option(...option.user())
  .description(desc.showObj(objName))
  .action(async (cliAddressOrIndex, cmd) => {
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(
        Object.assign({}, walletOptions, { isSigner: false }),
      );
      const [chain, [address], deployedObj] = await Promise.all([
        loadChain(cmd.chain, keystore, { spinner }),
        keystore.accounts(),
        loadDeployedObj(objName),
      ]);

      const addressOrIndex = cliAddressOrIndex || deployedObj[chain.id];

      const isAddress = isEthAddress(addressOrIndex, { strict: false });
      const userAddress = cmd.user || (address !== NULL_ADDRESS && address);
      if (!isAddress && !userAddress) throw Error(`Missing option ${option.user()[0]} or wallet`);

      if (!addressOrIndex) throw Error(info.missingAddress(objName));

      spinner.start(info.showing(objName));
      const { app, objAddress } = await hub.showApp(
        chain.contracts,
        addressOrIndex,
        userAddress,
      );
      spinner.succeed(`${objName} ${objAddress} details:${pretty(app)}`, {
        raw: { address: objAddress, app },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const count = cli.command('count');
addGlobalOptions(count);
addWalletLoadOptions(count);
count
  .option(...option.chain())
  .option(...option.user())
  .description(desc.countObj(objName))
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    const walletOptions = await computeWalletLoadOptions(cmd);
    const keystore = Keystore(
      Object.assign({}, walletOptions, { isSigner: false }),
    );
    try {
      const [chain, [address]] = await Promise.all([
        loadChain(cmd.chain, keystore, { spinner }),
        keystore.accounts(),
      ]);
      const userAddress = cmd.user || (address !== NULL_ADDRESS && address);
      if (!userAddress) throw Error(`Missing option ${option.user()[0]} or wallet`);
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
