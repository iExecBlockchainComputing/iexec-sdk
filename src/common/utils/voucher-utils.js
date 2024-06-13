import { Contract } from 'ethers';
import { throwIfMissing } from './validator.js';
import { abi as voucherHubAbi } from '../voucher/abi/VoucherHub.js';
import { abi as voucherAbi } from '../voucher/abi/Voucher.js';

export const getVoucherContract = (
  contracts = throwIfMissing(),
  voucherAddress = throwIfMissing(),
) => new Contract(voucherAddress, voucherAbi, contracts.provider);

export const getVoucherHubContract = (
  contracts = throwIfMissing(),
  voucherHubAddress = throwIfMissing(),
) => new Contract(voucherHubAddress, voucherHubAbi, contracts.provider);
