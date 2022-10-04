const {
  checkWeb2SecretExists,
  checkWeb3SecretExists,
  checkRequesterSecretExists,
} = require('../sms/check');
const { checkActiveBitInTag } = require('../utils/utils');
const {
  NULL_ADDRESS,
  NULL_BYTES32,
  IEXEC_REQUEST_PARAMS,
  STORAGE_PROVIDERS,
} = require('../utils/constant');
const {
  getStorageTokenKeyName,
  reservedSecretKeyName,
} = require('../utils/secrets-utils');
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
  if (paramsObj[IEXEC_REQUEST_PARAMS.IEXEC_RESULT_ENCRYPTION] === true) {
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
    paramsObj[IEXEC_REQUEST_PARAMS.IEXEC_RESULT_STORAGE_PROVIDER] ===
      STORAGE_PROVIDERS.IPFS ||
    paramsObj[IEXEC_REQUEST_PARAMS.IEXEC_RESULT_STORAGE_PROVIDER] ===
      STORAGE_PROVIDERS.DROPBOX
  ) {
    const isStorageTokenSet = await checkWeb2SecretExists(
      contracts,
      smsURL,
      requester,
      getStorageTokenKeyName(
        paramsObj[IEXEC_REQUEST_PARAMS.IEXEC_RESULT_STORAGE_PROVIDER],
      ),
    );
    if (!isStorageTokenSet) {
      throw Error(
        `Requester storage token is not set for selected provider "${
          paramsObj[IEXEC_REQUEST_PARAMS.IEXEC_RESULT_STORAGE_PROVIDER]
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
        `Dataset encryption key is not set for dataset ${dataset} in the SMS. Dataset decryption will fail.`,
      );
    }
  }
  // check requester secrets
  if (paramsObj[IEXEC_REQUEST_PARAMS.IEXEC_SECRETS]) {
    await Promise.all(
      Object.values(paramsObj[IEXEC_REQUEST_PARAMS.IEXEC_SECRETS]).map(
        async (secretName) => {
          const isSecretSet = await checkRequesterSecretExists(
            contracts,
            smsURL,
            requester,
            secretName,
          );
          if (!isSecretSet) {
            throw Error(
              `Requester secret "${secretName}" is not set for requester ${requester} in the SMS. Requester secret provisioning will fail.`,
            );
          }
        },
      ),
    );
  }
  return true;
};

module.exports = {
  createObjParams,
  checkRequestRequirements,
};
