const { ConfigurationError } = require('../utils/errors');
const { checksummedAddress } = require('../utils/utils');
const { throwIfMissing } = require('../utils/validator');
const { wrapCall } = require('../utils/errorWrappers');

const getAddress = async (contracts = throwIfMissing()) => {
  if (!contracts.signer) throw new ConfigurationError('Missing Signer');
  const address = await wrapCall(contracts.signer.getAddress());
  return checksummedAddress(address);
};

module.exports = { getAddress };
