const Debug = require('debug');
const {
  toUpperFirst,
  ethersBnToBn,
  checksummedAddress,
  bnifyNestedEthersBn,
  multiaddrHexToHuman,
  getEventFromLogs,
  hexToBuffer,
} = require('./utils');
const {
  addressSchema,
  uint256Schema,
  categorySchema,
  appSchema,
  datasetSchema,
  workerpoolSchema,
  throwIfMissing,
  ValidationError,
} = require('./validator');
const { wrapCall, wrapSend } = require('./errorWrappers');

const debug = Debug('iexec:hub');

const RESOURCE_NAMES = ['app', 'dataset', 'workerpool'];

const createObj = (objName = throwIfMissing()) => async (
  contracts = throwIfMissing(),
  obj = throwIfMissing(),
) => {
  try {
    const txReceipt = await wrapSend(contracts.createObj(objName)(obj));
    const event = getEventFromLogs(
      'Create'.concat(toUpperFirst(objName)),
      txReceipt.events,
      {
        strict: true,
      },
    );
    const address = checksummedAddress(event.args[objName]);
    const txHash = txReceipt.transactionHash;
    return { address, txHash };
  } catch (error) {
    debug('createObj()', error);
    throw error;
  }
};

const deployApp = async (contracts, app) => createObj('app')(contracts, await appSchema().validate(app));
const deployDataset = async (contracts, dataset) => createObj('dataset')(contracts, await datasetSchema().validate(dataset));
const deployWorkerpool = async (contracts, workerpool) => createObj('workerpool')(
  contracts,
  await workerpoolSchema().validate(workerpool),
);

const showObjByAddress = (objName = throwIfMissing()) => async (
  contracts = throwIfMissing(),
  objAddress = throwIfMissing(),
) => {
  try {
    const obj = bnifyNestedEthersBn(
      await wrapCall(contracts.getObjProps(objName)(objAddress)),
    );
    return { obj, objAddress };
  } catch (error) {
    debug('showObjByAddress()', error);
    throw error;
  }
};

const showObjByIndex = (objName = throwIfMissing()) => async (
  contracts = throwIfMissing(),
  objIndex = throwIfMissing(),
  userAddress = throwIfMissing(),
) => {
  try {
    const objAddress = await wrapCall(
      contracts.getUserObjAddressByIndex(objName)(userAddress, objIndex),
    );
    return showObjByAddress(objName)(contracts, objAddress);
  } catch (error) {
    debug('showObjByIndex()', error);
    throw error;
  }
};

const cleanObj = (obj) => {
  const reducer = (acc, curr) => {
    const name = curr[0].substr(0, 2) === 'm_' ? curr[0].split('m_')[1] : curr[0];
    return Object.assign(acc, { [name]: curr[1] });
  };
  return Object.entries(obj).reduce(reducer, {});
};

const showApp = async (
  contracts = throwIfMissing(),
  appAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showObjByAddress('app')(
    contracts,
    await addressSchema().validate(appAddress),
  );
  const clean = Object.assign(
    cleanObj(obj),
    obj.m_appMultiaddr && {
      appMultiaddr: multiaddrHexToHuman(obj.m_appMultiaddr),
    },
    obj.m_appMREnclave && {
      appMREnclave: hexToBuffer(obj.m_appMREnclave).toString(),
    },
  );
  return { objAddress, app: clean };
};

const showUserApp = async (
  contracts = throwIfMissing(),
  index = throwIfMissing(),
  userAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showObjByIndex('app')(
    contracts,
    await uint256Schema().validate(index),
    await addressSchema().validate(userAddress),
  );
  const clean = Object.assign(
    cleanObj(obj),
    obj.m_appMultiaddr && {
      appMultiaddr: multiaddrHexToHuman(obj.m_appMultiaddr),
    },
  );
  return { objAddress, app: clean };
};

const showDataset = async (
  contracts = throwIfMissing(),
  datasetAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showObjByAddress('dataset')(
    contracts,
    await addressSchema().validate(datasetAddress),
  );
  const clean = Object.assign(
    cleanObj(obj),
    obj.m_datasetMultiaddr && {
      datasetMultiaddr: multiaddrHexToHuman(obj.m_datasetMultiaddr),
    },
  );
  return { objAddress, dataset: clean };
};

const showUserDataset = async (
  contracts = throwIfMissing(),
  index = throwIfMissing(),
  userAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showObjByIndex('dataset')(
    contracts,
    await uint256Schema().validate(index),
    await addressSchema().validate(userAddress),
  );
  const clean = Object.assign(
    cleanObj(obj),
    obj.m_datasetMultiaddr && {
      datasetMultiaddr: multiaddrHexToHuman(obj.m_datasetMultiaddr),
    },
  );
  return { objAddress, dataset: clean };
};

const showWorkerpool = async (
  contracts = throwIfMissing(),
  workerpoolAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showObjByAddress('workerpool')(
    contracts,
    await addressSchema().validate(workerpoolAddress),
  );
  const clean = cleanObj(obj);
  return { objAddress, workerpool: clean };
};

const showUserWorkerpool = async (
  contracts = throwIfMissing(),
  index = throwIfMissing(),
  userAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showObjByIndex('workerpool')(
    contracts,
    await uint256Schema().validate(index),
    await addressSchema().validate(userAddress),
  );
  const clean = cleanObj(obj);
  return { objAddress, workerpool: clean };
};

const countObj = (objName = throwIfMissing()) => async (
  contracts = throwIfMissing(),
  userAddress = throwIfMissing(),
) => {
  try {
    const objCountBN = ethersBnToBn(
      await wrapCall(contracts.getUserObjCount(objName)(userAddress)),
    );
    return objCountBN;
  } catch (error) {
    debug('countObj()', error);
    throw error;
  }
};

const countUserApps = async (
  contracts = throwIfMissing(),
  userAddress = throwIfMissing(),
) => countObj('app')(contracts, await addressSchema().validate(userAddress));
const countUserDatasets = async (
  contracts = throwIfMissing(),
  userAddress = throwIfMissing(),
) => countObj('dataset')(contracts, await addressSchema().validate(userAddress));
const countUserWorkerpools = async (
  contracts = throwIfMissing(),
  userAddress = throwIfMissing(),
) => countObj('workerpool')(
  contracts,
  await addressSchema().validate(userAddress),
);

const createCategory = async (
  contracts = throwIfMissing(),
  obj = throwIfMissing(),
) => {
  try {
    const txReceipt = await wrapSend(
      contracts.createCategory(await categorySchema().validate(obj)),
    );
    const { catid } = getEventFromLogs('CreateCategory', txReceipt.events, {
      strict: true,
    }).args;
    const txHash = txReceipt.transactionHash;
    return { catid, txHash };
  } catch (error) {
    debug('createCategory()', error);
    throw error;
  }
};

const showCategory = async (
  contracts = throwIfMissing(),
  index = throwIfMissing(),
) => {
  try {
    const category = bnifyNestedEthersBn(
      await wrapCall(
        contracts.getCategoryByIndex(await uint256Schema().validate(index)),
      ),
    );
    return category;
  } catch (error) {
    debug('showCategory()', error);
    throw error;
  }
};

const countCategory = async (contracts = throwIfMissing()) => {
  try {
    const countBN = ethersBnToBn(
      await wrapCall(contracts.getHubContract().countCategory()),
    );
    return countBN;
  } catch (error) {
    debug('countCategory()', error);
    throw error;
  }
};

const checkResourceName = (type) => {
  if (!RESOURCE_NAMES.includes(type)) throw new ValidationError(`Invalid resource name ${type}`);
};

const checkDeployedApp = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  try {
    const at = await addressSchema().validate(address);
    const isDeployed = await wrapCall(
      contracts.checkDeployedApp(at, { strict: false }),
    );
    return isDeployed;
  } catch (error) {
    debug('checkDeployedApp()', error);
    throw error;
  }
};

const checkDeployedDataset = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  try {
    const at = await addressSchema().validate(address);
    const isDeployed = await wrapCall(
      contracts.checkDeployedDataset(at, { strict: false }),
    );
    return isDeployed;
  } catch (error) {
    debug('checkDeployedDataset()', error);
    throw error;
  }
};

const checkDeployedWorkerpool = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  try {
    const at = await addressSchema().validate(address);
    const isDeployed = await wrapCall(
      contracts.checkDeployedWorkerpool(at, { strict: false }),
    );
    return isDeployed;
  } catch (error) {
    debug('checkDeployedApp()', error);
    throw error;
  }
};

const getOwner = async (
  contracts = throwIfMissing(),
  name = throwIfMissing(),
  address = throwIfMissing(),
) => {
  try {
    checkResourceName(name);
    const contract = contracts.getContract(name)({
      at: address,
    });
    const owner = checksummedAddress(await wrapCall(contract.owner()));
    return owner;
  } catch (error) {
    debug('getOwner()', error);
    throw error;
  }
};

const getAppOwner = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => getOwner(contracts, 'app', await addressSchema().validate(address));

const getDatasetOwner = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => getOwner(contracts, 'dataset', await addressSchema().validate(address));

const getWorkerpoolOwner = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => getOwner(contracts, 'workerpool', await addressSchema().validate(address));

const getTimeoutRatio = async (contracts = throwIfMissing()) => {
  try {
    const timeoutRatio = ethersBnToBn(
      await wrapCall(contracts.getHubContract().FINAL_DEADLINE_RATIO()),
    );
    return timeoutRatio;
  } catch (error) {
    debug('getTimeoutRatio()', error);
    throw error;
  }
};

module.exports = {
  deployApp,
  deployDataset,
  deployWorkerpool,
  checkDeployedApp,
  checkDeployedDataset,
  checkDeployedWorkerpool,
  showApp,
  showDataset,
  showWorkerpool,
  showUserApp,
  showUserDataset,
  showUserWorkerpool,
  countUserApps,
  countUserDatasets,
  countUserWorkerpools,
  getAppOwner,
  getDatasetOwner,
  getWorkerpoolOwner,
  createCategory,
  showCategory,
  countCategory,
  getTimeoutRatio,
};
