const Debug = require('debug');
const { httpRequest } = require('../utils/api-utils');
const { addressSchema, throwIfMissing } = require('../utils/validator');

const debug = Debug('iexec:sms:check');

const checkWeb3SecretExists = async (
  contracts = throwIfMissing(),
  smsURL = throwIfMissing(),
  resourceAddress = throwIfMissing(),
) => {
  try {
    const vResourceAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(resourceAddress);
    const res = await httpRequest('HEAD')({
      api: smsURL,
      endpoint: '/secrets/web3',
      query: {
        secretAddress: vResourceAddress,
      },
    }).catch((e) => {
      debug(e);
      throw Error(`SMS at ${smsURL} didn't answered`);
    });
    if (res.ok) {
      return true;
    }
    if (res.status === 404) {
      return false;
    }
    throw Error(
      `SMS answered with unexpected status: ${res.status} ${res.statusText}`,
    );
  } catch (error) {
    debug('checkWeb3SecretExists()', error);
    throw error;
  }
};

const checkWeb2SecretExists = async (
  contracts = throwIfMissing(),
  smsURL = throwIfMissing(),
  ownerAddress = throwIfMissing(),
  secretName = throwIfMissing(),
) => {
  try {
    const vOwnerAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(ownerAddress);
    const res = await httpRequest('HEAD')({
      api: smsURL,
      endpoint: '/secrets/web2',
      query: {
        ownerAddress: vOwnerAddress,
        secretName,
      },
    }).catch((e) => {
      debug(e);
      throw Error(`SMS at ${smsURL} didn't answered`);
    });
    if (res.ok) {
      return true;
    }
    if (res.status === 404) {
      return false;
    }
    throw Error(
      `SMS answered with unexpected status: ${res.status} ${res.statusText}`,
    );
  } catch (error) {
    debug('checkWeb2SecretExists()', error);
    throw error;
  }
};

module.exports = {
  checkWeb3SecretExists,
  checkWeb2SecretExists,
};
