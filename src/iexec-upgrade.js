#!/usr/bin/env node

const cli = require('commander');
const upgrade = require('./upgrade');

cli.parse(process.argv);

upgrade().catch(() => process.exit(1));
