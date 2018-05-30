#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const {
  help,
  handleError,
  desc,
  option,
  Spinner,
  info,
  pretty,
} = require('./cli-helper');
const { loadAccountConf } = require('./fs');
const { loadChain } = require('./chains.js');

const debug = Debug('iexec:iexec-work');
const objName = 'scheduler';

cli
  .command('show')
  .option(...option.chain())
  .description(desc.showObj('version', objName))
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      const [{ iexec, scheduler }, { jwtoken }] = await Promise.all([
        loadChain(cmd.chain),
        loadAccountConf(),
      ]);
      spinner.start(info.showing('version', objName));
      debug('scheduler', scheduler);
      const cookie = await iexec.getCookieByJWT(jwtoken);
      debug('cookie', cookie);
      const res = await iexec.get('version');
      const { version } = res.xwhep.Version[0].$;

      const details = {
        version,
      };
      spinner.succeed(`scheduler ${scheduler} details:${pretty(details)}`);
    } catch (error) {
      handleError(error, cli);
    }
  });

cli
  .command('api')
  .option(...option.chain())
  .description('direct call of scheduler API methods')
  .action(async (cmd) => {
    const spinner = Spinner();
    try {
      const [{ iexec, scheduler }, { jwtoken }] = await Promise.all([
        loadChain(cmd.chain),
        loadAccountConf(),
      ]);

      const fnName = cli.args[0];
      const fnArgs = cli.args.slice(1, cli.args.length - 1);
      debug('fnName', fnName);
      debug('fnArgs', fnArgs);
      const methodName = fnName.concat('(', fnArgs.join(', '), ')');
      spinner.start(`calling ${methodName} on iExec scheduler ${scheduler}...`);

      const cookie = await iexec.getCookieByJWT(jwtoken);
      debug('cookie', cookie);

      const res = await iexec[fnName](...fnArgs);

      spinner.succeed(`scheduler ${scheduler} details:${pretty(res)}`);
    } catch (error) {
      handleError(error, cli);
    }
  });

help(cli);
