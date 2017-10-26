const Debug = require('debug');
const path = require('path');
const ora = require('ora');
const { spawn } = require('child_process');

const debug = Debug('iexec:truffle-cli');

const rootPath = path.resolve(__dirname, '..');
const trufflePath = path.join(rootPath, 'node_modules', 'truffle', 'build', 'cli.bundled.js');

const spawnAsync = (bin, args) => new Promise((resolve, reject) => {
  debug('spawnAsync bin', bin);
  debug('spawnAsync args', args);
  const proc = args ? spawn(bin, args) : spawn(bin);

  proc.stdout.on('data', data => console.log(`${data}`));
  proc.stderr.on('data', data => console.log(`${data}`));

  proc.on('close', (code) => {
    if (code !== 0) reject();
    resolve();
  });

  proc.on('exit', (code) => {
    if (code !== 0) reject();
    resolve();
  });

  proc.on('error', () => reject());
});

const run = args => spawnAsync(trufflePath, args);

const compile = async (args = []) => {
  const spinner = ora({ color: 'yellow' });
  try {
    spinner.start('Compiling contracts...');
    await run(['compile', ...args]);
    spinner.stop();
  } catch (error) {
    spinner.fail(`"iexec compile" failed with ${error}`);
    throw error;
  }
};

module.exports = {
  run,
  compile,
};
