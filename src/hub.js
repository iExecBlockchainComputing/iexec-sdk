const Debug = require('debug');
const {
  isEthAddress,
  ethersBnToBn,
  checksummedAddress,
  bnifyNestedEthersBn,
  throwIfMissing,
  multiaddrHexToHuman,
} = require('./utils');

const debug = Debug('iexec:hub');

const createObj = (objName = throwIfMissing()) => async (
  contracts = throwIfMissing(),
  obj = throwIfMissing(),
  options,
) => {
  try {
    const logs = await contracts.createObj(objName)(obj, options);
    const address = checksummedAddress(logs[0][objName]);
    return address;
  } catch (error) {
    debug('createObj()', error);
    throw error;
  }
};

const showObj = (objName = throwIfMissing()) => async (
  contracts = throwIfMissing(),
  objAdressOrIndex = throwIfMissing(),
  userAddress,
) => {
  try {
    let objAddress;
    if (
      !isEthAddress(objAdressOrIndex, { strict: false })
      && Number.isInteger(Number(objAdressOrIndex))
    ) {
      if (!isEthAddress(userAddress)) throw Error('Missing userAddress');
      // INDEX case: need hit subHub to get obj address from index
      objAddress = await contracts.getUserObjAddressByIndex(objName)(
        userAddress,
        objAdressOrIndex,
      );
    } else if (isEthAddress(objAdressOrIndex)) {
      objAddress = objAdressOrIndex;
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
  const reducer = (acc, curr) => Object.assign(acc, { [curr[0].split('m_')[1]]: curr[1] });
  return Object.entries(obj).reduce(reducer, {});
};

const showApp = async (
  contracts = throwIfMissing(),
  objAdressOrIndex = throwIfMissing(),
  userAddress,
) => {
  const { obj, objAddress } = await showObj('app')(
    contracts,
    objAdressOrIndex,
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
  objAdressOrIndex = throwIfMissing(),
  userAddress,
) => {
  const { obj, objAddress } = await showObj('dataset')(
    contracts,
    objAdressOrIndex,
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
  objAdressOrIndex = throwIfMissing(),
  userAddress,
) => {
  const { obj, objAddress } = await showObj('workerpool')(
    contracts,
    objAdressOrIndex,
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

const createCategory = async (
  contracts = throwIfMissing(),
  obj = throwIfMissing(),
) => {
  try {
    const logs = await contracts.createCategory(obj);
    return logs[0].catid;
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
  createObj,
  showObj,
  showApp,
  showDataset,
  showWorkerpool,
  countObj,
  createCategory,
  showCategory,
  countCategory,
  getTimeoutRatio,
};
