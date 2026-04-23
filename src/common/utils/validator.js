import { Buffer } from 'buffer';
import Debug from 'debug';
import { string, number, object, mixed, boolean, array } from 'yup';
import { getAddress, isAddress } from 'ethers';
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

export const stringSchema = string;

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

const toChecksummedAddress = (value) => {
  if (typeof value === 'string' && isAddress(value.toLowerCase())) {
    return getAddress(value.toLowerCase());
  }
  return value;
};

export const addressSchema = () =>
  string()
    .transform((value) => toChecksummedAddress(value))
    .test(
      'is-address',
      '${originalValue} is not a valid ethereum address',
      (value) => isAddress(value) || value === undefined,
    );

export const addressOrAnySchema = () =>
  string()
    .transform((value) => toChecksummedAddress(value))
    .test(
      'is-address',
      '${originalValue} is not a valid ethereum address',
      (value) => {
        return isAddress(value) || value === undefined || value === ANY;
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

export const storageProviderSchema = () =>
  string().oneOf(
    Object.values(STORAGE_PROVIDERS),
    '"${value}" is not a valid storage provider, use one of the supported providers (${values})',
  );

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

/**
 * tag validation schema
 * @param {*} options
 * @param {boolean} options.allowAgnosticTee - allow 'tee' tag without tee framework tag (use for datasetorders and requestorders that don't need to specify tee framework)
 * @param {boolean} options.ignoreLegacyTeeFramework - ignore TEE framework validation (use for legacy TEE framework tags)
 */
export const tagSchema = ({
  allowAgnosticTee = false,
  ignoreLegacyTeeFramework = false,
} = {}) =>
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
        if (!ignoreLegacyTeeFramework) {
          const unsupportedTeeFrameworks = ['gramine', 'scone'].filter(
            (teeFramework) => checkActiveBitInTag(value, TAG_MAP[teeFramework]),
          );
          if (unsupportedTeeFrameworks.length > 0) {
            throw new Error(
              `Unsupported legacy TEE framework tag (${unsupportedTeeFrameworks
                .map((name) => `'${name}'`)
                .join(', ')})`,
            );
          }
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

export const apporderSchema = () =>
  object(
    {
      app: addressSchema().required(),
      appprice: nRlcAmountSchema().required(),
      volume: uint256Schema().required(),
      tag: tagSchema().required(),
      datasetrestrict: addressSchema().required(),
      workerpoolrestrict: addressSchema().required(),
      requesterrestrict: addressSchema().required(),
    },
    '${originalValue} is not a valid apporder',
  );

export const saltedApporderSchema = () =>
  apporderSchema().shape(
    salted(),
    '${originalValue} is not a valid salted apporder',
  );

export const signedApporderSchema = () =>
  saltedApporderSchema().shape(
    signed(),
    '${originalValue} is not a valid signed apporder',
  );

export const datasetorderSchema = () =>
  object(
    {
      dataset: addressSchema().required(),
      datasetprice: nRlcAmountSchema().required(),
      volume: uint256Schema().required(),
      tag: tagSchema({
        allowAgnosticTee: true,
        ignoreLegacyTeeFramework: true,
      }).required(),
      apprestrict: addressSchema().required(),
      workerpoolrestrict: addressSchema().required(),
      requesterrestrict: addressSchema().required(),
    },
    '${originalValue} is not a valid datasetorder',
  );

export const saltedDatasetorderSchema = () =>
  datasetorderSchema().shape(
    salted(),
    '${originalValue} is not a valid salted datasetorder',
  );

export const signedDatasetorderSchema = () =>
  saltedDatasetorderSchema().shape(
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
      tag: tagSchema({
        allowAgnosticTee: true,
        ignoreLegacyTeeFramework: true,
      }).required(),
      apprestrict: addressSchema().required(),
      workerpoolrestrict: addressSchema().required(),
      requesterrestrict: addressSchema().required(),
      salt: bytes32Schema().required(),
      sign: orderSignSchema().required(),
    },
    '${originalValue} is not a valid bulk datasetorder',
  );

export const workerpoolorderSchema = () =>
  object(
    {
      workerpool: addressSchema().required(),
      workerpoolprice: nRlcAmountSchema().required(),
      volume: uint256Schema().required(),
      tag: tagSchema().required(),
      category: catidSchema().required(),
      trust: uint256Schema().required(),
      apprestrict: addressSchema().required(),
      datasetrestrict: addressSchema().required(),
      requesterrestrict: addressSchema().required(),
    },
    '${originalValue} is not a valid workerpoolorder',
  );

export const saltedWorkerpoolorderSchema = () =>
  workerpoolorderSchema().shape(
    salted(),
    '${originalValue} is not a valid salted workerpoolorder',
  );

export const signedWorkerpoolorderSchema = () =>
  saltedWorkerpoolorderSchema().shape(
    signed(),
    '${originalValue} is not a valid signed workerpoolorder',
  );

export const requestorderSchema = () =>
  object(
    {
      app: addressSchema().required(),
      appmaxprice: nRlcAmountSchema().required(),
      dataset: addressSchema().required(),
      datasetmaxprice: nRlcAmountSchema().required(),
      workerpool: addressSchema().required(),
      workerpoolmaxprice: nRlcAmountSchema().required(),
      requester: addressSchema().required(),
      volume: uint256Schema().required(),
      tag: tagSchema({ allowAgnosticTee: true }).required(),
      category: catidSchema().required(),
      trust: uint256Schema().required(),
      beneficiary: addressSchema().required(),
      callback: addressSchema().required(),
      params: paramsSchema(),
    },
    '${originalValue} is not a valid requestorder',
  );

export const saltedRequestorderSchema = () =>
  requestorderSchema().shape(
    salted(),
    '${originalValue} is not a valid salted requestorder',
  );

export const signedRequestorderSchema = () =>
  saltedRequestorderSchema().shape(
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

export const mrenclaveSchema = () =>
  mixed()
    .transform((value) => {
      if (typeof value === 'string') {
        return utf8ToBuffer(value);
      }
      return value;
    })
    .test('is-buffer', '${path} is not a valid mrenclave', (value) =>
      Buffer.isBuffer(value),
    )
    .default(() => utf8ToBuffer(''));

export const appTypeSchema = () =>
  string().oneOf(['DOCKER'], '${originalValue} is not a valid type');

export const appSchema = () =>
  object({
    owner: addressSchema().required(),
    name: string().required(),
    type: appTypeSchema().required(),
    multiaddr: multiaddressSchema().required(),
    checksum: bytes32Schema().required(),
    mrenclave: mrenclaveSchema().required(),
  });

export const datasetSchema = () =>
  object({
    owner: addressSchema().required(),
    name: string().required(),
    multiaddr: multiaddressSchema().required(),
    checksum: bytes32Schema().required(),
  });

export const workerpoolSchema = () =>
  object({
    owner: addressSchema().required(),
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

export const throwIfMissing = () => {
  throw new ValidationError('Missing parameter');
};
