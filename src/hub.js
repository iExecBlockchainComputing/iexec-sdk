const Debug = require('debug');
const ethUtil = require('ethjs-util');
const { loadIEXECConf, getChains, isEthAddress } = require('./utils');
const wallet = require('./wallet');
const { handleError, Spinner } = require('./cli-helper');

const debug = Debug('iexec:hub');

const createObj = objName => async (chainName, hubAddress) => {
  const spinner = Spinner();
  try {
    const iexecConf = await loadIEXECConf();

    spinner.start(`creating ${objName}...`);
    const chain = getChains()[chainName];

    const txHash = await chain.contracts.createObj(objName)(
      iexecConf[objName],
      {
        hub: hubAddress,
      },
    );

    const txReceipt = await chain.contracts.waitForReceipt(txHash);
    debug('txReceipt', txReceipt);

    const events = chain.contracts.decodeHubLogs(txReceipt.logs);
    debug('events', events);

    spinner.succeed(`new ${objName} created at address ${events[0][objName]}`);
  } catch (error) {
    handleError(error, objName, spinner);
  }
};

const showObj = objName => async (
  chainName,
  cliAppAddressOrIndex,
  cliHubAddress,
  cliUserAddress,
) => {
  const spinner = Spinner();
  try {
    const userWallet = await wallet.load();
    const chain = getChains()[chainName];

    spinner.start('creating app...');
    let objAddress;
    if (
      !ethUtil.isHexString(cliAppAddressOrIndex) &&
      Number.isInteger(Number(cliAppAddressOrIndex))
    ) {
      // INDEX case: need hit subHub to get obj address from index
      const userAddress = cliUserAddress || userWallet.address;
      debug('userAddress', userAddress);

      objAddress = await chain.contracts.getUserObjAddressByIndex(objName)(
        userAddress,
        cliAppAddressOrIndex,
        { hub: cliHubAddress },
      );
    } else if (isEthAddress(cliAppAddressOrIndex)) {
      objAddress = cliAppAddressOrIndex;
    } else {
      throw Error('cli argument is neither an integer nor a valid ethereum address');
    }

    const obj = await chain.contracts.getObjProps(objName)(objAddress, {
      hub: cliHubAddress,
    });

    spinner.succeed(`${objName} ${objAddress} details:\n${JSON.stringify(obj, null, 4)}`);
  } catch (error) {
    handleError(error, objName, spinner);
  }
};

const countObj = objName => async (chainName, cliUserAddress, hubAddress) => {
  const spinner = Spinner();
  try {
    const userWallet = await wallet.load();
    const chain = getChains()[chainName];

    const userAddress = cliUserAddress || userWallet.address;
    debug('userAddress', userAddress);

    spinner.start(`counting ${objName}...`);

    const objCount = await chain.contracts.getUserObjCount(objName)(
      userAddress,
      {
        hub: hubAddress,
      },
    );

    spinner.succeed(`user ${userAddress} has a total of ${objCount} ${objName}`);
  } catch (error) {
    handleError(error, objName, spinner);
  }
};

module.exports = {
  createObj,
  showObj,
  countObj,
};
