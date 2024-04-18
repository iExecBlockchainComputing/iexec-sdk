import Debug from 'debug';
import { addressSchema, throwIfMissing } from '../utils/validator.js';
import { wrapCall } from '../utils/errorWrappers.js';
import { bigIntToBn } from '../utils/utils.js';

const debug = Debug('iexec:account:allowance');

export const checkAllowance = async (
  contracts = throwIfMissing(),
  ownerAddress = throwIfMissing(),
  spenderAddress = throwIfMissing(),
) => {
  try {
    const vOwnerAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(ownerAddress);
    const vSpenderAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(spenderAddress);

    const iexecContract = contracts.getIExecContract();
    const amount = await wrapCall(
      iexecContract.allowance(vOwnerAddress, vSpenderAddress),
    );
    return bigIntToBn(amount);
  } catch (error) {
    debug('checkAllowance()', error);
    throw error;
  }
};
