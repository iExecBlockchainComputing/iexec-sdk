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
  image: 'iexechub/tee-worker-post-compute:1.0.0',
  fingerprint:
    '7f9f64e152f30d3f6e450d18fd64d6cd5d323d2af3fd153a3697a155a0d8f113|aa413ae09b0483bf8bbaf83cf4cc6957|13076027fc67accba753a3ed2edf03227dfd013b450d68833a5589ec44132100',
};

module.exports = {
  reservedSecretKeyName,
  getStorageTokenKeyName,
  getResultEncryptionKeyName,
  teePostComputeDefaults,
};
