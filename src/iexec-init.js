#!/usr/bin/env node

const cli = require('commander');
const init = require('./init');

cli
  .option('--repo [name]', 'git repository name')
  .arguments('<branch>')
  .action(branch => init(branch, cli.repo).catch(() => process.exit(1)))
  .parse(process.argv);

if (cli.args.length === 0) cli.help();
