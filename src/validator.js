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

/* eslint no-template-curly-in-string: "off" */

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

const addressSchema = () => string()
  .transform((value) => {
    try {
      return getAddress(value.toLowerCase());
    } catch (e) {
      return value;
    }
  })
  .test('is-address', '${path} is not a valid ethereum address', (value) => {
    try {
      getAddress(value);
      return true;
    } catch (e) {
      return false;
    }
  });

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

const apporderSchema = () => object(
  {
    app: addressSchema().required(),
    appprice: uint256Schema().required(),
    volume: uint256Schema().required(),
    tag: tagSchema().required(),
    datasetrestrict: addressSchema().required(),
    workerpoolrestrict: addressSchema().required(),
    requesterrestrict: addressSchema().required(),
  },
  '${path} is not a valid signed apporder',
);

const saltedApporderSchema = () => apporderSchema().shape(salted(), '${path} is not a valid salted apporder');

const signedApporderSchema = () => saltedApporderSchema().shape(
  signed(),
  '${path} is not a valid signed apporder',
);

const datasetorderSchema = () => object(
  {
    dataset: addressSchema().required(),
    datasetprice: uint256Schema().required(),
    volume: uint256Schema().required(),
    tag: tagSchema().required(),
    apprestrict: addressSchema().required(),
    workerpoolrestrict: addressSchema().required(),
    requesterrestrict: addressSchema().required(),
  },
  '${path} is not a valid signed datasetorder',
);

const saltedDatasetorderSchema = () => datasetorderSchema().shape(
  salted(),
  '${path} is not a valid salted datasetorder',
);

const signedDatasetorderSchema = () => saltedDatasetorderSchema().shape(
  signed(),
  '${path} is not a valid signed datasetorder',
);

const workerpoolorderSchema = () => object(
  {
    workerpool: addressSchema().required(),
    workerpoolprice: uint256Schema().required(),
    volume: uint256Schema().required(),
    tag: tagSchema().required(),
    category: catidSchema().required(),
    trust: uint256Schema().required(),
    apprestrict: addressSchema().required(),
    datasetrestrict: addressSchema().required(),
    requesterrestrict: addressSchema().required(),
  },
  '${path} is not a valid signed workerpoolorder',
);

const saltedWorkerpoolorderSchema = () => workerpoolorderSchema().shape(
  salted(),
  '${path} is not a valid salted workerpoolorder',
);

const signedWorkerpoolorderSchema = () => saltedWorkerpoolorderSchema().shape(
  signed(),
  '${path} is not a valid salted workerpoolorder',
);

const requestorderSchema = () => object(
  {
    app: addressSchema().required(),
    appmaxprice: uint256Schema().required(),
    dataset: addressSchema().required(),
    datasetmaxprice: uint256Schema().required(),
    workerpool: addressSchema().required(),
    workerpoolmaxprice: uint256Schema().required(),
    requester: addressSchema().required(),
    volume: uint256Schema().required(),
    tag: tagSchema().required(),
    category: catidSchema().required(),
    trust: uint256Schema().required(),
    beneficiary: addressSchema().required(),
    callback: addressSchema().required(),
    params: paramsSchema(),
  },
  '${path} is not a valid signed requestorder',
);

const saltedRequestorderSchema = () => requestorderSchema().shape(
  salted(),
  '${path} is not a valid salted requestorder',
);

const signedRequestorderSchema = () => saltedRequestorderSchema().shape(
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

const appSchema = () => object({
  owner: addressSchema().required(),
  name: string().required(),
  type: string()
    .matches(/^(DOCKER){1}$/, '${path} is not a valid type')
    .required(),
  multiaddr: multiaddressSchema().required(),
  checksum: bytes32Schema().required(),
  mrenclave: mrenclaveSchema().required(),
});

const datasetSchema = () => object({
  owner: addressSchema().required(),
  name: string().required(),
  multiaddr: multiaddressSchema().required(),
  checksum: bytes32Schema().required(),
});

const workerpoolSchema = () => object({
  owner: addressSchema().required(),
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
