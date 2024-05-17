import Debug from 'debug';
import { Contract } from 'ethers';
import { abi } from './abi/Voucher.js';
import { addressSchema, throwIfMissing } from '../utils/validator.js';
import { fetchVoucherAddress } from './voucherHub.js';
import { checkSigner } from '../utils/utils.js';
import { getAddress } from '../wallet/address.js';
import { wrapSend } from '../utils/errorWrappers.js';

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

export const authorizeRequester = async (
  contracts = throwIfMissing(),
  voucherHubAddress = throwIfMissing(),
  requester,
) => {
  try {
    checkSigner(contracts);
    const userAddress = await getAddress(contracts);
    const vRequester = await addressSchema({
      ethProvider: contracts.provider,
    })
      .required()
      .label('requester')
      .validate(requester);
    const voucherContract = await fetchVoucherContract(
      contracts,
      voucherHubAddress,
      userAddress,
    );
    if (!voucherContract) {
      throw Error(`No Voucher found for address ${userAddress}`);
    }
    const tx = await wrapSend(
      voucherContract
        .connect(contracts.signer)
        .authorizeAccount(vRequester, contracts.txOptions),
    );
    await tx.wait();
    return tx.hash;
  } catch (error) {
    debug('authorizeRequester()', error);
    throw error;
  }
};
