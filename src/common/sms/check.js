import Debug from 'debug';
import { httpRequest } from '../utils/api-utils.js';
import {
  addressSchema,
  throwIfMissing,
  positiveIntSchema,
} from '../utils/validator.js';

const debug = Debug('iexec:sms:check');

let secretOkCache;
const CACHE_TTL_MILLISECONDS = 60000;

const initializeTTLCache = () => {
  secretOkCache = [
    [], // web3 secrets
    {}, // requester secrets
    [], // app secrets
  ];
  setTimeout(() => {
    secretOkCache = undefined;
  }, CACHE_TTL_MILLISECONDS);
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
    if (!secretOkCache) {
      initializeTTLCache();
    }
    if (secretOkCache[0].includes(resourceAddress)) {
      return true;
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
      secretOkCache[0].push(resourceAddress);
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
    if (!secretOkCache) {
      initializeTTLCache();
    }
    if (secretOkCache[1][requesterAddress]?.includes(secretName)) {
      return true;
    }
    const res = await httpRequest('HEAD')({
      api: smsURL,
      endpoint: `/requesters/${vRequesterAddress}/secrets/${secretName}`,
    }).catch((e) => {
      debug(e);
      throw Error(`SMS at ${smsURL} didn't answered`);
    });
    if (res.ok) {
      // eslint-disable-next-line no-unused-expressions
      secretOkCache[1][requesterAddress]
        ? secretOkCache[1][requesterAddress].push(secretName)
        : (secretOkCache[1][requesterAddress] = [secretName]);
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
    if (!secretOkCache) {
      initializeTTLCache();
    }
    if (secretOkCache[2].includes(appAddress)) {
      return true;
    }
    const res = await httpRequest('HEAD')({
      api: smsURL,
      endpoint: `/apps/${vAppAddress}/secrets/${vSecretIndex}`,
    }).catch((e) => {
      debug(e);
      throw Error(`SMS at ${smsURL} didn't answered`);
    });
    if (res.ok) {
      secretOkCache[2].push(appAddress);
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
