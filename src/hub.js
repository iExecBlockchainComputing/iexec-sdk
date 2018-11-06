const Debug = require('debug');
const ethUtil = require('ethjs-util');
const { isEthAddress } = require('./utils');
const { Spinner, info, prettyRPC } = require('./cli-helper');

const debug = Debug('iexec:hub');

const createObj = objName => async (contracts, obj, options) => {
  const spinner = Spinner();
  spinner.start(info.deploying(objName));

  const logs = await contracts.createObj(objName)(obj, options);

  spinner.succeed(`Deployed new ${objName} at address ${logs[0][objName]}`);
  return logs;
};
const createApp = createObj('dapp');

const showObj = objName => async (
  contracts,
  objAdressOrIndex,
  userAddress,
  options,
) => {
  const spinner = Spinner();
  spinner.start(info.showing(objName));

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

  spinner.succeed(`${objName} ${objAddress} details:${prettyRPC(obj)}`);
  return obj;
};

const countObj = objName => async (contracts, userAddress, options) => {
  const spinner = Spinner();
  spinner.start(info.counting(objName));

  const objCount = await contracts.getUserObjCount(objName)(
    userAddress,
    options,
  );

  spinner.succeed(`User ${userAddress} has a total of ${objCount} ${objName}`);
  return objCount;
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

  const count = await contracts.getHubContract(options).countCategory();

  spinner.succeed(`iExec hub has a total of ${count} category`);
  return count;
};

module.exports = {
  createObj,
  createApp,
  showObj,
  countObj,
  createCategory,
  showCategory,
  countCategory,
};
