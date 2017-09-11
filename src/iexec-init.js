const Debug = require('debug');
const path = require('path');
const util = require('util');
const { exec } = require('child_process');

const execAsync = util.promisify(exec);
const debug = Debug('iexec-init');
const rootPath = path.resolve(__dirname, '..');
const trufflePath = path.join(rootPath, 'node_modules', 'truffle', 'build', 'cli.bundled.js');

async function truffleInit() {
  const { stdout, stderr } = await execAsync(`${trufflePath} init`);
  debug('stdout:', stdout);
  debug('stderr:', stderr);
}

async function init() {
  await truffleInit();
}
init();
