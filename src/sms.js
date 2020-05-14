const Debug = require('debug');
const { Buffer } = require('buffer');
const qs = require('query-string');
const { keccak256, arrayify } = require('ethers').utils;
const { getAddress } = require('./wallet');
const { addressSchema, stringSchema, throwIfMissing } = require('./validator');
const { wrapPersonalSign } = require('./errorWrappers');
const { httpCall } = require('./utils');

const debug = Debug('iexec:sms');

const DOMAIN = 'IEXEC_SMS_DOMAIN';

const concatenateAndHash = (...hexaStringArray) => {
  const buffer = Buffer.concat(
    hexaStringArray.map(hexString => arrayify(hexString)),
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
      ethProvider: contracts.jsonRpcProvider,
    }).validate(resourceAddress);
    const res = await httpCall('HEAD')(
      `${smsURL}/secrets/web3?${qs.stringify({
        secretAddress: vResourceAddress,
      })}`,
      undefined,
      {},
    ).catch((e) => {
      debug(e);
      throw Error(`SMS at ${smsURL} didn't answered`);
    });
    if (res.ok) {
      return true;
    }
    if (res.status === 404) {
      return false;
    }
    return { error: res.errorMessage };
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
      ethProvider: contracts.jsonRpcProvider,
    }).validate(ownerAddress);
    const res = await httpCall('HEAD')(
      `${smsURL}/secrets/web2?${qs.stringify({
        ownerAddress: vOwnerAddress,
        secretName,
      })}`,
      undefined,
      {},
    ).catch((e) => {
      debug(e);
      throw Error(`SMS at ${smsURL} didn't answered`);
    });
    if (res.ok) {
      return true;
    }
    if (res.status === 404) {
      return false;
    }
    return { error: res.errorMessage };
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
      ethProvider: contracts.jsonRpcProvider,
    }).validate(resourceAddress);
    const vSignerAddress = await getAddress(contracts);
    await stringSchema().validate(secretValue, { strict: true });
    const challenge = getChallengeForSetWeb3Secret(
      vResourceAddress,
      secretValue,
    );
    const binaryChallenge = arrayify(challenge);
    const personnalSign = data => contracts.jsonRpcProvider.send('personal_sign', [vSignerAddress, data]);
    const auth = await wrapPersonalSign(personnalSign(binaryChallenge));
    const res = await httpCall('POST')(
      `${smsURL}/secrets/web3?${qs.stringify({
        secretAddress: vResourceAddress,
      })}`,
      secretValue,
      {
        Authorization: auth,
      },
    ).catch((e) => {
      debug(e);
      throw Error(`SMS at ${smsURL} didn't answered`);
    });
    if (res.ok) {
      return true;
    }
    if (res.status === 409) {
      throw Error(
        `secret already exists for ${vResourceAddress} and can't be updated`,
      );
    }
    if (res.status === 401) {
      throw Error(
        `wallet ${vSignerAddress} is not allowed to set secret for ${vResourceAddress}`,
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
      throw Error(`secret "${secretName}" already exists for ${ownerAddress}`);
    }
    const update = !!secretExists;
    const challenge = getChallengeForSetWeb2Secret(
      ownerAddress,
      secretName,
      secretValue,
    );
    const binaryChallenge = arrayify(challenge);
    const personnalSign = data => contracts.jsonRpcProvider.send('personal_sign', [ownerAddress, data]);
    const auth = await wrapPersonalSign(personnalSign(binaryChallenge));
    const res = await httpCall(update ? 'PUT' : 'POST')(
      `${smsURL}/secrets/web2?${qs.stringify({
        ownerAddress,
        secretName,
      })}`,
      secretValue,
      {
        Authorization: auth,
      },
    ).catch((e) => {
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
