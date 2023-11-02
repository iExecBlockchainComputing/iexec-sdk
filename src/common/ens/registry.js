import Debug from 'debug';
import { throwIfMissing } from '../utils/validator.js';
import { wrapCall } from '../utils/errorWrappers.js';
import { ConfigurationError } from '../utils/errors.js';

const debug = Debug('iexec:ens:registry');

export const getEnsRegistryAddress = async (contracts = throwIfMissing()) => {
  try {
    const network = await wrapCall(contracts.provider.getNetwork());
    const ensPlugin = network.getPlugin('org.ethers.plugins.network.Ens');
    if (!ensPlugin || !ensPlugin.address) {
      throw new ConfigurationError('Network does not support ENS');
    }
    return ensPlugin.address;
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
