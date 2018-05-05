const Debug = require('debug');
const Promise = require('bluebird');
const fs = require('fs-extra');
const path = require('path');
const keystore = require('./keystore');
const { getChains } = require('./utils');
const { prompt } = require('./cli-helper');

const debug = Debug('iexec:fs');
const openAsync = Promise.promisify(fs.open);
const writeAsync = Promise.promisify(fs.write);
const readFileAsync = Promise.promisify(fs.readFile);
const writeFileAsync = Promise.promisify(fs.writeFile);

const IEXEC_FILE_NAME = 'iexec.json';
const CHAINS_FILE_NAME = 'chains.json';
const ACCOUNT_FILE_NAME = 'account.json';

const saveJSONToFile = async (fileName, obj, { force = false } = {}) => {
  const json = JSON.stringify(obj, null, 4);
  try {
    if (force) {
      await writeFileAsync(fileName, json);
      return fileName;
    }
    const fd = await openAsync(fileName, 'wx');
    await writeAsync(fd, json, 0, 'utf8');
    await fs.close(fd);
    return fileName;
  } catch (error) {
    if (error.code === 'EEXIST') {
      await prompt.overwrite(fileName);
      await writeFileAsync(fileName, json);
      return fileName;
    }
    debug('saveJSONToFile()', error);
    throw error;
  }
};
const saveAccountConf = (obj, options) =>
  saveJSONToFile(ACCOUNT_FILE_NAME, obj, options);

const loadJSONFile = async (fileName) => {
  try {
    const filePath = path.join(process.cwd(), fileName);
    const fileJSON = await readFileAsync(filePath);
    const file = JSON.parse(fileJSON);
    return file;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Aborting. You need "${fileName}" file to continue`);
    }
    debug('loadFile() error', error);
    throw error;
  }
};

const loadJSONAndRetry = async (fileName, options = {}) => {
  try {
    const file = await loadJSONFile(fileName, options);
    return file;
  } catch (error) {
    if (options.retry) return options.retry;
    throw error;
  }
};
const loadIExecConf = options => loadJSONAndRetry(IEXEC_FILE_NAME, options);
const loadChainsConf = options => loadJSONAndRetry(CHAINS_FILE_NAME, options);
const loadAccountConf = options => loadJSONAndRetry(ACCOUNT_FILE_NAME, options);

const loadChains = async () => {
  try {
    const [{ address }, chainsConf] = await Promise.all([
      keystore.load(),
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
  saveJSONToFile,
  saveAccountConf,
  loadJSONFile,
  loadJSONAndRetry,
  loadIExecConf,
  loadChainsConf,
  loadAccountConf,
  loadChains,
  loadChain,
};
