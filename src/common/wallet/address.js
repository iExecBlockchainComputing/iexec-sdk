import { ConfigurationError } from '../utils/errors';
import { checksummedAddress } from '../utils/utils';
import { throwIfMissing } from '../utils/validator';
import { wrapCall } from '../utils/errorWrappers';

export const getAddress = async (contracts = throwIfMissing()) => {
  if (!contracts.signer) throw new ConfigurationError('Missing Signer');
  const address = await wrapCall(contracts.signer.getAddress());
  return checksummedAddress(address);
};
