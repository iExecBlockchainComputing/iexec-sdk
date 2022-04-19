const Debug = require('debug');
const { throwIfMissing } = require('../utils/validator');
const { wrapCall } = require('../utils/errorWrappers');
const { ConfigurationError } = require('../utils/errors');

const debug = Debug('iexec:ens:registry');

const getEnsRegistryAddress = async (contracts = throwIfMissing()) => {
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

const checkEns = async (contracts = throwIfMissing()) => {
  try {
    await getEnsRegistryAddress(contracts);
  } catch (e) {
    debug('checkEns()', e);
    throw e;
  }
};

module.exports = { getEnsRegistryAddress, checkEns };
