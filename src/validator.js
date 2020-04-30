const Debug = require('debug');
const {
  string, number, object, mixed,
} = require('yup');
const { getAddress } = require('ethers').utils;
const {
  humanToMultiaddrBuffer,
  utf8ToBuffer,
  encodeTag,
  bytes32Regex,
} = require('./utils');
const { ValidationError } = require('./errors');
const { wrapCall } = require('./errorWrappers');

/* eslint no-template-curly-in-string: "off" */

const debug = Debug('validators');

const stringNumberSchema = () => string()
  .transform((value) => {
    const trimed = value.replace(/^0+/, '');
    return trimed.length > 0 ? trimed : '0';
  })
  .matches(/^[0-9]*$/, '${path} must be a number');

const integerSchema = () => number().integer();

const positiveIntSchema = () => integerSchema()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER - 1);

const positiveStrictIntSchema = () => integerSchema()
  .min(1)
  .max(Number.MAX_SAFE_INTEGER - 1);

const hexnumberSchema = () => string()
  .lowercase()
  .matches(/^(0x)([0-9a-f]{2})*$/, '${path} must be a hex number');

const uint256Schema = () => stringNumberSchema();

const chainIdSchema = () => stringNumberSchema();

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
            const addressPromise = new Promise(async (resolve, reject) => {
              try {
                debug('resolving ENS', value);
                const resolved = await wrapCall(
                  ethProvider.resolveName(value),
                );
                debug('resolved ENS', resolved);
                resolve(resolved);
              } catch (error) {
                debug('ENS resolution error', error);
              }
              reject(value);
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
    'unable to resolve ENS ${originalValue}',
    async (value) => {
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
    (value) => {
      if (typeof value === 'string') {
        try {
          getAddress(value);
        } catch (e) {
          return false;
        }
      }
      return true;
    },
  );

const bytes32Schema = () => string()
  .lowercase()
  .matches(bytes32Regex, '${path} must be a bytes32 hexstring');

const orderSignSchema = () => string().matches(/^(0x)([0-9a-f]{2})*/, '${path} must be a valid signature');

const salted = () => ({
  salt: bytes32Schema().required(),
});

const signed = () => ({
  sign: orderSignSchema().required(),
});

const catidSchema = () => uint256Schema();

const paramsSchema = () => string().transform((value, originalValue) => {
  if (typeof originalValue === 'object') {
    return JSON.stringify(originalValue);
  }
  return value;
});

const tagSchema = () => mixed()
  .transform((value) => {
    if (Array.isArray(value)) {
      try {
        const bytes32Tag = encodeTag(value);
        return bytes32Tag;
      } catch (e) {
        return `invalid tag: ${e.message}`;
      }
    }
    if (typeof value === 'string') {
      const lowerCase = value.toLowerCase();
      if (lowerCase.substr(0, 2) === '0x') return lowerCase;
      try {
        const bytes32Tag = encodeTag(value.split(','));
        return bytes32Tag;
      } catch (e) {
        return `invalid tag: ${e.message}`;
      }
    }
    return 'invalid tag';
  })
  .test('no-transform-error', '${value}', async (value) => {
    if (value.substr(0, 2) !== '0x') return false;
    return true;
  })
  .test('is-bytes32', '${path} must be a bytes32 hexstring', async (value) => {
    const res = await bytes32Schema().validate(value);
    return res;
  });

const apporderSchema = opt => object(
  {
    app: addressSchema(opt).required(),
    appprice: uint256Schema().required(),
    volume: uint256Schema().required(),
    tag: tagSchema().required(),
    datasetrestrict: addressSchema(opt).required(),
    workerpoolrestrict: addressSchema(opt).required(),
    requesterrestrict: addressSchema(opt).required(),
  },
  '${path} is not a valid signed apporder',
);

const saltedApporderSchema = opt => apporderSchema(opt).shape(salted(), '${path} is not a valid salted apporder');

const signedApporderSchema = opt => saltedApporderSchema(opt).shape(
  signed(),
  '${path} is not a valid signed apporder',
);

const datasetorderSchema = opt => object(
  {
    dataset: addressSchema(opt).required(),
    datasetprice: uint256Schema().required(),
    volume: uint256Schema().required(),
    tag: tagSchema().required(),
    apprestrict: addressSchema(opt).required(),
    workerpoolrestrict: addressSchema(opt).required(),
    requesterrestrict: addressSchema(opt).required(),
  },
  '${path} is not a valid signed datasetorder',
);

const saltedDatasetorderSchema = opt => datasetorderSchema(opt).shape(
  salted(),
  '${path} is not a valid salted datasetorder',
);

const signedDatasetorderSchema = opt => saltedDatasetorderSchema(opt).shape(
  signed(),
  '${path} is not a valid signed datasetorder',
);

const workerpoolorderSchema = opt => object(
  {
    workerpool: addressSchema(opt).required(),
    workerpoolprice: uint256Schema().required(),
    volume: uint256Schema().required(),
    tag: tagSchema().required(),
    category: catidSchema().required(),
    trust: uint256Schema().required(),
    apprestrict: addressSchema(opt).required(),
    datasetrestrict: addressSchema(opt).required(),
    requesterrestrict: addressSchema(opt).required(),
  },
  '${path} is not a valid signed workerpoolorder',
);

const saltedWorkerpoolorderSchema = opt => workerpoolorderSchema(opt).shape(
  salted(),
  '${path} is not a valid salted workerpoolorder',
);

const signedWorkerpoolorderSchema = opt => saltedWorkerpoolorderSchema(opt).shape(
  signed(),
  '${path} is not a valid salted workerpoolorder',
);

const requestorderSchema = opt => object(
  {
    app: addressSchema(opt).required(),
    appmaxprice: uint256Schema().required(),
    dataset: addressSchema(opt).required(),
    datasetmaxprice: uint256Schema().required(),
    workerpool: addressSchema(opt).required(),
    workerpoolmaxprice: uint256Schema().required(),
    requester: addressSchema(opt).required(),
    volume: uint256Schema().required(),
    tag: tagSchema().required(),
    category: catidSchema().required(),
    trust: uint256Schema().required(),
    beneficiary: addressSchema(opt).required(),
    callback: addressSchema(opt).required(),
    params: paramsSchema(),
  },
  '${path} is not a valid signed requestorder',
);

const saltedRequestorderSchema = opt => requestorderSchema(opt).shape(
  salted(),
  '${path} is not a valid salted requestorder',
);

const signedRequestorderSchema = opt => saltedRequestorderSchema(opt).shape(
  signed(),
  '${path} is not a valid signed requestorder',
);

const multiaddressSchema = () => mixed().transform((value) => {
  if (value instanceof Uint8Array) return value;
  if (typeof value === 'string') {
    return humanToMultiaddrBuffer(value, { strict: false });
  }
  throw new ValidationError('invalid multiaddr');
});

const mrenclaveSchema = () => mixed().transform((value) => {
  if (value instanceof Uint8Array) return value;
  return utf8ToBuffer(value);
});

const appSchema = opt => object({
  owner: addressSchema(opt).required(),
  name: string().required(),
  type: string()
    .matches(/^(DOCKER){1}$/, '${path} is not a valid type')
    .required(),
  multiaddr: multiaddressSchema().required(),
  checksum: bytes32Schema().required(),
  mrenclave: mrenclaveSchema().required(),
});

const datasetSchema = opt => object({
  owner: addressSchema(opt).required(),
  name: string().required(),
  multiaddr: multiaddressSchema().required(),
  checksum: bytes32Schema().required(),
});

const workerpoolSchema = opt => object({
  owner: addressSchema(opt).required(),
  description: string().required(),
});

const categorySchema = () => object({
  name: string().required(),
  description: string().required(),
  workClockTimeRef: uint256Schema().required(),
});

const throwIfMissing = () => {
  throw new ValidationError('missing parameter');
};

module.exports = {
  throwIfMissing,
  stringSchema: string,
  uint256Schema,
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
  tagSchema,
  chainIdSchema,
  hexnumberSchema,
  positiveIntSchema,
  positiveStrictIntSchema,
  appSchema,
  datasetSchema,
  categorySchema,
  workerpoolSchema,
  ValidationError,
};
