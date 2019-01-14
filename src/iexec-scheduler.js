#!/usr/bin/env node

const Debug = require('debug');
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
  info,
  pretty,
} = require('./cli-helper');
const { loadAccountConf } = require('./fs');
const { loadChain } = require('./chains.js');
const { Keystore } = require('./keystore');

const debug = Debug('iexec:iexec-scheduler');
const objName = 'scheduler';

const show = cli.command('show');
addGlobalOptions(show);
addWalletLoadOptions(show);
show
  .option(...option.chain())
  .option(...option.scheduler())
  .description(desc.showObj('version', objName))
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [{ iexec, scheduler }, { jwtoken }] = await Promise.all([
        loadChain(cmd.chain, keystore, { spinner }),
        loadAccountConf(),
      ]);

      iexec.server = cmd.scheduler || iexec.server;
      if (!iexec.server) {
        throw Error(
          'missing scheduler field in chain.json or scheduler cli argument',
        );
      }

      spinner.start(info.showing('version', objName));
      debug('scheduler', scheduler);
      const cookie = await iexec.getCookieByJWT(jwtoken);
      debug('cookie', cookie);
      const res = await iexec.get('version');
      const { version } = res.xwhep.Version[0].$;

      const details = {
        version,
      };
      spinner.succeed(`scheduler ${scheduler} details:${pretty(details)}`, {
        raw: details,
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

const apiCall = cli.command('api');
addGlobalOptions(apiCall);
addWalletLoadOptions(apiCall);
apiCall
  .option(...option.chain())
  .description('direct call of scheduler API methods')
  .action(async (cmd) => {
    const spinner = Spinner(cmd);
    try {
      const walletOptions = await computeWalletLoadOptions(cmd);
      const keystore = Keystore(walletOptions);
      const [{ iexec, scheduler }, { jwtoken }] = await Promise.all([
        loadChain(cmd.chain, keystore, { spinner }),
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

      spinner.succeed(`scheduler ${scheduler} details:${pretty(res)}`, {
        raw: res,
      });
    } catch (error) {
      handleError(error, cli, cmd);
    }
  });

help(cli);
