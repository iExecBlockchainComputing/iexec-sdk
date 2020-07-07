const Debug = require('debug');
const fs = require('fs-extra');
const path = require('path');
const JSZip = require('jszip');
const { object, string, boolean } = require('yup');
const { addressSchema, chainIdSchema } = require('./validator');
const { prompt, info } = require('./cli-helper');
const templates = require('./templates');

const debug = Debug('iexec:fs');

const chainConfSchema = () => object({
  id: chainIdSchema().required(),
  host: string(),
  hub: string(),
  sms: string(),
  resultProxy: string(),
  ipfsGateway: string(),
  iexecGateway: string(),
  native: boolean(),
  bridge: object({
    bridgedChainId: chainIdSchema().required(),
    contract: addressSchema().required(),
  })
    .notRequired()
    .strict(),
})
  .noUnknown(true, 'Unknown key "${unknown}"')
  .strict();

const chainsConfSchema = () => object({
  default: string(),
  chains: object()
    .test(async (chains) => {
      await Promise.all(
        Object.entries({ ...chains }).map(async ([name, chain]) => {
          await string().validate(name, { strict: true });
          await chainConfSchema().validate(chain, { strict: true });
        }),
      );
      return true;
    })
    .required(),
})
  .noUnknown(true, 'Unknown key "${unknown}"')
  .strict();

const deployedObjSchema = () => object().test(async (obj) => {
  await Promise.all(
    Object.entries({ ...obj }).map(async ([chainId, address]) => {
      await chainIdSchema().validate(chainId, { strict: true });
      await addressSchema().validate(address, { strict: true });
    }),
  );
  return true;
});

const deployedConfSchema = () => object({
  app: deployedObjSchema().notRequired(),
  dataset: deployedObjSchema().notRequired(),
  workerpool: deployedObjSchema().notRequired(),
})
  .noUnknown(true, 'Unknown key "${unknown}"')
  .strict();

const IEXEC_FILE_NAME = 'iexec.json';
const CHAIN_FILE_NAME = 'chain.json';
const WALLET_FILE_NAME = 'wallet.json';
const ENCRYPTED_WALLET_FILE_NAME = 'encrypted-wallet.json';
const DEPLOYED_FILE_NAME = 'deployed.json';
const ORDERS_FILE_NAME = 'orders.json';

const saveTextToFile = async (
  fileName,
  text,
  { force = false, strict = true, fileDir } = {},
) => {
  try {
    let filePath;
    if (fileDir) {
      await fs.ensureDir(fileDir);
      filePath = path.join(fileDir, fileName);
    } else {
      filePath = fileName;
    }
    if (force) {
      await fs.writeFile(filePath, text);
      return filePath;
    }
    const fd = await fs.open(filePath, 'wx');
    await fs.write(fd, text, 0, 'utf8');
    await fs.close(fd);
    return filePath;
  } catch (error) {
    if (error.code === 'EEXIST') {
      const answer = await prompt.overwrite(fileName, { strict });
      if (answer) {
        let filePath;
        if (fileDir) {
          filePath = path.join(fileDir, fileName);
        } else {
          filePath = fileName;
        }
        await fs.writeFile(filePath, text);
        return filePath;
      }
      return '';
    }
    debug('saveTextToFile()', error);
    throw error;
  }
};

const saveJSONToFile = async (
  fileName,
  obj,
  { force = false, strict = true, fileDir } = {},
) => {
  try {
    const json = JSON.stringify(obj, null, 2);
    const filePath = await saveTextToFile(fileName, json, {
      force,
      strict,
      fileDir,
    });
    return filePath;
  } catch (error) {
    debug('saveJSONToFile()', error);
    throw error;
  }
};

const saveWallet = (obj, deflautFileName, options) => {
  const fileName = options.walletName || deflautFileName;
  return saveJSONToFile(fileName, obj, options);
};
const saveWalletConf = (obj, options) => saveWallet(obj, WALLET_FILE_NAME, options);
const saveEncryptedWalletConf = (obj, options) => saveWallet(obj, ENCRYPTED_WALLET_FILE_NAME, options);

const saveIExecConf = (obj, options) => saveJSONToFile(IEXEC_FILE_NAME, obj, options);
const saveDeployedConf = (obj, options) => saveJSONToFile(DEPLOYED_FILE_NAME, obj, options);
const saveChainConf = (obj, options) => saveJSONToFile(CHAIN_FILE_NAME, obj, options);
const saveSignedOrders = (obj, options) => saveJSONToFile(ORDERS_FILE_NAME, obj, options);

const loadJSONFile = async (fileName, { fileDir } = {}) => {
  let filePath;
  if (fileDir) {
    filePath = path.join(fileDir, fileName);
  } else {
    filePath = path.join(process.cwd(), fileName);
  }
  debug('loading filePath', filePath);
  const fileJSON = await fs.readFile(filePath, 'utf8');
  const file = JSON.parse(fileJSON);
  return file;
};

const loadJSONAndRetry = async (fileName, options = {}) => {
  try {
    debug('options', options);
    const file = await loadJSONFile(fileName, options);
    if (options.validationSchema) {
      await options.validationSchema().validate(file, { strict: true });
      debug('valid', fileName);
    }
    return file;
  } catch (error) {
    debug('loadJSONAndRetry', error);
    if (error.code === 'ENOENT') {
      if (options.retry) return options.retry();
      throw new Error(
        options.loadErrorMessage
          ? options.loadErrorMessage(fileName)
          : info.missingConfFile(fileName),
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
      validationSchema: chainsConfSchema,
    },
    options,
  ),
);
const loadWalletConf = options => loadJSONFile(options.fileName || WALLET_FILE_NAME, options);
const loadEncryptedWalletConf = options => loadJSONFile(options.fileName || ENCRYPTED_WALLET_FILE_NAME, options);
const loadDeployedConf = options => loadJSONAndRetry(
  DEPLOYED_FILE_NAME,
  Object.assign(
    {
      validationSchema: deployedConfSchema,
    },
    options,
  ),
);
const loadSignedOrders = options => loadJSONAndRetry(ORDERS_FILE_NAME, {
  ...options,
  loadErrorMessage: info.missingSignedOrders,
});

const initIExecConf = async (options) => {
  const iexecConf = Object.assign(templates.main);
  const fileName = await saveIExecConf(iexecConf, options);
  return { saved: iexecConf, fileName };
};

const initChainConf = async (options) => {
  const fileName = await saveChainConf(templates.chains, options);
  return { saved: templates.chains, fileName };
};

const initArray = async (arrayName, { array } = {}) => {
  try {
    const iexecConf = await loadIExecConf();
    iexecConf[arrayName] = array || templates[arrayName];
    const fileName = await saveIExecConf(iexecConf, { force: true });
    return { saved: iexecConf[arrayName], fileName };
  } catch (error) {
    debug('initArray()', error);
    throw error;
  }
};

const initObj = async (objName, { obj, overwrite = {} } = {}) => {
  try {
    if (objName === 'app') await initObj('buyConf');
    if (objName === 'dataset') await initArray('dapps');
    const iexecConf = await loadIExecConf();
    iexecConf[objName] = obj || templates.overwriteObject(templates[objName], overwrite);
    const fileName = await saveIExecConf(iexecConf, { force: true });
    return { saved: iexecConf[objName], fileName };
  } catch (error) {
    debug('initObj()', error);
    throw error;
  }
};

const initOrderObj = async (orderName, overwrite) => {
  try {
    const iexecConf = await loadIExecConf();
    const order = templates.createOrder(orderName, overwrite);
    if (typeof iexecConf.order !== 'object') iexecConf.order = {};
    iexecConf.order[orderName] = order;
    const fileName = await saveIExecConf(iexecConf, { force: true });
    return { saved: order, fileName };
  } catch (error) {
    debug('initOrder()', error);
    throw error;
  }
};

const saveDeployedObj = async (objName, chainId, address) => {
  try {
    const deployedConf = await loadDeployedConf({ retry: () => ({}) });
    debug('deployedConf', deployedConf);

    if (typeof deployedConf[objName] !== 'object') deployedConf[objName] = {};
    deployedConf[objName][chainId] = address;

    await saveDeployedConf(deployedConf, { force: true });
  } catch (error) {
    debug('saveDeployedObj()', error);
    throw error;
  }
};

const saveSignedOrder = async (orderName, chainId, signedOrder) => {
  try {
    const signedOrders = await loadSignedOrders({ retry: () => ({}) });

    if (typeof signedOrders[chainId] !== 'object') signedOrders[chainId] = {};
    signedOrders[chainId][orderName] = signedOrder;

    const fileName = await saveSignedOrders(signedOrders, { force: true });
    return { saved: orderName, fileName };
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

const isEmptyDir = async (dirPath) => {
  try {
    const files = await fs.readdir(dirPath);
    if (!files.length) return true;
    return false;
  } catch (error) {
    throw error;
  }
};

const zipDirectory = async (dirPath, { force = false } = {}) => {
  const zipPath = `${dirPath}.zip`;
  const zipName = path.parse(zipPath).base;
  debug(`zip directory ${dirPath} in ${zipPath}`);
  if ((await fs.exists(zipPath)) && !force) throw Error(`File ${zipPath} already exists`);
  try {
    const addFolder = async (zip, folderPath = '') => {
      debug('zip adding folder', folderPath);
      const folderContent = await fs.readdir(path.join(dirPath, folderPath));
      const pathArray = folderContent.map(fileName => path.join(folderPath, fileName));
      await Promise.all(
        pathArray.map(async (relativePath) => {
          const stats = await fs.lstat(path.join(dirPath, relativePath));
          if (stats.isDirectory()) {
            await addFolder(zip, relativePath);
          } else if (stats.isFile()) {
            debug('zip adding file', relativePath);
            zip.file(
              relativePath,
              await fs.readFile(path.join(dirPath, relativePath)),
            );
          } else {
            throw Error(`Cannot zip ${pathArray}`);
          }
        }),
      );
    };
    const zip = new JSZip();
    await addFolder(zip);
    debug('zip in memory');
    await new Promise((resolve, reject) => {
      zip
        .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
        .pipe(fs.createWriteStream(zipPath))
        .on('finish', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });
    debug(`zip ${zipPath} created`);
    return { zipPath, zipName };
  } catch (error) {
    debug('zipDirectory()', error);
    throw Error(`Failed to create ${zipPath} from ${dirPath}`);
  }
};

module.exports = {
  saveTextToFile,
  saveJSONToFile,
  saveWalletConf,
  saveEncryptedWalletConf,
  saveDeployedConf,
  saveChainConf,
  saveSignedOrder,
  loadJSONFile,
  loadJSONAndRetry,
  loadIExecConf,
  loadChainConf,
  loadWalletConf,
  loadEncryptedWalletConf,
  loadDeployedConf,
  loadSignedOrders,
  saveDeployedObj,
  initObj,
  initIExecConf,
  loadDeployedObj,
  initChainConf,
  initOrderObj,
  isEmptyDir,
  zipDirectory,
  IEXEC_FILE_NAME,
  CHAIN_FILE_NAME,
  WALLET_FILE_NAME,
  ENCRYPTED_WALLET_FILE_NAME,
  DEPLOYED_FILE_NAME,
  ORDERS_FILE_NAME,
};
