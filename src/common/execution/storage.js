import { checkWeb2SecretExists } from '../sms/check.js';
import { pushWeb2Secret } from '../sms/push.js';
import { getStorageTokenKeyName } from '../utils/secrets-utils.js';
import { addressSchema, storageProviderSchema } from '../utils/validator.js';

export const checkStorageTokenExists = async (
  { smsURL },
  address,
  provider,
) => {
  const vAddress = await addressSchema().validate(address);
  const vProvider = await storageProviderSchema().validate(provider);
  const storageTokenKeyName = getStorageTokenKeyName(vProvider);
  if (storageTokenKeyName) {
    return checkWeb2SecretExists(smsURL, vAddress, storageTokenKeyName);
  } else {
    throw new Error(
      `Storage provider "${vProvider}" does not support authentication tokens`,
    );
  }
};

export const pushStorageToken = async (
  { contracts, smsURL },
  token,
  provider,
  { forceUpdate = false } = {},
) => {
  const vProvider = await storageProviderSchema().validate(provider);
  const storageTokenKeyName = getStorageTokenKeyName(vProvider);
  if (storageTokenKeyName) {
    return pushWeb2Secret(contracts, smsURL, storageTokenKeyName, token, {
      forceUpdate,
    });
  } else {
    throw new Error(
      `Storage provider "${vProvider}" does not support authentication tokens`,
    );
  }
};
