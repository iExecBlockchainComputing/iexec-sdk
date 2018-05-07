const Debug = require('debug');
const Promise = require('bluebird');
const fs = require('fs-extra');
const path = require('path');
const { prompt } = require('./cli-helper');
const templates = require('./templates');
const { createOrder, assignOrder } = require('./templates');

const debug = Debug('iexec:fs');
const openAsync = Promise.promisify(fs.open);
const writeAsync = Promise.promisify(fs.write);
const readFileAsync = Promise.promisify(fs.readFile);
const writeFileAsync = Promise.promisify(fs.writeFile);

const IEXEC_FILE_NAME = 'iexec.json';
const CHAIN_FILE_NAME = 'chain.json';
const ACCOUNT_FILE_NAME = 'account.json';
const WALLET_FILE_NAME = 'wallet.json';
const DEPLOYED_FILE_NAME = 'deployed.json';

const saveJSONToFile = async (fileName, obj, { force = false } = {}) => {
  const json = JSON.stringify(obj, null, 2);
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
const saveIExecConf = (obj, options) =>
  saveJSONToFile(IEXEC_FILE_NAME, obj, options);
const saveAccountConf = (obj, options) =>
  saveJSONToFile(ACCOUNT_FILE_NAME, obj, options);
const saveWalletConf = (obj, options) =>
  saveJSONToFile(WALLET_FILE_NAME, obj, options);
const saveDeployedConf = (obj, options) =>
  saveJSONToFile(DEPLOYED_FILE_NAME, obj, options);
const saveChainConf = (obj, options) =>
  saveJSONToFile(CHAIN_FILE_NAME, obj, options);

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
      throw new Error(`Missing "${fileName}" file, did you forget to run "iexec init"?`);
    }
    throw error;
  }
};

const loadJSONAndRetry = async (fileName, options = {}) => {
  try {
    const file = await loadJSONFile(fileName, options);
    return file;
  } catch (error) {
    debug('loadJSONAndRetry', error);
    if (options.retry) return options.retry();
    throw error;
  }
};
const loadIExecConf = options => loadJSONAndRetry(IEXEC_FILE_NAME, options);
const loadChainConf = options => loadJSONAndRetry(CHAIN_FILE_NAME, options);
const loadAccountConf = options => loadJSONAndRetry(ACCOUNT_FILE_NAME, options);
const loadWalletConf = options => loadJSONAndRetry(WALLET_FILE_NAME, options);
const loadDeployedConf = options =>
  loadJSONAndRetry(DEPLOYED_FILE_NAME, options);

const initIExecConf = async (options) => {
  const iexecConf = Object.assign(templates.main, { app: templates.app });
  const fileName = await saveIExecConf(iexecConf, options);
  return { saved: iexecConf, fileName };
};

const initChainConf = async (options) => {
  const fileName = await saveChainConf(templates.chains, options);
  return { saved: templates.chains, fileName };
};

const initObj = async (objName, { obj } = {}) => {
  try {
    const iexecConf = await loadIExecConf();
    iexecConf[objName] = obj || templates[objName];
    const fileName = await saveIExecConf(iexecConf, { force: true });
    return { saved: iexecConf[objName], fileName };
  } catch (error) {
    debug('initObj()', error);
    throw error;
  }
};

const initOrder = async (side) => {
  try {
    const iexecConf = await loadIExecConf();
    const order = createOrder(side);
    const newIExecConf = assignOrder(iexecConf, order);
    const fileName = await saveIExecConf(newIExecConf, { force: true });
    return { saved: order, fileName };
  } catch (error) {
    debug('initOrder()', error);
    throw error;
  }
};

const saveDeployedObj = async (objName, chainID, address) => {
  try {
    const deployedConf = await loadDeployedConf({ retry: () => ({}) });
    debug('deployedConf', deployedConf);

    if (typeof deployedConf[objName] !== 'object') deployedConf[objName] = {};
    deployedConf[objName][chainID] = address;

    await saveDeployedConf(deployedConf, { force: true });
  } catch (error) {
    debug('saveDeployedObj()', error);
    throw error;
  }
};

const loadDeployedObj = async (objName) => {
  const deployedConf = await loadDeployedConf({ retry: () => ({}) });

  if (typeof deployedConf[objName] !== 'object') return {};
  return deployedConf[objName];
};

module.exports = {
  saveJSONToFile,
  saveAccountConf,
  saveWalletConf,
  saveDeployedConf,
  saveChainConf,
  loadJSONFile,
  loadJSONAndRetry,
  loadIExecConf,
  loadChainConf,
  loadAccountConf,
  loadWalletConf,
  loadDeployedConf,
  saveDeployedObj,
  initObj,
  initIExecConf,
  loadDeployedObj,
  initChainConf,
  initOrder,
};
