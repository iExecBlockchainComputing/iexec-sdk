#!/usr/bin/env node

const cli = require('commander');
const submit = require('./submit');

cli
  .option('--chain, --network <name>', 'network name', 'ropsten')
  .arguments('[param]')
  .action(param => submit(cli.network, 'iexecSubmit', param).catch(() => {}))
  .parse(process.argv);

if (cli.args.length === 0) cli.help();
