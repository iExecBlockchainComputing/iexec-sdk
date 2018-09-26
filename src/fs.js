const Debug = require('debug');
const Promise = require('bluebird');
const fs = require('fs-extra');
const path = require('path');
const {
  validateChainsConf,
  validateWalletConf,
  validateAccountConf,
} = require('iexec-schema-validator');
const { prompt } = require('./cli-helper');
const templates = require('./templates');
const { createOrder } = require('./templates');

const debug = Debug('iexec:fs');
const openAsync = Promise.promisify(fs.open);
const writeAsync = Promise.promisify(fs.write);
const readFileAsync = Promise.promisify(fs.readFile);
const writeFileAsync = Promise.promisify(fs.writeFile);

const IEXEC_FILE_NAME = 'iexec.json';
const CHAIN_FILE_NAME = 'chain.json';
const ACCOUNT_FILE_NAME = 'account.json';
const WALLET_FILE_NAME = 'wallet.json';
const ENCRYPTED_WALLET_FILE_NAME = 'encrypted-wallet.json';
const DEPLOYED_FILE_NAME = 'deployed.json';

const saveJSONToFile = async (
  fileName,
  obj,
  { force = false, strict = true } = {},
) => {
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
      const answer = await prompt.overwrite(fileName, { strict });
      if (answer) {
        await writeFileAsync(fileName, json);
        return fileName;
      }
      return '';
    }
    debug('saveJSONToFile()', error);
    throw error;
  }
};
const saveIExecConf = (obj, options) => saveJSONToFile(IEXEC_FILE_NAME, obj, options);
const saveAccountConf = (obj, options) => saveJSONToFile(ACCOUNT_FILE_NAME, obj, options);
const saveWalletConf = (obj, options) => saveJSONToFile(WALLET_FILE_NAME, obj, options);
const saveEncryptedWalletConf = (obj, options) => saveJSONToFile(ENCRYPTED_WALLET_FILE_NAME, obj, options);
const saveDeployedConf = (obj, options) => saveJSONToFile(DEPLOYED_FILE_NAME, obj, options);
const saveChainConf = (obj, options) => saveJSONToFile(CHAIN_FILE_NAME, obj, options);

const loadJSONFile = async (fileName) => {
  const filePath = path.join(process.cwd(), fileName);
  debug('loading filePath', filePath);
  const fileJSON = await readFileAsync(filePath, 'utf8');
  const file = JSON.parse(fileJSON);
  return file;
};

const loadJSONAndRetry = async (fileName, options = {}) => {
  try {
    debug('options', options);
    const file = await loadJSONFile(fileName, options);

    if (options.validate) {
      options.validate(file);
      debug('valid', fileName);
    }
    return file;
  } catch (error) {
    debug('loadJSONAndRetry', error);

    if (error.code === 'ENOENT') {
      if (options.retry) return options.retry();
      throw new Error(
        `Missing "${fileName}" file, did you forget to run "iexec init"?`,
      );
    }
    throw new Error(`${error} in ${fileName}`);
  }
};
const loadIExecConf = options => loadJSONAndRetry(IEXEC_FILE_NAME, options);
const loadChainConf = options => loadJSONAndRetry(
  CHAIN_FILE_NAME,
  Object.assign(
    {
      validate: validateChainsConf,
    },
    options,
  ),
);
const loadAccountConf = options => loadJSONAndRetry(
  ACCOUNT_FILE_NAME,
  Object.assign(
    {
      validate: validateAccountConf,
    },
    options,
  ),
);
const loadWalletConf = options => loadJSONAndRetry(
  WALLET_FILE_NAME,
  Object.assign(
    {
      validate: validateWalletConf,
    },
    options,
  ),
);
const loadEncryptedWalletConf = options => loadJSONAndRetry(ENCRYPTED_WALLET_FILE_NAME, options);
const loadDeployedConf = options => loadJSONAndRetry(DEPLOYED_FILE_NAME, options);

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

const initOrder = async (side, overwrite) => {
  try {
    const iexecConf = await loadIExecConf();
    const order = createOrder(side, overwrite);
    if (typeof iexecConf.order !== 'object') iexecConf.order = {};
    iexecConf.order[side] = order;
    const fileName = await saveIExecConf(iexecConf, { force: true });
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
  saveEncryptedWalletConf,
  saveDeployedConf,
  saveChainConf,
  loadJSONFile,
  loadJSONAndRetry,
  loadIExecConf,
  loadChainConf,
  loadAccountConf,
  loadWalletConf,
  loadEncryptedWalletConf,
  loadDeployedConf,
  saveDeployedObj,
  initObj,
  initIExecConf,
  loadDeployedObj,
  initChainConf,
  initOrder,
};
