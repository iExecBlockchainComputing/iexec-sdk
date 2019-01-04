const Debug = require('debug');
const ethUtil = require('ethjs-util');
const {
  isEthAddress,
  ethersBnToBn,
  checksummedAddress,
  bnifyNestedEthersBn,
} = require('./utils');

const debug = Debug('iexec:hub');

const createObj = objName => async (contracts, obj, options) => {
  const logs = await contracts.createObj(objName)(obj, options);
  const address = checksummedAddress(logs[0][objName]);
  return address;
};

const showObj = objName => async (
  contracts,
  objAdressOrIndex,
  userAddress,
  options,
) => {
  let objAddress;
  if (
    !ethUtil.isHexString(objAdressOrIndex)
    && Number.isInteger(Number(objAdressOrIndex))
  ) {
    // INDEX case: need hit subHub to get obj address from index
    objAddress = await contracts.getUserObjAddressByIndex(objName)(
      userAddress,
      objAdressOrIndex,
      options,
    );
  } else if (isEthAddress(objAdressOrIndex)) {
    objAddress = objAdressOrIndex;
  } else {
    throw Error(
      'argument is neither an integer index nor a valid ethereum address',
    );
  }

  const obj = bnifyNestedEthersBn(
    await contracts.getObjProps(objName)(objAddress),
  );
  return { obj, objAddress };
};

const countObj = objName => async (contracts, userAddress, options) => {
  const objCountBN = ethersBnToBn(
    await contracts.getUserObjCount(objName)(userAddress, options),
  );
  debug('objCountBN', objCountBN);
  return objCountBN;
};

const createCategory = async (contracts, obj, options) => {
  const logs = await contracts.createCategory(obj, options);
  debug('logs', logs);
  return logs[0].catid;
};

const showCategory = async (contracts, index, options) => {
  const category = bnifyNestedEthersBn(
    await contracts.getCategoryByIndex(index, options),
  );
  return category;
};

const countCategory = async (contracts, options) => {
  const countBN = ethersBnToBn(
    await contracts.getHubContract(options).countCategory(),
  );
  return countBN;
};

module.exports = {
  createObj,
  showObj,
  countObj,
  createCategory,
  showCategory,
  countCategory,
};
