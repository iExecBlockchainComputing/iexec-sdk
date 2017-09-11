const Debug = require('debug');
const path = require('path');
const util = require('util');
const { exec } = require('child_process');

const execAsync = util.promisify(exec);
const debug = Debug('iexec:truffle-cli');

const rootPath = path.resolve(__dirname, '..');
const trufflePath = path.join(rootPath, 'node_modules', 'truffle', 'build', 'cli.bundled.js');


module.exports = async function cli(args) {
  debug('args', args);
  await execAsync(`${trufflePath} ${args}`);
};
