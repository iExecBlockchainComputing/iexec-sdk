#!/usr/bin/env node

const cli = require('commander');
const init = require('./init');

cli
  .option('--repo [name]', 'git repository name')
  .action(() => init(cli.args[0], cli.repo).catch(() => process.exit(1)))
  .parse(process.argv);

init(cli.args[0], cli.repo).catch(() => process.exit(1));
