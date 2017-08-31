#!/usr/bin/env babel-node

const commander = require('commander');

const packageJson = require('../package.json');

new commander.Command(packageJson.name)
  .version(packageJson.version)
  .parse(process.argv);
