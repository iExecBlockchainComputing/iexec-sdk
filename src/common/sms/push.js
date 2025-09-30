import Debug from 'debug';
import { Buffer } from 'buffer';
import { keccak256, getBytes } from 'ethers';
import { getAddress } from '../wallet/address.js';
import { httpRequest } from '../utils/api-utils.js';
import {
  addressSchema,
  stringSchema,
  throwIfMissing,
} from '../utils/validator.js';
import { wrapPersonalSign } from '../utils/errorWrappers.js';
import { checkSigner } from '../utils/utils.js';
import { checkWeb2SecretExists, checkRequesterSecretExists } from './check.js';
import { SmsCallError } from '../utils/errors.js';

const debug = Debug('iexec:sms');

const DOMAIN = 'IEXEC_SMS_DOMAIN';

const concatenateAndHash = (...hexStringArray) => {
  const buffer = Buffer.concat(
    hexStringArray.map((hexString) => Buffer.from(getBytes(hexString))),
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

const handleNonUpdatablePushSecret = ({
  response,
  signerAddress,
  targetAddress,
}) => {
  if (response.ok) {
    return true;
  }
  if (response.status === 409) {
    throw new Error(
      `Secret already exists for ${targetAddress} and can't be updated`,
    );
  }
  if (response.status === 401) {
    throw new Error(
      `Wallet ${signerAddress} is not allowed to set secret for ${targetAddress}`,
    );
  }
  throw new Error(
    `SMS answered with unexpected status: ${response.status} ${response.statusText}`,
  );
};

export const pushWeb3Secret = async (
  contracts = throwIfMissing(),
  smsURL = throwIfMissing(),
  resourceAddress,
  secretValue,
) => {
  try {
    checkSigner(contracts);
    const vResourceAddress = await addressSchema({
      ethProvider: contracts.provider,
    })
      .required()
      .validate(resourceAddress);
    const vSignerAddress = await getAddress(contracts);
    await stringSchema().validate(secretValue, { strict: true });
    const challenge = getChallengeForSetWeb3Secret(
      vResourceAddress,
      secretValue,
    );
    const binaryChallenge = getBytes(challenge);
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
      ApiCallErrorClass: SmsCallError,
    });
    return handleNonUpdatablePushSecret({
      response: res,
      signerAddress: vSignerAddress,
      targetAddress: vResourceAddress,
    });
  } catch (error) {
    debug('pushWeb3Secret()', error);
    throw error;
  }
};

export const pushWeb2Secret = async (
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
      throw new Error(
        `Secret "${secretName}" already exists for ${ownerAddress}`,
      );
    }
    const update = !!secretExists;
    const challenge = getChallengeForSetWeb2Secret(
      ownerAddress,
      secretName,
      secretValue,
    );
    const binaryChallenge = getBytes(challenge);
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
      ApiCallErrorClass: SmsCallError,
    });
    if (res.ok) {
      return {
        isPushed: true,
        isUpdated: update,
      };
    }
    throw new Error(
      `SMS answered with unexpected status: ${res.status} ${res.statusText}`,
    );
  } catch (error) {
    debug('pushWeb2Secret()', error);
    throw error;
  }
};

export const pushRequesterSecret = async (
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
      throw new Error(
        `Secret "${secretName}" already exists for ${requesterAddress}`,
      );
    }
    const challenge = getChallengeForSetWeb2Secret(
      requesterAddress,
      secretName,
      secretValue,
    );
    const binaryChallenge = getBytes(challenge);
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
      ApiCallErrorClass: SmsCallError,
    });
    if (res.ok) {
      return {
        isPushed: true,
      };
    }
    throw new Error(
      `SMS answered with unexpected status: ${res.status} ${res.statusText}`,
    );
  } catch (error) {
    debug('pushRequesterSecret()', error);
    throw error;
  }
};

export const pushAppSecret = async (
  contracts = throwIfMissing(),
  smsURL = throwIfMissing(),
  appAddress,
  secretValue,
) => {
  try {
    checkSigner(contracts);
    const vSignerAddress = await getAddress(contracts);
    const vAppAddress = await addressSchema({
      ethProvider: contracts.provider,
    })
      .required()
      .validate(appAddress);
    await stringSchema().validate(secretValue, { strict: true });
    const challenge = getChallengeForSetWeb2Secret(
      vAppAddress,
      '1', // used to be secret index (hardcoded to "1")
      secretValue,
    );
    const binaryChallenge = getBytes(challenge);
    const auth = await wrapPersonalSign(
      contracts.signer.signMessage(binaryChallenge),
    );
    const res = await httpRequest('POST')({
      api: smsURL,
      endpoint: `/apps/${vAppAddress}/secrets`,
      body: secretValue,
      headers: {
        Authorization: auth,
      },
      ApiCallErrorClass: SmsCallError,
    });
    return handleNonUpdatablePushSecret({
      response: res,
      signerAddress: vSignerAddress,
      targetAddress: vAppAddress,
    });
  } catch (error) {
    debug('pushAppSecret()', error);
    throw error;
  }
};
