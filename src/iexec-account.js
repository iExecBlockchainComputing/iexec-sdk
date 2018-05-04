#!/usr/bin/env node

const cli = require('commander');
const account = require('./account');
const hub = require('./hub');
const {
  help, handleError, option, desc,
} = require('./cli-helper');

const objName = 'account';

cli
  .option(...option.chain())
  .option(...option.auth())
  .option(...option.hub())
  .option(...option.user());

cli
  .command('login')
  .description(desc.login())
  .action(() => account.login(cli.auth).catch(handleError('account')));

cli
  .command('deposit <amount>')
  .description(desc.deposit())
  .action(amount =>
    account.allow(cli.network, amount).catch(handleError('account')));

cli
  .command('show')
  .description(desc.showObj('iExec', objName))
  .action(() =>
    hub
      .checkBalance(cli.network, cli.hub, cli.user)
      .catch(handleError('account')));

help(cli);
