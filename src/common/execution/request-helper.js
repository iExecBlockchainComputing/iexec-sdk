const {
  checkWeb2SecretExists,
  checkWeb3SecretExists,
} = require('../sms/check');
const { checkActiveBitInTag } = require('../utils/utils');
const { NULL_ADDRESS, NULL_BYTES32 } = require('../utils/constant');
const {
  getStorageTokenKeyName,
  reservedSecretKeyName,
} = require('../utils/secrets-utils');
const { paramsKeyName } = require('../utils/params-utils');
const {
  objParamsSchema,
  requestorderSchema,
  throwIfMissing,
} = require('../utils/validator');

const createObjParams = async ({
  params = {},
  tag = NULL_BYTES32,
  callback = NULL_ADDRESS,
  noCast = false,
  resultProxyURL,
} = {}) => {
  let inputParams;
  if (typeof params === 'string') {
    try {
      inputParams = JSON.parse(params);
    } catch (e) {
      inputParams = {
        iexec_args: params,
      };
    }
  } else {
    inputParams = params;
  }
  const isTee = checkActiveBitInTag(tag, 1);
  const isCallback = callback !== NULL_ADDRESS;
  const objParams = await objParamsSchema().validate(inputParams, {
    strict: noCast,
    context: { isTee, isCallback, resultProxyURL },
  });
  return objParams;
};

const checkRequestRequirements = async (
  {
    contracts = throwIfMissing(),
    smsURL = throwIfMissing(),
  } = throwIfMissing(),
  requestorder = throwIfMissing(),
) => {
  await requestorderSchema().validate(requestorder);
  const { tag, dataset, callback, params, requester } = requestorder;
  const paramsObj = await createObjParams({
    params,
    tag,
    callback,
    noCast: true,
  });
  const isTee = checkActiveBitInTag(tag, 1);

  // check encryption key
  if (paramsObj[paramsKeyName.IEXEC_RESULT_ENCRYPTION] === true) {
    const isEncryptionKeySet = await checkWeb2SecretExists(
      contracts,
      smsURL,
      requestorder.beneficiary,
      reservedSecretKeyName.IEXEC_RESULT_ENCRYPTION_PUBLIC_KEY,
    );
    if (!isEncryptionKeySet) {
      throw Error(
        'Beneficiary result encryption key is not set in the SMS. Result encryption will fail.',
      );
    }
  }
  // check storage token
  if (
    paramsObj[paramsKeyName.IEXEC_RESULT_STORAGE_PROVIDER] === 'ipfs' ||
    paramsObj[paramsKeyName.IEXEC_RESULT_STORAGE_PROVIDER] === 'dropbox'
  ) {
    const isStorageTokenSet = await checkWeb2SecretExists(
      contracts,
      smsURL,
      requester,
      getStorageTokenKeyName(
        paramsObj[paramsKeyName.IEXEC_RESULT_STORAGE_PROVIDER],
      ),
    );
    if (!isStorageTokenSet) {
      throw Error(
        `Requester storage token is not set for selected provider "${
          paramsObj[paramsKeyName.IEXEC_RESULT_STORAGE_PROVIDER]
        }". Result archive upload will fail.`,
      );
    }
  }
  // check tee dataset encryption key
  if (dataset && dataset !== NULL_ADDRESS && isTee) {
    const isDatasetSecretSet = await checkWeb3SecretExists(
      contracts,
      smsURL,
      dataset,
    );
    if (!isDatasetSecretSet) {
      throw Error(
        `Dataset encryption key not set for ${dataset}. Dataset decryption will fail.`,
      );
    }
  }
  return true;
};

module.exports = {
  createObjParams,
  checkRequestRequirements,
};
