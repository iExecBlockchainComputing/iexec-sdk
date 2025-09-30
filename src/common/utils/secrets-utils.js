import { STORAGE_PROVIDERS } from './constant.js';

export const reservedSecretKeyName = {
  // result encryption
  IEXEC_RESULT_ENCRYPTION_PUBLIC_KEY: 'iexec-result-encryption-public-key',
  // result storage
  IEXEC_RESULT_DROPBOX_TOKEN: 'iexec-result-dropbox-token',
  IEXEC_RESULT_IEXEC_IPFS_TOKEN: 'iexec-result-iexec-ipfs-token',
};

export const getStorageTokenKeyName = (provider) => {
  switch (provider) {
    case undefined:
    case 'default':
    case STORAGE_PROVIDERS.IPFS:
      return reservedSecretKeyName.IEXEC_RESULT_IEXEC_IPFS_TOKEN;
    case STORAGE_PROVIDERS.DROPBOX:
      return reservedSecretKeyName.IEXEC_RESULT_DROPBOX_TOKEN;
    default:
      throw new Error(`"${provider}" not supported`);
  }
};

export const getResultEncryptionKeyName = () =>
  reservedSecretKeyName.IEXEC_RESULT_ENCRYPTION_PUBLIC_KEY;
