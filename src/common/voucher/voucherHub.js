import Debug from 'debug';

import { addressSchema, throwIfMissing } from '../utils/validator.js';
import { wrapCall } from '../utils/errorWrappers.js';
import { NULL_ADDRESS } from '../utils/constant.js';
import { getVoucherHubContract } from '../utils/voucher-utils.js';

const debug = Debug('iexec:voucher:voucherHub');

export const fetchVoucherAddress = async (
  contracts = throwIfMissing(),
  voucherHubAddress = throwIfMissing(),
  owner,
) => {
  try {
    const vOwner = await addressSchema({ ethProvider: contracts.provider })
      .label('owner')
      .validate(owner);
    const voucherHubContract = getVoucherHubContract(
      contracts,
      voucherHubAddress,
    );
    const address = await wrapCall(voucherHubContract.getVoucher(vOwner));
    return address !== NULL_ADDRESS ? address : null;
  } catch (error) {
    debug('fetchVoucherAddress()', error);
    throw error;
  }
};
