import { STORAGE_PROVIDERS } from './constant.js';

export const reservedSecretKeyName = {
  // result encryption
  IEXEC_RESULT_ENCRYPTION_PUBLIC_KEY: 'iexec-result-encryption-public-key',
  // result storage
  IEXEC_RESULT_DROPBOX_TOKEN: 'iexec-result-dropbox-token',
};

export const getStorageTokenKeyName = (provider) => {
  switch (provider) {
    case STORAGE_PROVIDERS.IPFS:
      return undefined; // no token needed for ipfs
    case STORAGE_PROVIDERS.DROPBOX:
      return reservedSecretKeyName.IEXEC_RESULT_DROPBOX_TOKEN;
    default:
      return undefined; // unknown provider, no token key name
  }
};

export const getResultEncryptionKeyName = () =>
  reservedSecretKeyName.IEXEC_RESULT_ENCRYPTION_PUBLIC_KEY;
