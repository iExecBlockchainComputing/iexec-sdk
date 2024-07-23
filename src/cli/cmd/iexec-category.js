#!/usr/bin/env node

import { program as cli } from 'commander';
import {
  createCategory,
  showCategory,
  countCategory,
} from '../../common/protocol/category.js';
import {
  addGlobalOptions,
  addWalletLoadOptions,
  computeWalletLoadOptions,
  computeTxOptions,
  checkUpdate,
  handleError,
  finalizeCli,
  desc,
  option,
  Spinner,
  pretty,
  info,
} from '../utils/cli-helper.js';
import { loadIExecConf, initObj } from '../utils/fs.js';
import { loadChain, connectKeystore } from '../utils/chains.js';
import { Keystore } from '../utils/keystore.js';

const objName = 'category';

cli.name('iexec category').usage('<command> [options]');

const init = cli.command('init');
addGlobalOptions(init);
init.description(desc.initObj(objName)).action(async (opts) => {
  await checkUpdate(opts);
  const spinner = Spinner(opts);
  try {
    const { saved, fileName } = await initObj(objName);
    spinner.succeed(
      `Saved default ${objName} in "${fileName}", you can edit it:${pretty(
        saved
      )}`,
      { raw: { category: saved } }
    );
  } catch (error) {
    handleError(error, cli, opts);
  }
});

const create = cli.command('create');
addGlobalOptions(create);
addWalletLoadOptions(create);
create
  .option(...option.chain())
  .option(...option.txGasPrice())
  .option(...option.txConfirms())
  .description(desc.createObj(objName))
  .action(async (opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const walletOptions = computeWalletLoadOptions(opts);
      const txOptions = await computeTxOptions(opts);
      const keystore = Keystore(walletOptions);
      const [iexecConf, chain] = await Promise.all([
        loadIExecConf(),
        loadChain(opts.chain, { txOptions, spinner }),
      ]);
      if (!iexecConf[objName]) {
        throw Error(
          `Missing ${objName} in "iexec.json". Did you forget to run "iexec ${objName} init"?`
        );
      }
      await connectKeystore(chain, keystore, { txOptions });
      spinner.start(info.creating('category'));
      const { catid, txHash } = await createCategory(
        chain.contracts,
        iexecConf[objName]
      );
      spinner.succeed(`New category created with catid ${catid}`, {
        raw: { catid: catid.toString(), txHash },
      });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const show = cli.command('show <index>');
addGlobalOptions(show);
show
  .option(...option.chain())
  .description('show category details')
  .action(async (index, opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const chain = await loadChain(opts.chain, { spinner });
      spinner.start(info.showing('category'));
      const category = await showCategory(chain.contracts, index);
      category.workClockTimeRef = category.workClockTimeRef.toString();
      spinner.succeed(
        `Category at index ${index} details:${pretty(category)}`,
        { raw: { index, category } }
      );
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

const count = cli.command('count');
addGlobalOptions(count);
count
  .option(...option.chain())
  .description('count protocol categories')
  .action(async (opts) => {
    await checkUpdate(opts);
    const spinner = Spinner(opts);
    try {
      const chain = await loadChain(opts.chain, { spinner });
      spinner.start(info.counting('category'));
      const countBN = await countCategory(chain.contracts);
      spinner.succeed(`iExec hub has a total of ${countBN} category`, {
        raw: { count: countBN.toString() },
      });
    } catch (error) {
      handleError(error, cli, opts);
    }
  });

finalizeCli(cli);
