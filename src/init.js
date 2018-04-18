const Debug = require('debug');
const Promise = require('bluebird');
const { exec } = require('child_process');
const cli = require('commander');
const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const oraOptions = require('./oraOptions');
const packageJSON = require('../package.json');

const execAsync = Promise.promisify(exec);
const debug = Debug('iexec:init');
const readFileAsync = Promise.promisify(fs.readFile);
const openAsync = Promise.promisify(fs.open);
const writeAsync = Promise.promisify(fs.write);

const IEXEC_SAMPLES_REPO =
  'https://github.com/iExecBlockchainComputing/iexec-dapp-samples.git';
const TRUFFLE_FILE_NAME = 'truffle.js';

cli.parse(process.argv);

async function init(branchName = 'init', repoURL = IEXEC_SAMPLES_REPO) {
  const spinner = ora(oraOptions);
  try {
    debug(`pulling ${branchName} from ${repoURL}...`);
    spinner.start(`pulling ${branchName}...`);
    const dirName = 'iexec-'.concat(branchName);
    const projectFolder = path.join(process.cwd(), dirName);
    const isProjectExists = await fs.pathExists(projectFolder);

    if (isProjectExists) {
      throw Error(`"${dirName}" directory already exists. Consider renaming it before running "iexec init"`);
    }

    await execAsync(`git clone --depth=1 -b ${branchName} ${repoURL} ${dirName}`);
    await fs.remove(path.join(process.cwd(), dirName, '.git'));
    const truffleConfig = await readFileAsync(
      path.join(__dirname, TRUFFLE_FILE_NAME),
      'utf8',
    );

    const trufflePath = path.join(process.cwd(), dirName, TRUFFLE_FILE_NAME);
    const fd = await openAsync(trufflePath, 'wx').catch(() => undefined);
    if (fd !== undefined) {
      debug('writing new truffle.js file');
      await writeAsync(fd, truffleConfig, 0, 'utf8');
      fs.close(fd);
    }

    process.chdir(dirName);
    debug(
      'running',
      `npm i --save-exact iexec-oracle-contract@${
        packageJSON.dependencies['iexec-oracle-contract']
      }`,
    );
    await execAsync(`npm i --save-exact iexec-oracle-contract@${
      packageJSON.dependencies['iexec-oracle-contract']
    }`);
    await execAsync('npm i');
    spinner.succeed(`"${dirName}" folder created, your new iexec project is inside`);
    return branchName;
  } catch (error) {
    spinner.fail(`"iexec init" failed with ${error}`);
    throw error;
  }
}

module.exports = init;
