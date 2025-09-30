import Debug from 'debug';
import { httpRequest } from '../utils/api-utils.js';
import { addressSchema, throwIfMissing } from '../utils/validator.js';
import { SmsCallError } from '../utils/errors.js';

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
  resourceAddress,
) => {
  try {
    const vResourceAddress = await addressSchema({
      ethProvider: contracts.provider,
    })
      .required()
      .validate(resourceAddress);
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
      ApiCallErrorClass: SmsCallError,
    });
    if (res.ok) {
      cacheSecretExists({ smsURL, kindOfSecret, secretId });
      return true;
    }
    if (res.status === 404) {
      return false;
    }
    throw new Error(
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
  ownerAddress,
  secretName,
) => {
  try {
    const vOwnerAddress = await addressSchema({
      ethProvider: contracts.provider,
    })
      .required()
      .validate(ownerAddress);
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
      ApiCallErrorClass: SmsCallError,
    });
    if (res.ok) {
      cacheSecretExists({ smsURL, kindOfSecret, secretId });
      return true;
    }
    if (res.status === 404) {
      return false;
    }
    throw new Error(
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
      ApiCallErrorClass: SmsCallError,
    });
    if (res.ok) {
      cacheSecretExists({ smsURL, kindOfSecret, secretId });
      return true;
    }
    if (res.status === 404) {
      return false;
    }
    throw new Error(
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
  appAddress,
) => {
  try {
    const vAppAddress = await addressSchema({
      ethProvider: contracts.provider,
    })
      .required()
      .validate(appAddress);
    const kindOfSecret = 'app';
    const secretId = vAppAddress;
    const cached = checkCache({ smsURL, kindOfSecret, secretId });
    if (cached !== undefined) {
      return cached;
    }
    const res = await httpRequest('HEAD')({
      api: smsURL,
      endpoint: `/apps/${vAppAddress}/secrets`,
      ApiCallErrorClass: SmsCallError,
    });
    if (res.ok) {
      cacheSecretExists({ smsURL, kindOfSecret, secretId });
      return true;
    }
    if (res.status === 404) {
      return false;
    }
    throw new Error(
      `SMS answered with unexpected status: ${res.status} ${res.statusText}`,
    );
  } catch (error) {
    debug('checkRequesterSecretExists()', error);
    throw error;
  }
};
