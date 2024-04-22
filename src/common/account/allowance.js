import Debug from 'debug';
import BN from 'bn.js';
import {
  addressSchema,
  throwIfMissing,
  nRlcAmountSchema,
} from '../utils/validator.js';
import { wrapCall, wrapSend, wrapWait } from '../utils/errorWrappers.js';
import { bigIntToBn, checkSigner, checkEventFromLogs } from '../utils/utils.js';

const debug = Debug('iexec:account:allowance');

export const approve = async (
  contracts = throwIfMissing(),
  amount = throwIfMissing(),
  spenderAddress = throwIfMissing(),
) => {
  try {
    checkSigner(contracts);
    const vAmount = await nRlcAmountSchema().validate(amount);
    if (new BN(vAmount).lten(new BN(0)))
      throw Error('Approve amount must be less than or equals 0');
    const vSpenderAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(spenderAddress);
    const iexecContract = contracts.getIExecContract();
    const tx = await wrapSend(
      iexecContract.approve(vSpenderAddress, vAmount, contracts.txOptions),
    );
    const txReceipt = await wrapWait(tx.wait(contracts.confirms));

    if (!checkEventFromLogs('Approval', txReceipt.logs))
      throw Error('Approve not confirmed');

    return tx.hash;
  } catch (error) {
    debug('approve()', error);
    throw error;
  }
};

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
