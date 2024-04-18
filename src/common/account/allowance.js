import Debug from 'debug';
import BN from 'bn.js';
import {
  addressSchema,
  nRlcAmountSchema,
  throwIfMissing,
} from '../utils/validator.js';
import { isInWhitelist } from '../wallet/enterprise.js';
import { getAddress } from '../wallet/address.js';
import { checkSigner } from '../utils/utils.js';

const debug = Debug('iexec:account:allowance');

export const approve = async (
  contracts = throwIfMissing(),
  amount = throwIfMissing(),
  spenderAddress = throwIfMissing(),
) => {
  try {
    checkSigner(contracts);
    const vAmount = await nRlcAmountSchema().validate(amount);
    if (new BN(vAmount).lte(new BN(0)))
      throw Error('Approve amount must be greater than 0');
    if (contracts.flavour === 'enterprise') {
      await isInWhitelist(contracts, await getAddress(contracts), {
        strict: true,
      });
    }

    const vSpenderAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(spenderAddress);

    const iexecContract = contracts.getIExecContract();
    const tx = await iexecContract.approve(vSpenderAddress, vAmount);
    return tx.hash;
  } catch (error) {
    debug('approve()', error);
    throw error;
  }
};
