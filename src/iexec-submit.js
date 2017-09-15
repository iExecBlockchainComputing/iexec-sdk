const Debug = require('debug');
const cli = require('commander');
const path = require('path');
const methods = require('./methods');
// eslint-disable-next-line
const truffleConfig = require(path.join(process.cwd(), 'truffle.js'));
// eslint-disable-next-line
const iexecConfig = require(path.join(process.cwd(), 'iexec.js'));

const debug = Debug('iexec:iexec-submit');

cli
  .option('--network [name]', 'network name', 'ropsten')
  .option('--wallet <type>', 'choose type of wallet', /^(local|remote)$/i, 'local')
  .parse(process.argv);

const network = truffleConfig.networks[cli.network];
const args = cli.args.slice(1);

debug('args', args);
methods.send(cli.wallet, network, 'submit', args).catch(error => console.log(`"iexec submit" failed with ${error}`));
