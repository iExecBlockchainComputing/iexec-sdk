import Debug from 'debug';
import { throwIfMissing } from '../utils/validator';
import { wrapCall } from '../utils/errorWrappers';
import { ConfigurationError } from '../utils/errors';

const debug = Debug('iexec:ens:registry');

export const getEnsRegistryAddress = async (contracts = throwIfMissing()) => {
  try {
    const { ensAddress } = await wrapCall(contracts.provider.getNetwork());
    if (!ensAddress) {
      throw new ConfigurationError('Network does not support ENS');
    }
    return ensAddress;
  } catch (e) {
    debug('getEnsRegistryAddress()', e);
    throw e;
  }
};

export const checkEns = async (contracts = throwIfMissing()) => {
  try {
    await getEnsRegistryAddress(contracts);
  } catch (e) {
    debug('checkEns()', e);
    throw e;
  }
};
