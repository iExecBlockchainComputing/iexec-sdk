const Debug = require('debug');
const {
  string, number, object, mixed, boolean, array,
} = require('yup');
const { getAddress } = require('ethers').utils;
const {
  humanToMultiaddrBuffer,
  utf8ToBuffer,
  encodeTag,
  bytes32Regex,
  parseRLC,
  parseEth,
} = require('./utils');
const { paramsKeyName, storageProviders } = require('./params-utils');
const { teePostComputeDefaults } = require('./secrets-utils');
const { ValidationError } = require('./errors');
const { wrapCall } = require('./errorWrappers');

const debug = Debug('validators');

const stringNumberSchema = ({ message } = {}) => string()
  .transform((value) => {
    const trimed = value.replace(/^0+/, '');
    return trimed.length > 0 ? trimed : '0';
  })
  .matches(/^[0-9]*$/, message || '${originalValue} is not a valid number');

const integerSchema = () => number().integer();

const positiveIntSchema = () => integerSchema()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER - 1);

const positiveStrictIntSchema = () => integerSchema()
  .min(1)
  .max(Number.MAX_SAFE_INTEGER - 1);

const hexnumberSchema = () => string()
  .lowercase()
  .matches(
    /^(0x)([0-9a-f]{2})*$/,
    '${originalValue} is not a valid hex number',
  );

const uint256Schema = () => stringNumberSchema({ message: '${originalValue} is not a valid uint256' });

const amontErrorMessage = ({ originalValue }) => `${
  Array.isArray(originalValue) ? originalValue.join(' ') : originalValue
} is not a valid amount`;

const nRlcAmountSchema = ({ defaultUnit = 'nRLC' } = {}) => string()
  .transform((value, originalValue) => {
    if (Array.isArray(originalValue)) {
      if (originalValue.length > 2) {
        throw new ValidationError(amontErrorMessage({ originalValue }));
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
    const trimed = amount.replace(/^0+/, '');
    const trimedAmount = trimed.length > 0 ? trimed : '0';
    return unit !== undefined ? [trimedAmount, unit].join(' ') : trimedAmount;
  })
  .transform((value, originalValue) => {
    try {
      return parseRLC(value, defaultUnit).toString();
    } catch (e) {
      throw new ValidationError(amontErrorMessage({ originalValue }));
    }
  })
  .matches(/^[0-9]*$/, amontErrorMessage);

const weiAmountSchema = ({ defaultUnit = 'wei' } = {}) => string()
  .transform((value, originalValue) => {
    if (Array.isArray(originalValue)) {
      if (originalValue.length > 2) {
        throw new ValidationError(amontErrorMessage({ originalValue }));
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
    const trimed = amount.replace(/^0+/, '');
    const trimedAmount = trimed.length > 0 ? trimed : '0';
    return unit !== undefined ? [trimedAmount, unit].join(' ') : trimedAmount;
  })
  .transform((value, originalValue) => {
    try {
      return parseEth(value, defaultUnit).toString();
    } catch (e) {
      throw new ValidationError(amontErrorMessage({ originalValue }));
    }
  })
  .matches(/^[0-9]*$/, amontErrorMessage);

const chainIdSchema = () => stringNumberSchema({ message: '${originalValue} is not a valid chainId' });

const addressSchema = ({ ethProvider } = {}) => mixed()
  .transform((value) => {
    try {
      if (typeof value === 'string') {
        if (value.match(/^.*\.eth$/)) {
          if (
            ethProvider
              && ethProvider.resolveName
              && typeof ethProvider.resolveName === 'function'
          ) {
            debug('resolving ENS', value);
            const addressPromise = wrapCall(ethProvider.resolveName(value))
              .then((resolved) => {
                debug('resolved ENS', resolved);
                return resolved;
              })
              .catch((error) => {
                debug('ENS resolution error', error);
                return null;
              });
            return addressPromise;
          }
          debug("no ethProvider ENS can't be resolved");
        }
        return getAddress(value.toLowerCase());
      }
    } catch (e) {
      debug('Error', e);
    }
    return value;
  })
  .test(
    'resolve-ens',
    'Unable to resolve ENS ${originalValue}',
    async (value) => {
      if (value === undefined) {
        return true;
      }
      if (typeof value === 'string') {
        if (value.match(/^.*\.eth$/)) {
          return false;
        }
        return true;
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
    },
  )
  .test(
    'is-address',
    '${originalValue} is not a valid ethereum address',
    async (value) => {
      const resolvedValue = typeof value === 'string' ? value : await value;
      try {
        getAddress(resolvedValue);
        return true;
      } catch (e) {
        return false;
      }
    },
  );

const bytes32Schema = () => string()
  .lowercase()
  .matches(bytes32Regex, '${originalValue} is not a bytes32 hexstring');

const orderSignSchema = () => string().matches(
  /^(0x)([0-9a-f]{2})*/,
  '${originalValue} is not a valid signature',
);

const salted = () => ({
  salt: bytes32Schema().required(),
});

const signed = () => ({
  sign: orderSignSchema().required(),
});

const catidSchema = () => uint256Schema();

const objParamsSchema = () => object({
  [paramsKeyName.IEXEC_ARGS]: string(),
  [paramsKeyName.IEXEC_INPUT_FILES]: array().of(
    string().url('${path} ${originalValue} is not a valid URL'),
  ),
  [paramsKeyName.IEXEC_RESULT_ENCRYPTION]: boolean(),
  [paramsKeyName.IEXEC_RESULT_STORAGE_PROVIDER]: string().when(
    '$isCallback',
    {
      is: true,
      then: string().notRequired(),
      otherwise: string()
        .default('ipfs')
        .when('$isTee', {
          is: true,
          then: string().oneOf(
            storageProviders(),
            '${path} "${value}" is not supported for TEE tasks use one of supported storage providers (${values})',
          ),
          otherwise: string().oneOf(
            ['ipfs'],
            '${path} "${value}" is not supported for non TEE tasks use supported storage provider ${values}',
          ),
        })
        .required(),
    },
  ),
  [paramsKeyName.IEXEC_RESULT_STORAGE_PROXY]: string().when(
    `${paramsKeyName.IEXEC_RESULT_STORAGE_PROVIDER}`,
    {
      is: 'ipfs',
      then: string()
        .when('$resultProxyURL', (resultProxyURL, schema) => schema.default(resultProxyURL))
        .required('${path} is required field with "ipfs" storage'),
      otherwise: string().notRequired(),
    },
  ),
  [paramsKeyName.IEXEC_DEVELOPER_LOGGER]: boolean().notRequired(),
  // workarond this should not be required in the future
  [paramsKeyName.IEXEC_TEE_POST_COMPUTE_IMAGE]: string()
    .default(teePostComputeDefaults.image)
    .required('${path} is required field for TEE tasks'),
  [paramsKeyName.IEXEC_TEE_POST_COMPUTE_FINGERPRINT]: string()
    .default(teePostComputeDefaults.fingerprint)
    .required('${path} is required field for TEE tasks'),
}).noUnknown(true, 'Unknown key "${unknown}" in params');

const paramsSchema = () => string()
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
      } catch (e) {
        return false;
      }
    },
  );

const paramsArgsSchema = () => string();

const paramsInputFilesArraySchema = () => array()
  .transform((value, originalValue) => {
    if (Array.isArray(originalValue)) {
      return originalValue;
    }
    if (typeof originalValue === 'string') {
      return originalValue.split(',');
    }
    return value;
  })
  .of(
    string()
      .url('"${value}" is not a valid URL')
      .required('"${value}" is not a valid URL'),
  );

const paramsEncryptResultSchema = () => boolean();

const paramsStorageProviderSchema = () => string().oneOf(
  storageProviders(),
  '"${value}" is not a valid storage provider use one of ${values}',
);

const tagSchema = () => mixed()
  .transform((value) => {
    if (Array.isArray(value)) {
      try {
        const bytes32Tag = encodeTag(value);
        return bytes32Tag;
      } catch (e) {
        return e.message;
      }
    }
    if (typeof value === 'string') {
      const lowerCase = value.toLowerCase();
      if (lowerCase.substr(0, 2) === '0x') return lowerCase;
      try {
        const bytes32Tag = encodeTag(value.split(','));
        return bytes32Tag;
      } catch (e) {
        return e.message;
      }
    }
    return 'Invalid tag';
  })
  .test(
    'no-transform-error',
    ({ originalValue, value }) => `${originalValue} is not a valid tag. ${value}`,
    (value) => {
      if (value.substr(0, 2) !== '0x') return false;
      return true;
    },
  )
  .test(
    'is-bytes32',
    '${originalValue} is not a valid bytes32 hexstring',
    async (value) => {
      try {
        await bytes32Schema().validate(value);
        return true;
      } catch (e) {
        return false;
      }
    },
  );

const apporderSchema = (opt) => object(
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

const saltedApporderSchema = (opt) => apporderSchema(opt).shape(
  salted(),
  '${originalValue} is not a valid salted apporder',
);

const signedApporderSchema = (opt) => saltedApporderSchema(opt).shape(
  signed(),
  '${originalValue} is not a valid signed apporder',
);

const datasetorderSchema = (opt) => object(
  {
    dataset: addressSchema(opt).required(),
    datasetprice: nRlcAmountSchema().required(),
    volume: uint256Schema().required(),
    tag: tagSchema().required(),
    apprestrict: addressSchema(opt).required(),
    workerpoolrestrict: addressSchema(opt).required(),
    requesterrestrict: addressSchema(opt).required(),
  },
  '${originalValue} is not a valid datasetorder',
);

const saltedDatasetorderSchema = (opt) => datasetorderSchema(opt).shape(
  salted(),
  '${originalValue} is not a valid salted datasetorder',
);

const signedDatasetorderSchema = (opt) => saltedDatasetorderSchema(opt).shape(
  signed(),
  '${originalValue} is not a valid signed datasetorder',
);

const workerpoolorderSchema = (opt) => object(
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

const saltedWorkerpoolorderSchema = (opt) => workerpoolorderSchema(opt).shape(
  salted(),
  '${originalValue} is not a valid salted workerpoolorder',
);

const signedWorkerpoolorderSchema = (opt) => saltedWorkerpoolorderSchema(opt).shape(
  signed(),
  '${originalValue} is not a valid signed workerpoolorder',
);

const requestorderSchema = (opt) => object(
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

const saltedRequestorderSchema = (opt) => requestorderSchema(opt).shape(
  salted(),
  '${originalValue} is not a valid salted requestorder',
);

const signedRequestorderSchema = (opt) => saltedRequestorderSchema(opt).shape(
  signed(),
  '${originalValue} is not a valid signed requestorder',
);

const multiaddressSchema = () => mixed().transform((value) => {
  if (value instanceof Uint8Array) return value;
  if (typeof value === 'string') {
    return humanToMultiaddrBuffer(value, { strict: false });
  }
  throw new ValidationError('${originalValue} is not a valid multiaddr');
});

const objMrenclaveSchema = () => object({
  provider: string().required(),
  version: string().required(),
  entrypoint: string().required(),
  heapSize: positiveIntSchema().required(),
  fingerprint: string().required(),
}).noUnknown(true, 'Unknown key "${unknown}" in mrenclave');

const mrenclaveSchema = () => mixed()
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
        } catch (e) {
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

const appTypeSchema = () => string().oneOf(['DOCKER'], '${originalValue} is not a valid type');

const appSchema = (opt) => object({
  owner: addressSchema(opt).required(),
  name: string().required(),
  type: appTypeSchema().required(),
  multiaddr: multiaddressSchema().required(),
  checksum: bytes32Schema().required(),
  mrenclave: mrenclaveSchema().required(),
});

const datasetSchema = (opt) => object({
  owner: addressSchema(opt).required(),
  name: string().required(),
  multiaddr: multiaddressSchema().required(),
  checksum: bytes32Schema().required(),
});

const workerpoolSchema = (opt) => object({
  owner: addressSchema(opt).required(),
  description: string().required(),
});

const categorySchema = () => object({
  name: string().required(),
  description: string().required(),
  workClockTimeRef: uint256Schema().required(),
});

const fileBufferSchema = () => mixed().transform((value) => {
  try {
    if (typeof value === 'string') {
      throw Error('unsupported string');
    }
    const buffer = Buffer.from(value);
    return buffer;
  } catch (e) {
    throw new ValidationError(
      'Invalid file buffer, must be ArrayBuffer or Buffer',
    );
  }
});

const base64Encoded256bitsKeySchema = () => string().test(
  'is-base64-256bits-key',
  '${originalValue} is not a valid encryption key (must be base64 encoded 256 bits key)',
  async (value) => {
    try {
      const keyBuffer = Buffer.from(value, 'base64');
      if (keyBuffer.length !== 32) {
        throw Error('Invalid key length');
      }
      return true;
    } catch (e) {
      debug('is-base64-256bits-key', e);
      return false;
    }
  },
);

const throwIfMissing = () => {
  throw new ValidationError('Missing parameter');
};

module.exports = {
  throwIfMissing,
  stringSchema: string,
  uint256Schema,
  nRlcAmountSchema,
  weiAmountSchema,
  addressSchema,
  bytes32Schema,
  apporderSchema,
  saltedApporderSchema,
  signedApporderSchema,
  datasetorderSchema,
  signedDatasetorderSchema,
  saltedDatasetorderSchema,
  workerpoolorderSchema,
  saltedWorkerpoolorderSchema,
  signedWorkerpoolorderSchema,
  requestorderSchema,
  saltedRequestorderSchema,
  signedRequestorderSchema,
  catidSchema,
  paramsSchema,
  objParamsSchema,
  paramsArgsSchema,
  paramsInputFilesArraySchema,
  paramsEncryptResultSchema,
  paramsStorageProviderSchema,
  tagSchema,
  chainIdSchema,
  hexnumberSchema,
  positiveIntSchema,
  positiveStrictIntSchema,
  mrenclaveSchema,
  appTypeSchema,
  appSchema,
  datasetSchema,
  categorySchema,
  workerpoolSchema,
  base64Encoded256bitsKeySchema,
  fileBufferSchema,
  ValidationError,
};
