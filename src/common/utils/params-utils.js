const paramsKeyName = {
  IEXEC_ARGS: 'iexec_args',
  IEXEC_INPUT_FILES: 'iexec_input_files',
  IEXEC_RESULT_ENCRYPTION: 'iexec_result_encryption',
  IEXEC_RESULT_STORAGE_PROVIDER: 'iexec_result_storage_provider',
  IEXEC_RESULT_STORAGE_PROXY: 'iexec_result_storage_proxy',
  IEXEC_DEVELOPER_LOGGER: 'iexec_developer_logger',
};

const storageProviders = () => ['ipfs', 'dropbox'];

module.exports = {
  paramsKeyName,
  storageProviders,
};
