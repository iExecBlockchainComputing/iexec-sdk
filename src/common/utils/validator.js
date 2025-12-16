import { Buffer } from 'buffer';
import Debug from 'debug';
import { string, number, object, mixed, boolean, array } from 'yup';
import { getAddress, isAddress, namehash } from 'ethers';
// import-js/eslint-plugin-import/issues/2703
// eslint-disable-next-line import/no-unresolved
import { CID } from 'multiformats/cid';
import {
  humanToMultiaddrBuffer,
  utf8ToBuffer,
  encodeTag,
  bytes32Regex,
  parseRLC,
  parseEth,
  checkActiveBitInTag,
  TAG_MAP,
} from './utils.js';
import { ValidationError } from './errors.js';
import { wrapCall } from './errorWrappers.js';
import {
  TEE_FRAMEWORKS,
  IEXEC_REQUEST_PARAMS,
  STORAGE_PROVIDERS,
  ANY,
  DATASET_INFINITE_VOLUME,
} from './constant.js';

const debug = Debug('validators');

const posIntRegex = /^\d+$/;

const posStrictIntRegex = /^[1-9]\d*$/;

const teeFrameworksList = Object.values(TEE_FRAMEWORKS);

export const stringSchema = string;

export const teeFrameworkSchema = () =>
  string()
    .transform((name) => name.toLowerCase())
    .oneOf(teeFrameworksList, '${path} is not a valid TEE framework');

export const stringNumberSchema = ({ message } = {}) =>
  string()
    .transform((value) => {
      const trimmed = value.replace(/^0+/, '');
      return trimmed.length > 0 ? trimmed : '0';
    })
    .matches(posIntRegex, message || '${originalValue} is not a valid number');

export const integerSchema = () => number().integer();

export const positiveIntSchema = () =>
  integerSchema().min(0).max(Number.MAX_SAFE_INTEGER);

export const positiveStrictIntSchema = () =>
  integerSchema().min(1).max(Number.MAX_SAFE_INTEGER);

export const hexnumberSchema = () =>
  string()
    .lowercase()
    .matches(
      /^(0x)([0-9a-f]{2})*$/,
      '${originalValue} is not a valid hex number',
    );

export const uint256Schema = () =>
  stringNumberSchema({ message: '${originalValue} is not a valid uint256' });

export const booleanSchema = () => boolean();

export const basicUrlSchema = () =>
  string().matches(/^https?:\/\//, '${path} "${value}" is not a valid URL');

const amountErrorMessage = ({ originalValue }) =>
  `${
    Array.isArray(originalValue) ? originalValue.join(' ') : originalValue
  } is not a valid amount`;

export const nRlcAmountSchema = ({ defaultUnit = 'nRLC' } = {}) =>
  string()
    .transform((value, originalValue) => {
      if (Array.isArray(originalValue)) {
        if (originalValue.length > 2) {
          throw new ValidationError(amountErrorMessage({ originalValue }));
        }
        if (originalValue.length === 2 && originalValue[1]) {
          return `${originalValue[0]} ${originalValue[1]}`;
        }
        return `${originalValue[0]}`;
      }
      return value;
    })
    .transform((value) => {
      const [amount, unit] = value.split(' ');
      const trimmed = amount.replace(/^0+/, '');
      const trimmedAmount = trimmed.length > 0 ? trimmed : '0';
      return unit !== undefined
        ? [trimmedAmount, unit].join(' ')
        : trimmedAmount;
    })
    .transform((value, originalValue) => {
      try {
        return parseRLC(value, defaultUnit).toString();
      } catch {
        throw new ValidationError(amountErrorMessage({ originalValue }));
      }
    })
    .matches(/^\d*$/, amountErrorMessage);

export const weiAmountSchema = ({ defaultUnit = 'wei' } = {}) =>
  string()
    .transform((value, originalValue) => {
      if (Array.isArray(originalValue)) {
        if (originalValue.length > 2) {
          throw new ValidationError(amountErrorMessage({ originalValue }));
        }
        if (originalValue.length === 2 && originalValue[1]) {
          return `${originalValue[0]} ${originalValue[1]}`;
        }
        return `${originalValue[0]}`;
      }
      return value;
    })
    .transform((value) => {
      const [amount, unit] = value.split(' ');
      const trimmed = amount.replace(/^0+/, '');
      const trimmedAmount = trimmed.length > 0 ? trimmed : '0';
      return unit !== undefined
        ? [trimmedAmount, unit].join(' ')
        : trimmedAmount;
    })
    .transform((value, originalValue) => {
      try {
        return parseEth(value, defaultUnit).toString();
      } catch {
        throw new ValidationError(amountErrorMessage({ originalValue }));
      }
    })
    .matches(/^\d*$/, amountErrorMessage);

export const chainIdSchema = () =>
  stringNumberSchema({ message: '${originalValue} is not a valid chainId' });

const transformAddressOrEns = (ethProvider) => (value) => {
  try {
    if (typeof value === 'string') {
      if (value.match(/^.*\.eth$/)) {
        if (
          ethProvider &&
          ethProvider.resolveName &&
          typeof ethProvider.resolveName === 'function'
        ) {
          debug('resolving ENS', value);
          return wrapCall(ethProvider.resolveName(value))
            .then((resolved) => {
              debug('resolved ENS', resolved);
              return resolved;
            })
            .catch((error) => {
              debug('ENS resolution error', error);
              return null;
            });
        }
        debug("no ethProvider ENS can't be resolved");
      }
      return getAddress(value.toLowerCase());
    }
  } catch (e) {
    debug('Error', e);
  }
  return value;
};

const testResolveEnsPromise = async (value) => {
  if (value === undefined) {
    return true;
  }
  if (typeof value === 'string') {
    return !value.match(/^.*\.eth$/);
  }
  try {
    const address = await value;
    if (!address) return false;
    getAddress(address);
    return true;
  } catch (e) {
    debug('resolve-ens', e);
    return false;
  }
};

const testAddressOrAddressPromise = async (value) => {
  if (value === undefined) {
    return true;
  }
  const resolvedValue = typeof value === 'string' ? value : await value;
  return isAddress(resolvedValue);
};

export const addressSchema = ({ ethProvider } = {}) =>
  mixed()
    .transform((value) => transformAddressOrEns(ethProvider)(value))
    .test('resolve-ens', 'Unable to resolve ENS ${originalValue}', (value) =>
      testResolveEnsPromise(value),
    )
    .test(
      'is-address',
      '${originalValue} is not a valid ethereum address',
      (value) => testAddressOrAddressPromise(value),
    );

export const addressOrAnySchema = ({ ethProvider } = {}) =>
  mixed()
    .transform((value) => {
      if (value === ANY) {
        return value;
      }
      return transformAddressOrEns(ethProvider)(value);
    })
    .test('resolve-ens', 'Unable to resolve ENS ${originalValue}', (value) => {
      if (value === ANY) {
        return true;
      }
      return testResolveEnsPromise(value);
    })
    .test(
      'is-address',
      '${originalValue} is not a valid ethereum address',
      (value) => {
        if (value === ANY) {
          return true;
        }
        return testAddressOrAddressPromise(value);
      },
    );

export const bytes32Schema = () =>
  string()
    .lowercase()
    .matches(bytes32Regex, '${originalValue} is not a bytes32 hexstring');

export const orderSignSchema = () =>
  string().matches(
    /^(0x)([0-9a-f]{2})*/,
    '${originalValue} is not a valid signature',
  );

const salted = () => ({
  salt: bytes32Schema().required(),
});

const signed = () => ({
  sign: orderSignSchema().required(),
});

export const catidSchema = () => uint256Schema();

export const paramsArgsSchema = () => string();

export const paramsInputFilesArraySchema = () =>
  array()
    .transform((value, originalValue) => {
      if (Array.isArray(originalValue)) {
        return originalValue;
      }
      if (typeof originalValue === 'string') {
        return originalValue.split(',');
      }
      return value;
    })
    .of(basicUrlSchema().required('${path} "${value}" is not a valid URL'));

export const paramsEncryptResultSchema = () => boolean();

const addAllStorageProviders = (schema) =>
  schema.oneOf(
    Object.values(STORAGE_PROVIDERS),
    '${path} "${value}" is not a valid storage provider, use one of the supported providers (${values})',
  );

export const paramsStorageProviderSchema = () =>
  addAllStorageProviders(string());

export const paramsRequesterSecretsSchema = () =>
  object()
    .test(
      'keys-are-int',
      '${path} mapping keys must be strictly positive integers',
      (value) =>
        !(
          value !== undefined &&
          value !== null &&
          Object.keys(value).find((key) => !posStrictIntRegex.test(key))
        ),
    )
    .test(
      'values-are-string',
      '${path} mapping names must be strings',
      (value) =>
        !(
          value !== undefined &&
          value !== null &&
          Object.values(value).find(
            (val) => typeof val !== 'string' || val.length === 0,
          )
        ),
    )
    .nonNullable();

const cidSchema = () =>
  string().test(
    'is-cid',
    '${originalValue} is not a valid CID',
    (value, { originalValue }) => {
      try {
        if (originalValue !== undefined) {
          CID.parse(value);
        }
        return true;
      } catch {
        return false;
      }
    },
  );

export const objParamsSchema = () =>
  object({
    [IEXEC_REQUEST_PARAMS.IEXEC_ARGS]: paramsArgsSchema(),
    [IEXEC_REQUEST_PARAMS.IEXEC_INPUT_FILES]: paramsInputFilesArraySchema(),
    [IEXEC_REQUEST_PARAMS.IEXEC_BULK_CID]: cidSchema().notRequired(),
    [IEXEC_REQUEST_PARAMS.IEXEC_RESULT_ENCRYPTION]: paramsEncryptResultSchema(),
    [IEXEC_REQUEST_PARAMS.IEXEC_RESULT_STORAGE_PROVIDER]: string().when(
      '$isCallback',
      ([isCallback], storageSchema) =>
        isCallback === true
          ? storageSchema.notRequired()
          : storageSchema
              .default(STORAGE_PROVIDERS.IPFS)
              .when('$isTee', ([isTee], archiveStorageSchema) =>
                isTee === true
                  ? addAllStorageProviders(archiveStorageSchema)
                  : archiveStorageSchema.oneOf(
                      [STORAGE_PROVIDERS.IPFS],
                      '${path} "${value}" is not supported for non TEE tasks use supported storage provider ${values}',
                    ),
              )
              .required(),
    ),
    [IEXEC_REQUEST_PARAMS.IEXEC_SECRETS]: mixed().when('$isTee', ([isTee]) =>
      isTee === true
        ? paramsRequesterSecretsSchema()
        : mixed().test(
            'is-not-defined',
            '${path} is not supported for non TEE tasks',
            (value) => value === undefined,
          ),
    ),
    [IEXEC_REQUEST_PARAMS.IEXEC_RESULT_STORAGE_PROXY]:
      basicUrlSchema().notRequired(),
  })
    .json()
    .noUnknown(true, 'Unknown key "${unknown}" in params');

export const paramsSchema = () =>
  string()
    .transform((value, originalValue) => {
      if (typeof originalValue === 'object') {
        return JSON.stringify(originalValue);
      }
      return value;
    })
    .test(
      'is-json',
      '${originalValue} is not a valid params, must be a json',
      (value) => {
        if (value === undefined) {
          return true;
        }
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      },
    );

export const tagSchema = ({ allowAgnosticTee = false } = {}) =>
  mixed()
    .transform((value) => {
      if (Array.isArray(value)) {
        try {
          return encodeTag(value);
        } catch (e) {
          return e;
        }
      }
      if (typeof value === 'string') {
        const lowerCase = value.toLowerCase();
        if (lowerCase.substring(0, 2) === '0x') return lowerCase;
        try {
          return encodeTag(value.split(','));
        } catch (e) {
          return e;
        }
      }
      return new Error('Invalid tag');
    })
    .test(
      'no-transform-error',
      ({ originalValue, value }) =>
        `${originalValue} is not a valid tag. ${value.message}`,
      (value) => !(value instanceof Error),
    )
    .test(
      'is-bytes32',
      '${originalValue} is not a valid bytes32 hexstring',
      async (value) => {
        if (value instanceof Error) {
          return true;
        }
        try {
          await bytes32Schema().validate(value);
          return true;
        } catch {
          return false;
        }
      },
    )
    .test(
      'is-valid-tee-tag',
      '${originalValue} has a invalid tee combination',
      (value, { createError }) => {
        if (value instanceof Error) {
          return true;
        }
        const isTee = checkActiveBitInTag(value, TAG_MAP.tee);
        const teeFrameworks = Object.values(TEE_FRAMEWORKS).filter(
          (teeFramework) => checkActiveBitInTag(value, TAG_MAP[teeFramework]),
        );
        try {
          if (isTee) {
            if (!allowAgnosticTee && teeFrameworks.length < 1) {
              throw new Error(
                `'tee' tag must be used with a tee framework (${Object.values(
                  TEE_FRAMEWORKS,
                )
                  .map((name) => `'${name}'`)
                  .join('|')})`,
              );
            }
            if (teeFrameworks.length > 1) {
              throw new Error(
                `tee framework tags are exclusive (${Object.values(
                  TEE_FRAMEWORKS,
                )
                  .map((name) => `'${name}'`)
                  .join('|')})`,
              );
            }
          } else if (teeFrameworks.length > 0) {
            throw new Error(
              `'${teeFrameworks[0]}' tag must be used with 'tee' tag`,
            );
          }
        } catch (e) {
          return createError({ message: e.message });
        }
        return true;
      },
    );

export const apporderSchema = (opt) =>
  object(
    {
      app: addressSchema(opt).required(),
      appprice: nRlcAmountSchema().required(),
      volume: uint256Schema().required(),
      tag: tagSchema().required(),
      datasetrestrict: addressSchema(opt).required(),
      workerpoolrestrict: addressSchema(opt).required(),
      requesterrestrict: addressSchema(opt).required(),
    },
    '${originalValue} is not a valid apporder',
  );

export const saltedApporderSchema = (opt) =>
  apporderSchema(opt).shape(
    salted(),
    '${originalValue} is not a valid salted apporder',
  );

export const signedApporderSchema = (opt) =>
  saltedApporderSchema(opt).shape(
    signed(),
    '${originalValue} is not a valid signed apporder',
  );

export const datasetorderSchema = (opt) =>
  object(
    {
      dataset: addressSchema(opt).required(),
      datasetprice: nRlcAmountSchema().required(),
      volume: uint256Schema().required(),
      tag: tagSchema({ allowAgnosticTee: true }).required(),
      apprestrict: addressSchema(opt).required(),
      workerpoolrestrict: addressSchema(opt).required(),
      requesterrestrict: addressSchema(opt).required(),
    },
    '${originalValue} is not a valid datasetorder',
  );

export const saltedDatasetorderSchema = (opt) =>
  datasetorderSchema(opt).shape(
    salted(),
    '${originalValue} is not a valid salted datasetorder',
  );

export const signedDatasetorderSchema = (opt) =>
  saltedDatasetorderSchema(opt).shape(
    signed(),
    '${originalValue} is not a valid signed datasetorder',
  );

export const signedDatasetorderBulkSchema = () =>
  object(
    {
      dataset: addressSchema().required(),
      datasetprice: nRlcAmountSchema()
        .oneOf(
          ['0'],
          '${path} (${originalValue}) is not valid for bulk datasetorder expected 0',
        )
        .required(), // price must be 0 in bulk
      volume: uint256Schema()
        .test(
          'is-infinite-volume',
          '${path} (${originalValue}) is not valid for bulk datasetorder expected DATASET_INFINITE_VOLUME (9007199254740991)',
          (value) => parseInt(value) >= DATASET_INFINITE_VOLUME - 1, // (DATASET_INFINITE_VOLUME - 1) is accepted for compatibility with already created orders
        )
        .required(),
      tag: tagSchema().required(),
      apprestrict: addressSchema().required(),
      workerpoolrestrict: addressSchema().required(),
      requesterrestrict: addressSchema().required(),
      salt: bytes32Schema().required(),
      sign: orderSignSchema().required(),
    },
    '${originalValue} is not a valid bulk datasetorder',
  );

export const workerpoolorderSchema = (opt) =>
  object(
    {
      workerpool: addressSchema(opt).required(),
      workerpoolprice: nRlcAmountSchema().required(),
      volume: uint256Schema().required(),
      tag: tagSchema().required(),
      category: catidSchema().required(),
      trust: uint256Schema().required(),
      apprestrict: addressSchema(opt).required(),
      datasetrestrict: addressSchema(opt).required(),
      requesterrestrict: addressSchema(opt).required(),
    },
    '${originalValue} is not a valid workerpoolorder',
  );

export const saltedWorkerpoolorderSchema = (opt) =>
  workerpoolorderSchema(opt).shape(
    salted(),
    '${originalValue} is not a valid salted workerpoolorder',
  );

export const signedWorkerpoolorderSchema = (opt) =>
  saltedWorkerpoolorderSchema(opt).shape(
    signed(),
    '${originalValue} is not a valid signed workerpoolorder',
  );

export const requestorderSchema = (opt) =>
  object(
    {
      app: addressSchema(opt).required(),
      appmaxprice: nRlcAmountSchema().required(),
      dataset: addressSchema(opt).required(),
      datasetmaxprice: nRlcAmountSchema().required(),
      workerpool: addressSchema(opt).required(),
      workerpoolmaxprice: nRlcAmountSchema().required(),
      requester: addressSchema(opt).required(),
      volume: uint256Schema().required(),
      tag: tagSchema().required(),
      category: catidSchema().required(),
      trust: uint256Schema().required(),
      beneficiary: addressSchema(opt).required(),
      callback: addressSchema(opt).required(),
      params: paramsSchema(),
    },
    '${originalValue} is not a valid requestorder',
  );

export const saltedRequestorderSchema = (opt) =>
  requestorderSchema(opt).shape(
    salted(),
    '${originalValue} is not a valid salted requestorder',
  );

export const signedRequestorderSchema = (opt) =>
  saltedRequestorderSchema(opt).shape(
    signed(),
    '${originalValue} is not a valid signed requestorder',
  );

export const multiaddressSchema = () =>
  mixed().transform((value) => {
    if (value instanceof Uint8Array) return value;
    if (typeof value === 'string') {
      return humanToMultiaddrBuffer(value, { strict: false });
    }
    throw new ValidationError('${originalValue} is not a valid multiaddr');
  });

export const objMrenclaveSchema = () =>
  object({
    framework: teeFrameworkSchema().required(),
    version: string().required(),
    fingerprint: string().required(),
    entrypoint: string().required(),
    heapSize: positiveIntSchema().required(),
  })
    .json()
    .noUnknown(true, 'Unknown key "${unknown}" in mrenclave');

export const mrenclaveSchema = () =>
  mixed()
    .transform((value) => {
      if (value instanceof Uint8Array) {
        return value;
      }
      if (typeof value === 'string') {
        return utf8ToBuffer(value);
      }
      if (typeof value === 'object') {
        return utf8ToBuffer(JSON.stringify(value));
      }
      return utf8ToBuffer('');
    })
    .test(
      'is-valid-mrenclave',
      '${path} is not a valid mrenclave',
      async (value, { originalValue, createError }) => {
        let stringValue;
        let objValue;
        if (originalValue instanceof Uint8Array) {
          try {
            stringValue = Buffer.from(originalValue).toString();
          } catch {
            return false;
          }
        } else if (typeof originalValue === 'string') {
          stringValue = originalValue;
        } else if (originalValue && typeof originalValue === 'object') {
          objValue = originalValue;
        } else if (originalValue !== undefined) {
          return false;
        }
        try {
          if (stringValue !== undefined && stringValue !== '') {
            objValue = JSON.parse(stringValue);
          }
          if (objValue) {
            await objMrenclaveSchema().validate(objValue, {
              stripUnknown: false,
            });
          }
          return true;
        } catch (e) {
          if (e instanceof ValidationError) {
            return createError({ message: e.message });
          }
          return false;
        }
      },
    )
    .default(() => utf8ToBuffer(''));

export const appTypeSchema = () =>
  string().oneOf(['DOCKER'], '${originalValue} is not a valid type');

export const appSchema = (opt) =>
  object({
    owner: addressSchema(opt).required(),
    name: string().required(),
    type: appTypeSchema().required(),
    multiaddr: multiaddressSchema().required(),
    checksum: bytes32Schema().required(),
    mrenclave: mrenclaveSchema().required(),
  });

export const datasetSchema = (opt) =>
  object({
    owner: addressSchema(opt).required(),
    name: string().required(),
    multiaddr: multiaddressSchema().required(),
    checksum: bytes32Schema().required(),
  });

export const workerpoolSchema = (opt) =>
  object({
    owner: addressSchema(opt).required(),
    description: string().required(),
  });

export const categorySchema = () =>
  object({
    name: string().required(),
    description: string().required(),
    workClockTimeRef: uint256Schema().required(),
  });

export const fileBufferSchema = () =>
  mixed().transform((value) => {
    try {
      if (typeof value === 'string') {
        throw new Error('unsupported string');
      }
      return Buffer.from(value);
    } catch {
      throw new ValidationError(
        'Invalid file buffer, must be ArrayBuffer or Buffer',
      );
    }
  });

export const base64Encoded256bitsKeySchema = () =>
  string().test(
    'is-base64-256bits-key',
    '${originalValue} is not a valid encryption key (must be base64 encoded 256 bits key)',
    async (value) => {
      try {
        const keyBuffer = Buffer.from(value, 'base64');
        if (keyBuffer.length !== 32) {
          throw new Error('Invalid key length');
        }
        return true;
      } catch (e) {
        debug('is-base64-256bits-key', e);
        return false;
      }
    },
  );

export const ensDomainSchema = () =>
  string()
    .test(
      'no-empty-label',
      '${originalValue} is not a valid ENS domain (domain cannot have empty labels)',
      (value) => {
        try {
          const nameArray = value.split('.');
          const hasEmptyLabels =
            nameArray.filter((e) => e.length < 1).length > 0;
          if (hasEmptyLabels)
            throw new Error('Domain cannot have empty labels');
          return true;
        } catch (e) {
          debug('ensDomainSchema no-empty-label', e);
          return false;
        }
      },
    )
    .test(
      'valid-namehash',
      '${originalValue} is not a valid ENS domain (domain cannot contain unsupported characters)',
      (value) => {
        try {
          namehash(value);
          return true;
        } catch (e) {
          debug('ensDomainSchema valid-namehash', e);
          return false;
        }
      },
    )
    .test(
      'no-uppercase',
      '${originalValue} is not a valid ENS domain (domain cannot contain uppercase characters)',
      (value) => {
        try {
          if (value !== value.toLowerCase()) {
            throw new Error('Domain cannot have uppercase characters');
          }
          return true;
        } catch (e) {
          debug('ensDomainSchema no-uppercase', e);
          return false;
        }
      },
    );

export const ensLabelSchema = () =>
  string()
    .test(
      'no-dot',
      '${originalValue} is not a valid ENS label (label cannot have `.`)',
      async (value) => {
        try {
          const hasDot = value.indexOf('.') !== -1;
          if (hasDot) throw new Error('Label cannot have `.`');
          return true;
        } catch (e) {
          debug('ensLabelSchema no-dot', e);
          return false;
        }
      },
    )
    .test(
      'valid-namehash',
      '${originalValue} is not a valid ENS label (label cannot contain unsupported characters)',
      (value) => {
        try {
          namehash(value);
          return true;
        } catch (e) {
          debug('ensLabelSchema valid-namehash', e);
          return false;
        }
      },
    )
    .test(
      'no-uppercase',
      '${originalValue} is not a valid ENS label (label cannot contain uppercase characters)',
      (value) => {
        try {
          if (value !== value.toLowerCase()) {
            throw new Error('Label cannot have uppercase characters');
          }
          return true;
        } catch (e) {
          debug('ensLabelSchema no-uppercase', e);
          return false;
        }
      },
    );

export const textRecordKeySchema = () => string().required().strict(true);

export const textRecordValueSchema = () => string().default('').strict(true);

export const workerpoolApiUrlSchema = () =>
  string()
    .matches(/^(https?:\/\/.*)?$/, '${path} "${value}" is not a valid URL') // accept empty string to reset workerpool URL
    .default('');

export const throwIfMissing = () => {
  throw new ValidationError('Missing parameter');
};
