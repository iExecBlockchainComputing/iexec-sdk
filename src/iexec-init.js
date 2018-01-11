#!/usr/bin/env node

const cli = require('commander');
const init = require('./init');

init(cli.args[0]).catch(() => process.exit(1));
