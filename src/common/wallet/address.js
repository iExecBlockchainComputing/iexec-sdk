import { ConfigurationError } from '../utils/errors.js';
import { checksummedAddress } from '../utils/utils.js';
import { throwIfMissing } from '../utils/validator.js';
import { wrapCall } from '../utils/errorWrappers.js';

export const getAddress = async (contracts = throwIfMissing()) => {
  if (!contracts.signer) throw new ConfigurationError('Missing Signer');
  const address = await wrapCall(contracts.signer.getAddress());
  return checksummedAddress(address);
};
