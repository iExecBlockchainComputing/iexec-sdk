const Debug = require('debug');
const Promise = require('bluebird');
const fs = require('fs-extra');
const path = require('path');
const { prompt } = require('./cli-helper');
const { pretty } = require('./utils');

const debug = Debug('iexec:fs');
const openAsync = Promise.promisify(fs.open);
const writeAsync = Promise.promisify(fs.write);
const readFileAsync = Promise.promisify(fs.readFile);
const writeFileAsync = Promise.promisify(fs.writeFile);

const IEXEC_FILE_NAME = 'iexec.json';
const CHAINS_FILE_NAME = 'chains.json';
const ACCOUNT_FILE_NAME = 'account.json';
const WALLET_FILE_NAME = 'wallet.json';

const saveJSONToFile = async (fileName, obj, { force = false } = {}) => {
  const json = pretty(obj);
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
const saveWalletConf = (obj, options) =>
  saveJSONToFile(WALLET_FILE_NAME, obj, options);

const loadJSONFile = async (fileName) => {
  try {
    const filePath = path.join(process.cwd(), fileName);
    debug('loading filePath', filePath);
    const fileJSON = await readFileAsync(filePath, 'utf8');
    const file = JSON.parse(fileJSON);
    return file;
  } catch (error) {
    debug('loadFile() error', error);
    if (error.code === 'ENOENT') {
      throw new Error(`Aborting. You need "${fileName}" file to continue`);
    }
    throw error;
  }
};

const loadJSONAndRetry = (fileName, options = {}) => {
  try {
    return loadJSONFile(fileName, options);
  } catch (error) {
    debug('loadJSONAndRetry', error);
    if (options.retry) return options.retry;
    throw error;
  }
};
const loadIExecConf = options => loadJSONAndRetry(IEXEC_FILE_NAME, options);
const loadChainsConf = options => loadJSONAndRetry(CHAINS_FILE_NAME, options);
const loadAccountConf = options => loadJSONAndRetry(ACCOUNT_FILE_NAME, options);
const loadWalletConf = options => loadJSONAndRetry(WALLET_FILE_NAME, options);

module.exports = {
  saveJSONToFile,
  saveAccountConf,
  saveWalletConf,
  loadJSONFile,
  loadJSONAndRetry,
  loadIExecConf,
  loadChainsConf,
  loadAccountConf,
  loadWalletConf,
};
