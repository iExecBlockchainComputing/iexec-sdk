#!/usr/bin/env node

const Debug = require('debug');
const cli = require('commander');
const server = require('./server');

const debug = Debug('iexec:iexec-server');

cli
  .option('--chain, --network <name>', 'network name', 'ropsten')
  .option('--app <appUID>', 'appUID used in job submit')
  .option('--save', 'save the result of a work to a file')
  .option('--watch', 'watch the status of a work until COMPLETED');

cli
  .command('deploy [appName]')
  .description('send app to iexec server, app binary must be located inside /apps')
  .action(appName => server.deploy(cli.network, appName).catch(() => process.exit(1)));

cli
  .command('uploadData [dataPath]')
  .description('upload data with its description')
  .action(dataPath => server.uploadData(cli.network, dataPath).catch(() => process.exit(1)));

cli
  .command('submit')
  .description('directly submit a work to iExec server')
  .action(() => server.submit(cli.network, cli.app).catch(() => process.exit(1)));

cli
  .command('result')
  .arguments('<workUID>')
  .description('get result of a work from iExec server using work UID')
  .action(workUID =>
    server.result(workUID, cli.network, cli.save, cli.watch).catch(() => process.exit(1)));

cli.parse(process.argv);

debug('cli.args.length', cli.args.length);
if (cli.args.length === 0) cli.help();
