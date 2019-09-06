const Debug = require('debug');
const {
  toUpperFirst,
  isEthAddress,
  ethersBnToBn,
  checksummedAddress,
  bnifyNestedEthersBn,
  throwIfMissing,
  multiaddrHexToHuman,
  getEventFromLogs,
} = require('./utils');

const debug = Debug('iexec:hub');

const createObj = (objName = throwIfMissing()) => async (
  contracts = throwIfMissing(),
  obj = throwIfMissing(),
  options,
) => {
  try {
    const txReceipt = await contracts.createObj(objName)(obj, options);
    const event = getEventFromLogs(
      'Create'.concat(toUpperFirst(objName)),
      txReceipt.events,
      {
        strict: true,
      },
    );
    const address = checksummedAddress(event.args[objName]);
    return address;
  } catch (error) {
    debug('createObj()', error);
    throw error;
  }
};

const deployApp = (contracts, app) => createObj('app')(contracts, app);
const deployDataset = (contracts, dataset) => createObj('dataset')(contracts, dataset);
const deployWorkerpool = (contracts, workerpool) => createObj('workerpool')(contracts, workerpool);

const showObj = (objName = throwIfMissing()) => async (
  contracts = throwIfMissing(),
  objAddressOrIndex = throwIfMissing(),
  userAddress,
) => {
  try {
    let objAddress;
    if (
      !isEthAddress(objAddressOrIndex, { strict: false })
      && Number.isInteger(Number(objAddressOrIndex))
    ) {
      if (!isEthAddress(userAddress)) throw Error('Missing userAddress');
      // INDEX case: need hit subHub to get obj address from index
      objAddress = await contracts.getUserObjAddressByIndex(objName)(
        userAddress,
        objAddressOrIndex,
      );
    } else if (isEthAddress(objAddressOrIndex)) {
      objAddress = objAddressOrIndex;
    } else {
      throw Error(
        'Argument is neither an integer index nor a valid ethereum address',
      );
    }
    const obj = bnifyNestedEthersBn(
      await contracts.getObjProps(objName)(objAddress),
    );
    return { obj, objAddress };
  } catch (error) {
    debug('showObj()', error);
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
  const { obj, objAddress } = await showObj('app')(contracts, appAddress);
  const clean = Object.assign(
    cleanObj(obj),
    obj.m_appMultiaddr && {
      appMultiaddr: multiaddrHexToHuman(obj.m_appMultiaddr),
    },
  );
  return { objAddress, app: clean };
};

const showUserApp = async (
  contracts = throwIfMissing(),
  index = throwIfMissing(),
  userAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showObj('app')(
    contracts,
    index,
    userAddress,
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
  const { obj, objAddress } = await showObj('dataset')(
    contracts,
    datasetAddress,
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
  const { obj, objAddress } = await showObj('dataset')(
    contracts,
    index,
    userAddress,
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
  const { obj, objAddress } = await showObj('workerpool')(
    contracts,
    workerpoolAddress,
  );
  const clean = cleanObj(obj);
  return { objAddress, workerpool: clean };
};

const showUserWorkerpool = async (
  contracts = throwIfMissing(),
  index = throwIfMissing(),
  userAddress = throwIfMissing(),
) => {
  const { obj, objAddress } = await showObj('workerpool')(
    contracts,
    index,
    userAddress,
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
      await contracts.getUserObjCount(objName)(userAddress),
    );
    return objCountBN;
  } catch (error) {
    debug('countObj()', error);
    throw error;
  }
};

const countUserApps = async (
  contracts = throwIfMissing(),
  userAdress = throwIfMissing(),
) => countObj('app')(contracts, userAdress);
const countUserDatasets = async (
  contracts = throwIfMissing(),
  userAdress = throwIfMissing(),
) => countObj('dataset')(contracts, userAdress);
const countUserWorkerpools = async (
  contracts = throwIfMissing(),
  userAdress = throwIfMissing(),
) => countObj('workerpool')(contracts, userAdress);

const createCategory = async (
  contracts = throwIfMissing(),
  obj = throwIfMissing(),
) => {
  try {
    const txReceipt = await contracts.createCategory(obj);
    const { catid } = getEventFromLogs('CreateCategory', txReceipt.events, {
      strict: true,
    }).args;
    return catid;
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
      await contracts.getCategoryByIndex(index),
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
      await contracts.getHubContract().countCategory(),
    );
    return countBN;
  } catch (error) {
    debug('countCategory()', error);
    throw error;
  }
};

const getTimeoutRatio = async (contracts = throwIfMissing()) => {
  try {
    const timeoutRatio = ethersBnToBn(
      await contracts.getHubContract().FINAL_DEADLINE_RATIO(),
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
  showApp,
  showDataset,
  showWorkerpool,
  showUserApp,
  showUserDataset,
  showUserWorkerpool,
  countUserApps,
  countUserDatasets,
  countUserWorkerpools,
  createCategory,
  showCategory,
  countCategory,
  getTimeoutRatio,
};
