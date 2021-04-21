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
  image: 'iexechub/tee-worker-post-compute:1.1.0-SNAPSHOT-88eb9c5',
  fingerprint:
    '56fe4d3da17a83a1c0eaf67e7ca78a0c90e8907135edaf10fadda1903f8a8390|dafddc9bd314a1513f3f129aa290a97c|13076027fc67accba753a3ed2edf03227dfd013b450d68833a5589ec44132100',
};

module.exports = {
  reservedSecretKeyName,
  getStorageTokenKeyName,
  getResultEncryptionKeyName,
  teePostComputeDefaults,
};
