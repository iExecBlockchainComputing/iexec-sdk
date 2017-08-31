#!/usr/bin/env node

const commander = require('commander');

const packageJSON = require('../package.json');

new commander.Command(packageJSON.name)
  .version(packageJSON.version)
  .parse(process.argv);

const test = () => console.log('iExec');
test();
