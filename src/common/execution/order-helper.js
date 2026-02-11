import Debug from 'debug';
import { array } from 'yup';
import {
  checkWeb2SecretExists,
  checkWeb3SecretExists,
  checkRequesterSecretExists,
} from '../sms/check.js';
import { checkActiveBitInTag, TAG_MAP } from '../utils/utils.js';
import {
  NULL_ADDRESS,
  NULL_BYTES32,
  IEXEC_REQUEST_PARAMS,
  STORAGE_PROVIDERS,
  TEE_FRAMEWORKS,
} from '../utils/constant.js';
import {
  THEGRAPH_IPFS_NODE,
  THEGRAPH_IPFS_GATEWAY,
  checkImplementedOnChain,
  CHAIN_SPECIFIC_FEATURES,
} from '../utils/config.js';
import {
  getStorageTokenKeyName,
  reservedSecretKeyName,
} from '../utils/secrets-utils.js';
import {
  objParamsSchema,
  requestorderSchema,
  throwIfMissing,
  datasetorderSchema,
  apporderSchema,
  tagSchema,
  positiveStrictIntSchema,
  signedDatasetorderBulkSchema,
} from '../utils/validator.js';
import { resolveTeeFrameworkFromApp, showApp } from '../protocol/registries.js';
import { add } from '../utils/ipfs.js';

const debug = Debug('iexec:execution:order-helper');

export const resolveTeeFrameworkFromTag = async (tag) => {
  const vTag = await tagSchema({ allowAgnosticTee: true }).validate(tag);
  if (checkActiveBitInTag(vTag, TAG_MAP[TEE_FRAMEWORKS.SCONE])) {
    return TEE_FRAMEWORKS.SCONE;
  }
  if (checkActiveBitInTag(vTag, TAG_MAP[TEE_FRAMEWORKS.TDX])) {
    return TEE_FRAMEWORKS.TDX;
  }
  if (checkActiveBitInTag(vTag, TAG_MAP[TEE_FRAMEWORKS.GRAMINE])) {
    return TEE_FRAMEWORKS.GRAMINE;
  }

  return undefined;
};

export const createObjParams = async ({
  params = {},
  tag = NULL_BYTES32,
  callback = NULL_ADDRESS,
  noCast = false,
} = {}) => {
  let inputParams;
  if (typeof params === 'string') {
    try {
      inputParams = JSON.parse(params);
    } catch {
      inputParams = {
        iexec_args: params,
      };
    }
  } else {
    inputParams = params;
  }
  const isTee = checkActiveBitInTag(tag, TAG_MAP.tee);
  const isCallback = callback !== NULL_ADDRESS;
  return objParamsSchema().validate(inputParams, {
    strict: noCast,
    context: { isTee, isCallback },
  });
};

export const checkRequestRequirements = async (
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
  const isTee = checkActiveBitInTag(tag, TAG_MAP.tee);

  // check encryption key
  if (paramsObj[IEXEC_REQUEST_PARAMS.IEXEC_RESULT_ENCRYPTION] === true) {
    const isEncryptionKeySet = await checkWeb2SecretExists(
      contracts,
      smsURL,
      beneficiary,
      reservedSecretKeyName.IEXEC_RESULT_ENCRYPTION_PUBLIC_KEY,
    );
    if (!isEncryptionKeySet) {
      throw new Error(
        'Beneficiary result encryption key is not set in the SMS. Result encryption will fail.',
      );
    }
  }

  // check dropbox storage token
  if (
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
      throw new Error(
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
      throw new Error(
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
            throw new Error(
              `Requester secret "${secretName}" is not set for requester ${requester} in the SMS. Requester secret provisioning will fail.`,
            );
          }
        },
      ),
    );
  }
};

export const checkDatasetRequirements = async (
  {
    contracts = throwIfMissing(),
    smsURL = throwIfMissing(),
  } = throwIfMissing(),
  datasetorder = throwIfMissing(),
  { tagOverride } = {},
) => {
  const vDatasetorder = await datasetorderSchema().validate(datasetorder);
  const { tag, dataset } = vDatasetorder;
  const isTee = checkActiveBitInTag(
    tagOverride
      ? await tagSchema({ allowAgnosticTee: true }).validate(tagOverride)
      : tag,
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
      throw new Error(
        `Dataset encryption key is not set for dataset ${dataset} in the SMS. Dataset decryption will fail.`,
      );
    }
  }
};

export const checkAppRequirements = async (
  { contracts = throwIfMissing() } = throwIfMissing(),
  apporder = throwIfMissing(),
  { tagOverride } = {},
) => {
  const vApporder = await apporderSchema().validate(apporder);
  const { tag, app } = vApporder;
  const tagTeeFramework = await resolveTeeFrameworkFromTag(
    tagOverride ? await tagSchema().validate(tagOverride) : tag,
  );
  const appTeeFramework = await showApp(contracts, app).then((res) =>
    resolveTeeFrameworkFromApp(res.app, { strict: false }),
  );
  const tagMatchesApp =
    appTeeFramework === tagTeeFramework ||
    (tagTeeFramework === TEE_FRAMEWORKS.TDX && appTeeFramework === undefined);
  if (!tagMatchesApp) {
    throw new Error('Tag mismatch the TEE framework specified by app');
  }
};

const MAX_DATASET_PER_TASK = 100;

const ipfsUpload = async ({
  content,
  ipfsNode,
  ipfsGateway,
  thegraphUpload,
}) => {
  const [cid] = await Promise.all([
    add({ content, ipfsNode, ipfsGateway }),
    // best effort upload to thegraph ipfs
    thegraphUpload
      ? add({
          content,
          ipfsNode: THEGRAPH_IPFS_NODE,
          ipfsGateway: THEGRAPH_IPFS_GATEWAY,
        }).catch((e) => {
          debug(`thegraph ipfs add failure: ${e.message}`);
        })
      : undefined,
  ]);
  return cid;
};

export const prepareDatasetBulk = async ({
  ipfsNode = throwIfMissing(),
  ipfsGateway = throwIfMissing(),
  contracts = throwIfMissing(),
  datasetorders = throwIfMissing(),
  maxDatasetPerTask = MAX_DATASET_PER_TASK,
  thegraphUpload = false,
}) => {
  checkImplementedOnChain(
    contracts.chainId,
    CHAIN_SPECIFIC_FEATURES.BULK_PROCESSING,
  );

  const vmMaxDatasetPerTask = await positiveStrictIntSchema()
    .max(MAX_DATASET_PER_TASK)
    .label('maxDatasetPerTask')
    .validate(maxDatasetPerTask);

  let vDatasetOrders = await array()
    .of(signedDatasetorderBulkSchema().stripUnknown())
    .required()
    .min(1)
    .label('datasetorders')
    .validate(datasetorders);

  const bulkRoot = [];
  while (vDatasetOrders.length > 0) {
    const slice = vDatasetOrders.slice(0, vmMaxDatasetPerTask);
    const sliceCid = await ipfsUpload({
      content: JSON.stringify(slice),
      ipfsNode,
      ipfsGateway,
      thegraphUpload,
    });
    bulkRoot.push(sliceCid);
    vDatasetOrders = vDatasetOrders.slice(vmMaxDatasetPerTask);
  }

  const bulkCid = await ipfsUpload({
    content: JSON.stringify(bulkRoot),
    ipfsNode,
    ipfsGateway,
    thegraphUpload,
  });
  return { cid: bulkCid, volume: bulkRoot.length };
};
