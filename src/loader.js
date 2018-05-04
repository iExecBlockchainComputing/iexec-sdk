const Debug = require('debug');
const Promise = require('bluebird');
const fs = require('fs-extra');
const path = require('path');
const keystore = require('./keystore');
const { getChains } = require('./utils');

const debug = Debug('iexec:utils');
const readFileAsync = Promise.promisify(fs.readFile);

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
    const [userWallet, chainsConf] = await Promise.all([
      keystore.load(),
      loadChainsConf(),
    ]);
    const chains = getChains(userWallet, chainsConf, keystore);
    return chains;
  } catch (error) {
    debug('loadChains()', error);
    throw error;
  }
};

module.exports = {
  loadIExecConf,
  loadChainsConf,
  loadChains,
};
