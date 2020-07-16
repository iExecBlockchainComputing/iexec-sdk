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
    '76bfdee97e692b729e989694f3a566cf0e1de95fc456ff5ee88c75b1cb865e33|1eb627c1c94bbca03178b099b13fb4d1|13076027fc67accba753a3ed2edf03227dfd013b450d68833a5589ec44132100',
};

module.exports = {
  reservedSecretKeyName,
  getStorageTokenKeyName,
  getResultEncryptionKeyName,
  teePostComputeDefaults,
};
