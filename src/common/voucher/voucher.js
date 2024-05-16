import Debug from 'debug';
import { Contract } from 'ethers';
import { abi } from './abi/Voucher.js';
import { throwIfMissing } from '../utils/validator.js';
import { fetchVoucherAddress } from './voucherHub.js';

const debug = Debug('iexec:voucher:voucher');

const getVoucherContract = (
  contracts = throwIfMissing(),
  voucherAddress = throwIfMissing(),
) => new Contract(voucherAddress, abi, contracts.provider);

export const fetchVoucherContract = async (
  contracts = throwIfMissing(),
  voucherHubAddress = throwIfMissing(),
  owner,
) => {
  try {
    const voucherAddress = await fetchVoucherAddress(
      contracts,
      voucherHubAddress,
      owner,
    );
    if (voucherAddress) {
      return getVoucherContract(contracts, voucherAddress);
    }
    return undefined;
  } catch (error) {
    debug('fetchVoucherContract()', error);
    throw error;
  }
};
