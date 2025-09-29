import Debug from 'debug';
import fsExtra from 'fs-extra';
import { join } from 'path';
import { object, string, number, boolean, lazy } from 'yup';
import { APP, DATASET } from '../../common/utils/constant.js';
import {
  addressSchema,
  chainIdSchema,
  smsUrlOrMapSchema,
  teeFrameworkSchema,
} from '../../common/utils/validator.js';
import { prompt, info } from './cli-helper.js';
import templates, {
  main,
  chains,
  overwriteObject,
  createOrder,
} from './templates.js';

const { ensureDir, writeFile, open, write, close, readFile, readdir } = fsExtra;

const debug = Debug('iexec:fs');

const chainConfSchema = () =>
  object({
    id: chainIdSchema(),
    host: string(),
    hub: string(), // todo address
    ensRegistry: string(), // TODO: DEPRECATED not used anymore
    ensPublicResolver: string(), // todo address
    voucherHub: string(), // todo address
    sms: smsUrlOrMapSchema(),
    resultProxy: string(),
    ipfsGateway: string(),
    iexecGateway: string(),
    compass: string(),
    pocoSubgraph: string(),
    voucherSubgraph: string(),
    native: boolean(),
    useGas: boolean().default(true),
    defaultTeeFramework: teeFrameworkSchema(),
    bridge: object({
      bridgedChainName: string().required(),
      contract: addressSchema().required(),
    })
      .notRequired()
      .strict(),
  })
    .noUnknown(true, 'Unknown key "${unknown}"')
    .strict();

const chainsConfSchema = () =>
  object({
    default: string(),
    allowExperimentalNetworks: boolean().default(false),
    chains: object()
      .test(async (chainsOjb) => {
        await Promise.all(
          Object.entries({ ...chainsOjb }).map(async ([name, chain]) => {
            await string().validate(name, { strict: true });
            await chainConfSchema().validate(chain, { strict: true });
          }),
        );
        return true;
      })
      .required(),
    providers: object({
      alchemy: string().notRequired(),
      etherscan: string().notRequired(),
      infura: lazy((value) => {
        if (typeof value === 'object') {
          return object({
            projectId: string().required(),
            projectSecret: string(),
          })
            .noUnknown(true, 'Unknown key "${unknown}" in providers.infura')
            .strict();
        }
        return string();
      }),
      quorum: number().integer().min(1).max(3).notRequired(),
    })
      .noUnknown(true, 'Unknown key "${unknown}" in providers')
      .strict(),
  })
    .noUnknown(true, 'Unknown key "${unknown}"')
    .strict();

const deployedObjSchema = () =>
  object().test(async (obj) => {
    await Promise.all(
      Object.entries({ ...obj }).map(async ([chainId, address]) => {
        await chainIdSchema().required().validate(chainId, { strict: true });
        await addressSchema().required().validate(address, { strict: true });
      }),
    );
    return true;
  });

const deployedConfSchema = () =>
  object({
    app: deployedObjSchema().notRequired(),
    dataset: deployedObjSchema().notRequired(),
    workerpool: deployedObjSchema().notRequired(),
  })
    .noUnknown(true, 'Unknown key "${unknown}"')
    .strict();

export const IEXEC_FILE_NAME = 'iexec.json';
const CHAIN_FILE_NAME = 'chain.json';
const WALLET_FILE_NAME = 'wallet.json';
const ENCRYPTED_WALLET_FILE_NAME = 'encrypted-wallet.json';
export const DEPLOYED_FILE_NAME = 'deployed.json';
const ORDERS_FILE_NAME = 'orders.json';

export const saveToFile = async (
  fileName,
  text,
  { force = false, strict = true, fileDir, format } = {},
) => {
  try {
    let filePath;
    if (fileDir) {
      await ensureDir(fileDir);
      filePath = join(fileDir, fileName);
    } else {
      filePath = fileName;
    }
    if (force) {
      await writeFile(filePath, text);
      return filePath;
    }
    const fd = await open(filePath, 'wx');
    await write(fd, text, 0, format);
    await close(fd);
    return filePath;
  } catch (error) {
    if (error.code === 'EEXIST') {
      const answer = await prompt.overwrite(fileName, { strict });
      if (answer) {
        let filePath;
        if (fileDir) {
          filePath = join(fileDir, fileName);
        } else {
          filePath = fileName;
        }
        await writeFile(filePath, text);
        return filePath;
      }
      return '';
    }
    debug('saveToFile()', error);
    throw error;
  }
};

export const saveTextToFile = async (
  fileName,
  text,
  { force = false, strict = true, fileDir } = {},
) => {
  try {
    return await saveToFile(fileName, text, {
      format: 'utf8',
      force,
      strict,
      fileDir,
    });
  } catch (error) {
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
    return await saveTextToFile(fileName, json, {
      force,
      strict,
      fileDir,
    });
  } catch (error) {
    debug('saveJSONToFile()', error);
    throw error;
  }
};

const saveWallet = (obj, defaultFileName, options) => {
  const fileName = options.walletName || defaultFileName;
  return saveJSONToFile(fileName, obj, options);
};
export const saveWalletConf = (obj, options) =>
  saveWallet(obj, WALLET_FILE_NAME, options);
export const saveEncryptedWalletConf = (obj, options) =>
  saveWallet(obj, ENCRYPTED_WALLET_FILE_NAME, options);

export const saveIExecConf = (obj, options) =>
  saveJSONToFile(IEXEC_FILE_NAME, obj, options);
export const saveDeployedConf = (obj, options) =>
  saveJSONToFile(DEPLOYED_FILE_NAME, obj, options);
export const saveChainConf = (obj, options) =>
  saveJSONToFile(CHAIN_FILE_NAME, obj, options);
export const saveSignedOrders = (obj, options) =>
  saveJSONToFile(ORDERS_FILE_NAME, obj, options);

const loadJSONFile = async (fileName, { fileDir } = {}) => {
  let filePath;
  if (fileDir) {
    filePath = join(fileDir, fileName);
  } else {
    filePath = join(process.cwd(), fileName);
  }
  debug('loading filePath', filePath);
  const fileJSON = await readFile(filePath, 'utf8');
  return JSON.parse(fileJSON);
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
      throw Error(
        options.loadErrorMessage
          ? options.loadErrorMessage(fileName)
          : info.missingConfFile(fileName),
      );
    }
    throw Error(`${error} in ${fileName}`);
  }
};
export const loadIExecConf = (options) =>
  loadJSONAndRetry(IEXEC_FILE_NAME, options);
export const loadChainConf = (options) =>
  loadJSONAndRetry(CHAIN_FILE_NAME, {
    validationSchema: chainsConfSchema,
    ...options,
  });
export const loadWalletConf = (options) =>
  loadJSONFile(options.fileName || WALLET_FILE_NAME, options);
export const loadEncryptedWalletConf = (options) =>
  loadJSONFile(options.fileName || ENCRYPTED_WALLET_FILE_NAME, options);
export const loadDeployedConf = (options) =>
  loadJSONAndRetry(DEPLOYED_FILE_NAME, {
    validationSchema: deployedConfSchema,
    ...options,
  });
export const loadSignedOrders = (options) =>
  loadJSONAndRetry(ORDERS_FILE_NAME, {
    ...options,
    loadErrorMessage: info.missingSignedOrders,
  });

export const initIExecConf = async (options) => {
  const iexecConf = Object.assign(main);
  const fileName = await saveIExecConf(iexecConf, options);
  return { saved: iexecConf, fileName };
};

export const initChainConf = async (options) => {
  const fileName = await saveChainConf(chains, options);
  return { saved: chains, fileName };
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

export const initObj = async (objName, { obj, overwrite = {} } = {}) => {
  try {
    if (objName === APP) await initObj('buyConf');
    if (objName === DATASET) await initArray('dapps');
    const iexecConf = await loadIExecConf();
    iexecConf[objName] = obj || overwriteObject(templates[objName], overwrite);
    const fileName = await saveIExecConf(iexecConf, { force: true });
    return { saved: iexecConf[objName], fileName };
  } catch (error) {
    debug('initObj()', error);
    throw error;
  }
};

export const initOrderObj = async (orderName, overwrite) => {
  try {
    const iexecConf = await loadIExecConf();
    const order = createOrder(orderName, overwrite);
    if (typeof iexecConf.order !== 'object') iexecConf.order = {};
    iexecConf.order[orderName] = order;
    const fileName = await saveIExecConf(iexecConf, { force: true });
    return { saved: order, fileName };
  } catch (error) {
    debug('initOrder()', error);
    throw error;
  }
};

export const saveDeployedObj = async (objName, chainId, address) => {
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

export const saveSignedOrder = async (orderName, chainId, signedOrder) => {
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

export const loadDeployedObj = async (objName) => {
  const deployedConf = await loadDeployedConf({ retry: () => ({}) });

  if (typeof deployedConf[objName] !== 'object') return {};
  return deployedConf[objName];
};

export const isEmptyDir = async (dirPath) => {
  try {
    const files = await readdir(dirPath);
    return !files.length;
  } catch (error) {
    debug('isEmptyDir()', error);
    throw error;
  }
};
