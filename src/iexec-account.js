#!/usr/bin/env node

const cli = require('commander');
const account = require('./account');

cli
  .option('--chain, --network <name>', 'network name', 'ropsten');

cli
  .command('login')
  .description('login into your iexec account')
  .action(() => account.login(cli.network).catch(() => {}));

cli
  .command('allow <amount>')
  .description('set the nRLC allowance on iexec account')
  .action(amount => account.allow(cli.network, amount).catch(() => {}));

cli
  .command('show')
  .description('show iexec account status')
  .action(() => account.show().catch(() => {}));

cli.parse(process.argv);

if (cli.args.length === 0) cli.help();
