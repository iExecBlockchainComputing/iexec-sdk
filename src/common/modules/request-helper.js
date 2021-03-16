const { checkWeb2SecretExists } = require('./sms');
const {
  NULL_BYTES32,
  NULL_ADDRESS,
  checkActiveBitInTag,
} = require('../utils/utils');
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
  const params = await createObjParams({
    params: requestorder.params,
    tag: requestorder.tag,
    callback: requestorder.callback,
    noCast: true,
  });
  // check encryption key
  if (params[paramsKeyName.IEXEC_RESULT_ENCRYPTION] === true) {
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
    params[paramsKeyName.IEXEC_RESULT_STORAGE_PROVIDER] === 'ipfs'
    || params[paramsKeyName.IEXEC_RESULT_STORAGE_PROVIDER] === 'dropbox'
  ) {
    const isStorageTokenSet = await checkWeb2SecretExists(
      contracts,
      smsURL,
      requestorder.requester,
      getStorageTokenKeyName(
        params[paramsKeyName.IEXEC_RESULT_STORAGE_PROVIDER],
      ),
    );
    if (!isStorageTokenSet) {
      throw Error(
        `Requester storage token is not set for selected provider "${
          params[paramsKeyName.IEXEC_RESULT_STORAGE_PROVIDER]
        }". Result archive upload will fail.`,
      );
    }
  }
  return true;
};

module.exports = {
  createObjParams,
  checkRequestRequirements,
};
