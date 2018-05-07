#!/usr/bin/env node

const cli = require('commander');
const {
  handleError,
  help,
  Spinner,
  pretty,
  desc,
  option,
} = require('./cli-helper');
const { initIExecConf, initChainConf } = require('./fs');
const packageJSON = require('../package.json');

cli.description(packageJSON.description).version(packageJSON.version);

cli.option(...option.force());

cli
  .command('init')
  .description(desc.initObj('project'))
  .action(async () => {
    const spinner = Spinner();
    try {
      const { saved, fileName } = await initIExecConf({ force: cli.force });
      spinner.info(`Here is your main config "${fileName}":${pretty(saved)}`);
      const chainRes = await initChainConf({ force: cli.force });
      spinner.info(`Here is your chain config "${chainRes.fileName}":${pretty(chainRes.saved)}`);
      spinner.succeed('iExec project is ready\n');
    } catch (error) {
      handleError(error, cli);
    }
  });

cli.command('wallet', 'manage local ethereum wallet');

cli.command('account', 'manage iExec account');

cli.command('server', 'manage server side apps and works');

cli.command('submit [param]', 'submit a job to iExec');

cli.command('result <txHash>', 'fetch the result of a job');

cli.command('upgrade', 'update iExec CLI tool and upgrade iExec project');

cli.command('app', 'manage iExec apps');

cli.command('dataset', 'manage iExec datasets');

cli.command('category', 'manage iExec categories');

cli.command('workerpool', 'manage iExec workerpools');

cli.command('market', 'manage iExec app');

help(cli);
