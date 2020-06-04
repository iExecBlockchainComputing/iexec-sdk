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
  image: 'tee-post-compute-image', // TODO
  fingerprint: 'abc|123|abc', // TODO
};

module.exports = {
  reservedSecretKeyName,
  getStorageTokenKeyName,
  getResultEncryptionKeyName,
  teePostComputeDefaults,
};
