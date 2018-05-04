const Debug = require('debug');
const Promise = require('bluebird');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const keystore = require('./keystore');
const { getChains } = require('./utils');

const debug = Debug('iexec:utils');
const openAsync = Promise.promisify(fs.open);
const writeAsync = Promise.promisify(fs.write);
const readFileAsync = Promise.promisify(fs.readFile);
const writeFileAsync = Promise.promisify(fs.writeFile);

const saveJSON = async (
  fileName,
  userWallet,
  { force = false, message = 'overwrite?' } = {},
) => {
  const userJSONWallet = JSON.stringify(userWallet, null, 4);
  try {
    if (force) {
      await writeFileAsync(fileName, userJSONWallet);
      return fileName;
    }
    const fd = await openAsync(fileName, 'wx');
    await writeAsync(fd, userJSONWallet, 0, 'utf8');
    await fs.close(fd);
    return fileName;
  } catch (error) {
    if (error.code === 'EEXIST') {
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message,
        },
      ]);
      if (answers.overwrite) {
        await writeFileAsync(fileName, userJSONWallet);
        return fileName;
      }
      throw Error('Aborted by user. keeping old wallet');
    }
    debug('save() error', error);
    throw error;
  }
};

const loadJSONFile = async (fileName) => {
  try {
    const filePath = path.join(process.cwd(), fileName);
    const fileJSON = await readFileAsync(filePath);
    const file = JSON.parse(fileJSON);
    debug(fileName, file);
    return file;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Aborting. You need "${fileName}" config file to continue`);
    }
    debug('loadFile() error', error);
    throw error;
  }
};
const loadIExecConf = () => loadJSONFile('iexec.json');
const loadChainsConf = () => loadJSONFile('chains.json');

const loadChains = async () => {
  try {
    const [address, chainsConf] = await Promise.all([
      keystore.loadAddress(),
      loadChainsConf(),
    ]);
    const chains = getChains(address, chainsConf, keystore);
    return chains;
  } catch (error) {
    debug('loadChains()', error);
    throw error;
  }
};

const loadChain = async (chainName) => {
  try {
    const chains = await loadChains();
    return chains[chainName];
  } catch (error) {
    debug('loadChain()', error);
    throw error;
  }
};

module.exports = {
  saveJSON,
  loadIExecConf,
  loadChainsConf,
  loadChain,
  loadChains,
};
