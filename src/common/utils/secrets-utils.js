const reservedSecretKeyName = {
  // result encryption
  IEXEC_RESULT_ENCRYPTION_PUBLIC_KEY: 'iexec-result-encryption-public-key',
  // result storage
  IEXEC_RESULT_DROPBOX_TOKEN: 'iexec-result-dropbox-token',
  IEXEC_RESULT_IEXEC_IPFS_TOKEN: 'iexec-result-iexec-ipfs-token',
};

const getStorageTokenKeyName = (provider) => {
  switch (provider) {
    case undefined:
    case 'default':
    case 'ipfs':
      return reservedSecretKeyName.IEXEC_RESULT_IEXEC_IPFS_TOKEN;
    case 'dropbox':
      return reservedSecretKeyName.IEXEC_RESULT_DROPBOX_TOKEN;
    default:
      throw Error(`"${provider}" not supported`);
  }
};

const getResultEncryptionKeyName = () => reservedSecretKeyName.IEXEC_RESULT_ENCRYPTION_PUBLIC_KEY;

const teePostComputeDefaults = {
  image: 'iexechub/tee-worker-post-compute:f7ac8d2-dev',
  fingerprint:
    '323a0ea7dbc6c49eac074587d4349ce2fda147bf0354a77a4fc54c267e293c30',
};

module.exports = {
  reservedSecretKeyName,
  getStorageTokenKeyName,
  getResultEncryptionKeyName,
  teePostComputeDefaults,
};
