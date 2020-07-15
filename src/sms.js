const Debug = require('debug');
const { Buffer } = require('buffer');
const { keccak256, arrayify } = require('ethers').utils;
const { getAddress } = require('./wallet');
const { httpRequest } = require('./api-utils');
const { addressSchema, stringSchema, throwIfMissing } = require('./validator');
const { wrapPersonalSign } = require('./errorWrappers');

const debug = Debug('iexec:sms');

const DOMAIN = 'IEXEC_SMS_DOMAIN';

const concatenateAndHash = (...hexaStringArray) => {
  const buffer = Buffer.concat(
    hexaStringArray.map(hexString => Buffer.from(arrayify(hexString))),
  );
  return keccak256(buffer);
};

const getChallengeForSetWeb3Secret = (secretAddress, secretValue) => concatenateAndHash(
  keccak256(Buffer.from(DOMAIN, 'utf8')),
  secretAddress,
  keccak256(Buffer.from(secretValue, 'utf8')),
);

const getChallengeForSetWeb2Secret = (ownerAddress, secretKey, secretValue) => concatenateAndHash(
  keccak256(Buffer.from(DOMAIN, 'utf8')),
  ownerAddress,
  keccak256(Buffer.from(secretKey, 'utf8')),
  keccak256(Buffer.from(secretValue, 'utf8')),
);

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

const pushWeb3Secret = async (
  contracts = throwIfMissing(),
  smsURL = throwIfMissing(),
  resourceAddress = throwIfMissing(),
  secretValue = throwIfMissing(),
) => {
  try {
    const vResourceAddress = await addressSchema({
      ethProvider: contracts.provider,
    }).validate(resourceAddress);
    const vSignerAddress = await getAddress(contracts);
    await stringSchema().validate(secretValue, { strict: true });
    const challenge = getChallengeForSetWeb3Secret(
      vResourceAddress,
      secretValue,
    );
    const binaryChallenge = arrayify(challenge);
    const auth = await wrapPersonalSign(
      contracts.signer.signMessage(binaryChallenge),
    );
    const res = await httpRequest('POST')({
      api: smsURL,
      endpoint: '/secrets/web3',
      query: {
        secretAddress: vResourceAddress,
      },
      body: secretValue,
      headers: {
        Authorization: auth,
      },
    }).catch((e) => {
      debug(e);
      throw Error(`SMS at ${smsURL} didn't answered`);
    });
    if (res.ok) {
      return true;
    }
    if (res.status === 409) {
      throw Error(
        `Secret already exists for ${vResourceAddress} and can't be updated`,
      );
    }
    if (res.status === 401) {
      throw Error(
        `Wallet ${vSignerAddress} is not allowed to set secret for ${vResourceAddress}`,
      );
    }
    throw Error(
      `SMS answered with unexpected status: ${res.status} ${res.statusText}`,
    );
  } catch (error) {
    debug('pushWeb3Secret()', error);
    throw error;
  }
};

const pushWeb2Secret = async (
  contracts = throwIfMissing(),
  smsURL = throwIfMissing(),
  secretName = throwIfMissing(),
  secretValue = throwIfMissing(),
  { forceUpdate = false } = {},
) => {
  try {
    const ownerAddress = await getAddress(contracts);
    await stringSchema().validate(secretName, { strict: true });
    await stringSchema().validate(secretValue, { strict: true });
    const secretExists = await checkWeb2SecretExists(
      contracts,
      smsURL,
      ownerAddress,
      secretName,
    );
    if (secretExists && !forceUpdate) {
      throw Error(`Secret "${secretName}" already exists for ${ownerAddress}`);
    }
    const update = !!secretExists;
    const challenge = getChallengeForSetWeb2Secret(
      ownerAddress,
      secretName,
      secretValue,
    );
    const binaryChallenge = arrayify(challenge);
    const auth = await wrapPersonalSign(
      contracts.signer.signMessage(binaryChallenge),
    );
    const res = await httpRequest(update ? 'PUT' : 'POST')({
      api: smsURL,
      endpoint: '/secrets/web2',
      query: {
        ownerAddress,
        secretName,
      },
      body: secretValue,
      headers: {
        Authorization: auth,
      },
    }).catch((e) => {
      debug(e);
      throw Error(`SMS at ${smsURL} didn't answered`);
    });
    if (res.ok) {
      return {
        isPushed: true,
        isUpdated: update,
      };
    }
    throw Error(
      `SMS answered with unexpected status: ${res.status} ${res.statusText}`,
    );
  } catch (error) {
    debug('pushWeb2Secret()', error);
    throw error;
  }
};

module.exports = {
  pushWeb2Secret,
  pushWeb3Secret,
  checkWeb3SecretExists,
  checkWeb2SecretExists,
};
