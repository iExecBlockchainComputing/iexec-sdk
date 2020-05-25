#!/usr/bin/env node

const cli = require('commander');
const hub = require('./hub');
const {
  addGlobalOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  computeTxOptions,
  checkUpdate,
  handleError,
  help,
  desc,
  option,
  Spinner,
  pretty,
  info,
} = require('./cli-helper');
const { loadIExecConf, initObj } = require('./fs');
const { loadChain } = require('./chains.js');
const { Keystore } = require('./keystore');

const objName = 'category';

const init = cli.command('init');
addGlobalOptions(init);
init.description(desc.initObj(objName)).action(async (cmd) => {
  await checkUpdate(cmd);
  const spinner = Spinner(cmd);
  try {
    const { saved, fileName } = await initObj(objName);
    spinner.succeed(
      `Saved default ${objName} in "${fileName}", you can edit it:${pretty(
        saved,
      )}`,
      { raw: { category: saved } },
    );
  } catch (error) {
    handleError(error, cli, cmd);
  }
});

const create = cli.command('create');
addGlobalOptions(create);
addWalletLoadOptions(create);
create
  .option(...option.chain())
  .option(...option.txGasPrice())
  .description(desc.createObj(objName))
  .action(async (cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const txOptions = computeTxOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [iexecConf, chain] = await Promise.all([
        loadIExecConf(),
        loadChain(cmd.chain, keystore, { spinner, txOptions }),
      ]);
      if (!iexecConf[objName]) {
        throw Error(
          `Missing ${objName} in "iexec.json". Did you forget to run "iexec ${objName} init"?`,
        );
      }
      await keystore.load();
      spinner.start(info.creating('category'));
      const { catid, txHash } = await hub.createCategory(
        chain.contracts,
        iexecConf[objName],
      );
      spinner.succeed(`New category created with catid ${catid}`, {
        raw: { catid: catid.toString(), txHash },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const show = cli.command('show <index>');
addGlobalOptions(show);
show
  .option(...option.chain())
  .description(desc.showObj(objName, 'hub'))
  .action(async (index, cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const chain = await loadChain(cmd.chain, Keystore({ isSigner: false }), {
        spinner,
      });
      spinner.start(info.showing('category'));
      const category = await hub.showCategory(chain.contracts, index);
      category.workClockTimeRef = category.workClockTimeRef.toString();
      spinner.succeed(
        `Category at index ${index} details:${pretty(category)}`,
        { raw: { index, category } },
      );
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const count = cli.command('count');
addGlobalOptions(count);
count
  .option(...option.chain())
  .description(desc.showObj(objName, 'hub'))
  .action(async (cmd) => {
    await checkUpdate(cmd);
    const spinner = Spinner(cmd);
    try {
      const chain = await loadChain(cmd.chain, Keystore({ isSigner: false }), {
        spinner,
      });
      spinner.start(info.counting('category'));
      const countBN = await hub.countCategory(chain.contracts);
      spinner.succeed(`iExec hub has a total of ${countBN} category`, {
        raw: { count: countBN.toString() },
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
