#!/usr/bin/env node

const cli = require('commander');
const account = require('./account');
const { handleError } = require('./utils');

cli
  .option('--chain, --network <name>', 'network name', 'ropsten')
  .option('--auth <auth>', 'auth server name', 'https://auth.iex.ec');

cli
  .command('login')
  .description('login into your iexec account')
  .action(() => account.login(cli.auth).catch(handleError('account')));

cli
  .command('allow <amount>')
  .description('set the nRLC allowance on iexec account')
  .action(amount =>
    account.allow(cli.network, amount).catch(handleError('account')));

cli
  .command('show')
  .description('show iexec account status')
  .action(() => account.show().catch(handleError('account')));

cli.parse(process.argv);

if (cli.args.length === 0) cli.help();
