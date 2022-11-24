const {
  checkWeb2SecretExists,
  checkWeb3SecretExists,
  checkRequesterSecretExists,
} = require('../sms/check');
const { checkActiveBitInTag, TAG_MAP } = require('../utils/utils');
const {
  NULL_ADDRESS,
  NULL_BYTES32,
  IEXEC_REQUEST_PARAMS,
  STORAGE_PROVIDERS,
  TEE_FRAMEWORKS,
} = require('../utils/constant');
const {
  getStorageTokenKeyName,
  reservedSecretKeyName,
} = require('../utils/secrets-utils');
const {
  objParamsSchema,
  requestorderSchema,
  throwIfMissing,
  datasetorderSchema,
  apporderSchema,
  tagSchema,
} = require('../utils/validator');
const {
  resolveTeeFrameworkFromApp,
  showApp,
} = require('../protocol/registries');

const checkTag = (tag) => {
  const isTee = checkActiveBitInTag(tag, TAG_MAP.tee);
  const isScone = checkActiveBitInTag(tag, TAG_MAP.scone);
  const isGramine = checkActiveBitInTag(tag, TAG_MAP.gramine);
  if (isTee) {
    if (!isScone && !isGramine) {
      throw Error(
        `'tee' tag must be used with a tee framework (${Object.values(
          TEE_FRAMEWORKS,
        )
          .map((name) => `'${name}'`)
          .join('|')})`,
      );
    }
    if (isScone && isGramine) {
      throw Error(
        `tee framework tags are exclusive (${Object.values(TEE_FRAMEWORKS)
          .map((name) => `'${name}'`)
          .join('|')})`,
      );
    }
  } else {
    if (isScone) {
      throw Error(`'${TEE_FRAMEWORKS.SCONE}' tag must be used with 'tee' tag`);
    }
    if (isGramine) {
      throw Error(
        `'${TEE_FRAMEWORKS.GRAMINE}' tag must be used with 'tee' tag`,
      );
    }
  }
};

const resolveTeeFrameworkFromTag = (tag) => {
  checkTag(tag);
  if (checkActiveBitInTag(tag, TAG_MAP.scone)) {
    return TEE_FRAMEWORKS.SCONE;
  }
  if (checkActiveBitInTag(tag, TAG_MAP.gramine)) {
    return TEE_FRAMEWORKS.GRAMINE;
  }
  return undefined;
};

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
  const isTee = checkActiveBitInTag(tag, TAG_MAP.tee);
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
  const vRequestorder = await requestorderSchema().validate(requestorder);
  const { tag, dataset, callback, params, requester, beneficiary } =
    vRequestorder;
  const paramsObj = await createObjParams({
    params,
    tag,
    callback,
    noCast: true,
  });
  const isTee = checkActiveBitInTag(tag, 1);

  checkTag(tag);

  // check encryption key
  if (paramsObj[IEXEC_REQUEST_PARAMS.IEXEC_RESULT_ENCRYPTION] === true) {
    const isEncryptionKeySet = await checkWeb2SecretExists(
      contracts,
      smsURL,
      beneficiary,
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
};

const checkDatasetRequirements = async (
  {
    contracts = throwIfMissing(),
    smsURL = throwIfMissing(),
  } = throwIfMissing(),
  datasetorder = throwIfMissing(),
  { tagOverride } = {},
) => {
  const vDatasetorder = await datasetorderSchema().validate(datasetorder);
  const { tag, dataset } = vDatasetorder;
  checkTag(tag);
  const isTee = checkActiveBitInTag(
    tagOverride ? await tagSchema().validate(tagOverride) : tag,
    TAG_MAP.tee,
  );
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
};

const checkAppRequirements = async (
  { contracts = throwIfMissing() } = throwIfMissing(),
  apporder = throwIfMissing(),
  { tagOverride } = {},
) => {
  const vApporder = await apporderSchema().validate(apporder);
  const { tag, app } = vApporder;
  const tagTeeFramework = resolveTeeFrameworkFromTag(
    tagOverride ? await tagSchema().validate(tagOverride) : tag,
  );
  const appTeeFramework = await showApp(contracts, app).then((res) =>
    resolveTeeFrameworkFromApp(res.app, { strict: false }),
  );
  if (appTeeFramework !== tagTeeFramework) {
    throw Error('Tag mismatch the TEE framework specified by app');
  }
};

module.exports = {
  resolveTeeFrameworkFromTag,
  createObjParams,
  checkRequestRequirements,
  checkDatasetRequirements,
  checkAppRequirements,
};
