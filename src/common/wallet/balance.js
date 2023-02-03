import Debug from 'debug';
import { ethersBnToBn, truncateBnWeiToBnNRlc } from '../utils/utils';
import { addressSchema, throwIfMissing } from '../utils/validator';
import { wrapCall } from '../utils/errorWrappers';

const debug = Debug('iexec:wallet:balance');

export const getRlcBalance = async (
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

export const getEthBalance = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  const vAddress = await addressSchema({
    ethProvider: contracts.provider,
  }).validate(address);
  const weiBalance = await contracts.provider.getBalance(vAddress);
  return ethersBnToBn(weiBalance);
};

export const checkBalances = async (
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
