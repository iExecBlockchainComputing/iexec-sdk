import Debug from 'debug';
import { ethersBnToBn } from '../utils/utils';
import { addressSchema, throwIfMissing } from '../utils/validator';
import { wrapCall } from '../utils/errorWrappers';

const debug = Debug('iexec:account:balance');

export const checkBalance = async (
  contracts = throwIfMissing(),
  address = throwIfMissing(),
) => {
  try {
    const vAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(address);
    const iexecContract = contracts.getIExecContract();
    const { stake, locked } = await wrapCall(
      iexecContract.viewAccount(vAddress),
    );
    const balance = {
      stake: ethersBnToBn(stake),
      locked: ethersBnToBn(locked),
    };
    return balance;
  } catch (error) {
    debug('checkBalance()', error);
    throw error;
  }
};
