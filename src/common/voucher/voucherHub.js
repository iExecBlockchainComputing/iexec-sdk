import Debug from 'debug';
import { Contract } from 'ethers';
import { abi } from './abi/VoucherHub.js';
import { addressSchema, throwIfMissing } from '../utils/validator.js';
import { wrapCall } from '../utils/errorWrappers.js';
import { NULL_ADDRESS } from '../utils/constant.js';

const debug = Debug('iexec:voucher:voucherHub');

const getVoucherHubContract = (
  contracts = throwIfMissing(),
  voucherHubAddress = throwIfMissing(),
) => new Contract(voucherHubAddress, abi, contracts.provider);

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
    return address !== NULL_ADDRESS ? address : undefined;
  } catch (error) {
    debug('fetchVoucherAddress()', error);
    throw error;
  }
};
