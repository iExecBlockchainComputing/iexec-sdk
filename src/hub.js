const Debug = require('debug');
const ethUtil = require('ethjs-util');
const { isEthAddress } = require('./utils');
const { Spinner } = require('./cli-helper');

const debug = Debug('iexec:hub');

const createObj = objName => async (hubAddress, obj, contracts) => {
  const spinner = Spinner();
  spinner.start(`creating ${objName}...`);
  const txHash = await contracts.createObj(objName)(obj, {
    hub: hubAddress,
  });

  const txReceipt = await contracts.waitForReceipt(txHash);
  debug('txReceipt', txReceipt);

  const events = contracts.decodeHubLogs(txReceipt.logs);
  debug('events', events);

  spinner.succeed(`new ${objName} created at address ${events[0][objName]}`);
  return events;
};

const showObj = objName => async (
  objAdressOrIndex,
  cliHubAddress,
  userAddress,
  contracts,
) => {
  const spinner = Spinner();
  spinner.start(`showing ${objName}...`);
  let objAddress;
  if (
    !ethUtil.isHexString(objAdressOrIndex) &&
    Number.isInteger(Number(objAdressOrIndex))
  ) {
    // INDEX case: need hit subHub to get obj address from index
    objAddress = await contracts.getUserObjAddressByIndex(objName)(
      userAddress,
      objAdressOrIndex,
      { hub: cliHubAddress },
    );
  } else if (isEthAddress(objAdressOrIndex)) {
    objAddress = objAdressOrIndex;
  } else {
    throw Error('argument is neither an integer index nor a valid ethereum address');
  }

  const obj = await contracts.getObjProps(objName)(objAddress, {
    hub: cliHubAddress,
  });

  spinner.succeed(`${objName} ${objAddress} details:\n${JSON.stringify(obj, null, 4)}`);
  return obj;
};

const countObj = objName => async (
  cliUserAddress,
  hubAddress,
  userAddress,
  contracts,
) => {
  const spinner = Spinner();
  spinner.start(`counting ${objName}...`);

  const objCount = await contracts.getUserObjCount(objName)(userAddress, {
    hub: hubAddress,
  });

  spinner.succeed(`user ${userAddress} has a total of ${objCount} ${objName}`);
  return objCount;
};

module.exports = {
  createObj,
  showObj,
  countObj,
};
