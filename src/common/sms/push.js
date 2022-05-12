const Debug = require('debug');
const { Buffer } = require('buffer');
const { keccak256, arrayify } = require('ethers').utils;
const { getAddress } = require('../wallet/address');
const { httpRequest } = require('../utils/api-utils');
const {
  addressSchema,
  stringSchema,
  throwIfMissing,
} = require('../utils/validator');
const { wrapPersonalSign } = require('../utils/errorWrappers');
const { checkSigner } = require('../utils/utils');
const {
  checkWeb2SecretExists,
  checkRequesterSecretExists,
} = require('./check');

const debug = Debug('iexec:sms');

const DOMAIN = 'IEXEC_SMS_DOMAIN';

const concatenateAndHash = (...hexaStringArray) => {
  const buffer = Buffer.concat(
    hexaStringArray.map((hexString) => Buffer.from(arrayify(hexString))),
  );
  return keccak256(buffer);
};

const getChallengeForSetWeb3Secret = (secretAddress, secretValue) =>
  concatenateAndHash(
    keccak256(Buffer.from(DOMAIN, 'utf8')),
    secretAddress,
    keccak256(Buffer.from(secretValue, 'utf8')),
  );

const getChallengeForSetWeb2Secret = (ownerAddress, secretKey, secretValue) =>
  concatenateAndHash(
    keccak256(Buffer.from(DOMAIN, 'utf8')),
    ownerAddress,
    keccak256(Buffer.from(secretKey, 'utf8')),
    keccak256(Buffer.from(secretValue, 'utf8')),
  );

const pushWeb3Secret = async (
  contracts = throwIfMissing(),
  smsURL = throwIfMissing(),
  resourceAddress = throwIfMissing(),
  secretValue = throwIfMissing(),
) => {
  try {
    checkSigner(contracts);
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
    checkSigner(contracts);
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

const pushRequesterSecret = async (
  contracts = throwIfMissing(),
  smsURL = throwIfMissing(),
  secretName = throwIfMissing(),
  secretValue = throwIfMissing(),
) => {
  try {
    checkSigner(contracts);
    const requesterAddress = await getAddress(contracts);
    await stringSchema().validate(secretName, { strict: true });
    await stringSchema().validate(secretValue, { strict: true });
    const secretExists = await checkRequesterSecretExists(
      contracts,
      smsURL,
      requesterAddress,
      secretName,
    );
    if (secretExists) {
      throw Error(
        `Secret "${secretName}" already exists for ${requesterAddress}`,
      );
    }
    const challenge = getChallengeForSetWeb2Secret(
      requesterAddress,
      secretName,
      secretValue,
    );
    const binaryChallenge = arrayify(challenge);
    const auth = await wrapPersonalSign(
      contracts.signer.signMessage(binaryChallenge),
    );
    const res = await httpRequest('POST')({
      api: smsURL,
      endpoint: `/requesters/${requesterAddress}/secrets/${secretName}`,
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
      };
    }
    throw Error(
      `SMS answered with unexpected status: ${res.status} ${res.statusText}`,
    );
  } catch (error) {
    debug('pushRequesterSecret()', error);
    throw error;
  }
};

module.exports = {
  pushWeb2Secret,
  pushWeb3Secret,
  pushRequesterSecret,
};
