export const APP = 'app';
export const DATASET = 'dataset';
export const WORKERPOOL = 'workerpool';
export const REQUEST = 'request';
export const APP_ORDER = 'apporder';
export const DATASET_ORDER = 'datasetorder';
export const WORKERPOOL_ORDER = 'workerpoolorder';
export const REQUEST_ORDER = 'requestorder';

export const NULL_BYTES = '0x';
export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
export const NULL_BYTES32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

export const NULL_DATASETORDER = {
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

export const WORKERPOOL_URL_TEXT_RECORD_KEY = 'iexec:workerpool-api:url';

export const TEE_FRAMEWORKS = {
  SCONE: 'scone',
  GRAMINE: 'gramine',
};

export const STORAGE_PROVIDERS = {
  IPFS: 'ipfs',
  DROPBOX: 'dropbox',
};

export const IEXEC_REQUEST_PARAMS = {
  IEXEC_ARGS: 'iexec_args',
  IEXEC_INPUT_FILES: 'iexec_input_files',
  IEXEC_SECRETS: 'iexec_secrets',
  IEXEC_RESULT_ENCRYPTION: 'iexec_result_encryption',
  IEXEC_RESULT_STORAGE_PROVIDER: 'iexec_result_storage_provider',
  IEXEC_RESULT_STORAGE_PROXY: 'iexec_result_storage_proxy',
};

export const ANY = 'any';
