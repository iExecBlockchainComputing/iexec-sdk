const Debug = require('debug');
const ethUtil = require('ethjs-util');
const { isEthAddress, ethersBnToBn, checksummedAddress } = require('./utils');
const { Spinner, info, prettyRPC } = require('./cli-helper');

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

  const obj = await contracts.getObjProps(objName)(objAddress);
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
  const spinner = Spinner();
  spinner.start(info.creating('category'));

  const logs = await contracts.createCategory(obj, options);
  debug('logs', logs);

  spinner.succeed(`New category created at index ${logs[0].catid}`);
  return logs;
};

const showCategory = async (contracts, index, options) => {
  const spinner = Spinner();
  spinner.start(info.showing('category'));
  const categoryRPC = await contracts.getCategoryByIndex(index, options);
  spinner.succeed(
    `Category at index ${index} details:${prettyRPC(categoryRPC)}`,
  );
  return categoryRPC;
};

const countCategory = async (contracts, options) => {
  const spinner = Spinner();
  spinner.start(info.counting('category'));

  const countBN = ethersBnToBn(
    await contracts.getHubContract(options).countCategory(),
  );

  spinner.succeed(`iExec hub has a total of ${countBN} category`);
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
