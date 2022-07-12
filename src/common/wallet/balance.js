const Debug = require('debug');
const { ethersBnToBn, truncateBnWeiToBnNRlc } = require('../utils/utils');
const {
  addressSchema,

  throwIfMissing,
} = require('../utils/validator');
const { wrapCall } = require('../utils/errorWrappers');

const debug = Debug('iexec:wallet:balance');

const getRlcBalance = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  const vAddress = await addressSchema({
    ethProvider: contracts.provider,
  }).validate(address);
  const { isNative } = contracts;
  if (isNative) {
    const weiBalance = await contracts.provider.getBalance(vAddress);
    return truncateBnWeiToBnNRlc(ethersBnToBn(weiBalance));
  }
  const rlcContract = await wrapCall(contracts.fetchTokenContract());
  const nRlcBalance = await wrapCall(rlcContract.balanceOf(vAddress));
  return ethersBnToBn(nRlcBalance);
};

const getEthBalance = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  const vAddress = await addressSchema({
    ethProvider: contracts.provider,
  }).validate(address);
  const weiBalance = await contracts.provider.getBalance(vAddress);
  return ethersBnToBn(weiBalance);
};

const checkBalances = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(address);
    const [weiBalance, rlcBalance] = await Promise.all([
      getEthBalance(contracts, vAddress),
      getRlcBalance(contracts, vAddress),
    ]);
    const balances = {
      wei: weiBalance,
      nRLC: rlcBalance,
    };
    debug('balances', balances);
    return balances;
  } catch (error) {
    debug('checkBalances()', error);
    throw error;
  }
};

module.exports = { getEthBalance, getRlcBalance, checkBalances };
