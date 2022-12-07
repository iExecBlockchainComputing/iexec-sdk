const APP = 'app';
const DATASET = 'dataset';
const WORKERPOOL = 'workerpool';
const REQUEST = 'request';
const APP_ORDER = 'apporder';
const DATASET_ORDER = 'datasetorder';
const WORKERPOOL_ORDER = 'workerpoolorder';
const REQUEST_ORDER = 'requestorder';

const NULL_BYTES = '0x';
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const NULL_BYTES32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

const NULL_DATASETORDER = {
  dataset: NULL_ADDRESS,
  datasetprice: 0,
  volume: 0,
  tag: NULL_BYTES32,
  apprestrict: NULL_ADDRESS,
  workerpoolrestrict: NULL_ADDRESS,
  requesterrestrict: NULL_ADDRESS,
  salt: NULL_BYTES32,
  sign: NULL_BYTES,
};

const WORKERPOOL_URL_TEXT_RECORD_KEY = 'iexec:workerpool-api:url';

const TEE_FRAMEWORKS = {
  SCONE: 'scone',
  GRAMINE: 'gramine',
};

const STORAGE_PROVIDERS = {
  IPFS: 'ipfs',
  DROPBOX: 'dropbox',
};

const IEXEC_REQUEST_PARAMS = {
  IEXEC_ARGS: 'iexec_args',
  IEXEC_INPUT_FILES: 'iexec_input_files',
  IEXEC_SECRETS: 'iexec_secrets',
  IEXEC_RESULT_ENCRYPTION: 'iexec_result_encryption',
  IEXEC_RESULT_STORAGE_PROVIDER: 'iexec_result_storage_provider',
  IEXEC_RESULT_STORAGE_PROXY: 'iexec_result_storage_proxy',
  IEXEC_DEVELOPER_LOGGER: 'iexec_developer_logger',
};

module.exports = {
  APP,
  DATASET,
  WORKERPOOL,
  REQUEST,
  APP_ORDER,
  DATASET_ORDER,
  WORKERPOOL_ORDER,
  REQUEST_ORDER,
  NULL_BYTES,
  NULL_ADDRESS,
  NULL_BYTES32,
  NULL_DATASETORDER,
  WORKERPOOL_URL_TEXT_RECORD_KEY,
  TEE_FRAMEWORKS,
  STORAGE_PROVIDERS,
  IEXEC_REQUEST_PARAMS,
};
