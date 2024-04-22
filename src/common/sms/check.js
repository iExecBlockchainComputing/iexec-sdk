import Debug from 'debug';
import { httpRequest } from '../utils/api-utils.js';
import {
  addressSchema,
  throwIfMissing,
  positiveIntSchema,
} from '../utils/validator.js';

const debug = Debug('iexec:sms:check');

const existingSecretsCache = {};

const checkCache = ({ smsUrl, kindOfSecret, secretId }) =>
  existingSecretsCache?.[smsUrl]?.[kindOfSecret]?.[secretId];

const cacheSecretExists = ({ smsURL, kindOfSecret, secretId }) => {
  if (!existingSecretsCache[smsURL]) {
    existingSecretsCache[smsURL] = {};
  }
  if (!existingSecretsCache[smsURL][kindOfSecret]) {
    existingSecretsCache[smsURL][kindOfSecret] = {};
  }
  existingSecretsCache[smsURL][kindOfSecret][secretId] = true;
};

// used for dataset key
export const checkWeb3SecretExists = async (
  contracts = throwIfMissing(),
  smsURL = throwIfMissing(),
  resourceAddress = throwIfMissing(),
) => {
  try {
    const vResourceAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(resourceAddress);
    const kindOfSecret = 'web3';
    const secretId = vResourceAddress;
    const cached = checkCache({ smsURL, kindOfSecret, secretId });
    if (cached !== undefined) {
      return cached;
    }
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
      cacheSecretExists({ smsURL, kindOfSecret, secretId });
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

// used for beneficiary key
export const checkWeb2SecretExists = async (
  contracts = throwIfMissing(),
  smsURL = throwIfMissing(),
  ownerAddress = throwIfMissing(),
  secretName = throwIfMissing(),
) => {
  try {
    const vOwnerAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(ownerAddress);
    const kindOfSecret = 'web2';
    const secretId = `${vOwnerAddress}|${secretName}`;
    const cached = checkCache({ smsURL, kindOfSecret, secretId });
    if (cached !== undefined) {
      return cached;
    }
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
      cacheSecretExists({ smsURL, kindOfSecret, secretId });
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

export const checkRequesterSecretExists = async (
  contracts = throwIfMissing(),
  smsURL = throwIfMissing(),
  requesterAddress = throwIfMissing(),
  secretName = throwIfMissing(),
) => {
  try {
    const vRequesterAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(requesterAddress);
    const kindOfSecret = 'requester';
    const secretId = `${vRequesterAddress}|${secretName}`;
    const cached = checkCache({ smsURL, kindOfSecret, secretId });
    if (cached !== undefined) {
      return cached;
    }
    const res = await httpRequest('HEAD')({
      api: smsURL,
      endpoint: `/requesters/${vRequesterAddress}/secrets/${secretName}`,
    }).catch((e) => {
      debug(e);
      throw Error(`SMS at ${smsURL} didn't answered`);
    });
    if (res.ok) {
      cacheSecretExists({ smsURL, kindOfSecret, secretId });
      return true;
    }
    if (res.status === 404) {
      return false;
    }
    throw Error(
      `SMS answered with unexpected status: ${res.status} ${res.statusText}`,
    );
  } catch (error) {
    debug('checkRequesterSecretExists()', error);
    throw error;
  }
};

export const checkAppSecretExists = async (
  contracts = throwIfMissing(),
  smsURL = throwIfMissing(),
  appAddress = throwIfMissing(),
  secretIndex = 1,
) => {
  try {
    const vAppAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(appAddress);
    const vSecretIndex = await positiveIntSchema().validate(secretIndex);
    const kindOfSecret = 'app';
    const secretId = `${vAppAddress}|${vSecretIndex}`;
    const cached = checkCache({ smsURL, kindOfSecret, secretId });
    if (cached !== undefined) {
      return cached;
    }
    const res = await httpRequest('HEAD')({
      api: smsURL,
      endpoint: `/apps/${vAppAddress}/secrets/${vSecretIndex}`,
    }).catch((e) => {
      debug(e);
      throw Error(`SMS at ${smsURL} didn't answered`);
    });
    if (res.ok) {
      cacheSecretExists({ smsURL, kindOfSecret, secretId });
      return true;
    }
    if (res.status === 404) {
      return false;
    }
    throw Error(
      `SMS answered with unexpected status: ${res.status} ${res.statusText}`,
    );
  } catch (error) {
    debug('checkRequesterSecretExists()', error);
    throw error;
  }
};
