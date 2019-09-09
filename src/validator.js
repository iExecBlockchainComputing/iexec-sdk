const { string, number, object } = require('yup');
const { getAddress } = require('ethers').utils;

/* eslint no-template-curly-in-string: "off" */

const stringNumberSchema = () => string()
  .transform((value) => {
    const trimed = value.replace(/^0+/, '');
    return trimed.length > 0 ? trimed : '0';
  })
  .matches(/^[0-9]*$/, '${path} must be a number');

const positiveIntSchema = () => number()
  .integer()
  .min(0);

const positiveStrictIntSchema = () => number()
  .integer()
  .min(1);

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
  .matches(/^(0x)([0-9a-f]{2}){32}$/, '${path} must be a bytes32 hexstring');

const orderSignSchema = () => string().matches(/^(0x)([0-9a-f]{2})*/, '${path} must be a valid signature');

const signed = () => ({
  salt: bytes32Schema().required(),
  sign: orderSignSchema().required(),
});

const paramsSchema = () => string();

const apporderSchema = () => object(
  {
    app: addressSchema().required(),
    appprice: uint256Schema().required(),
    volume: uint256Schema().required(),
    tag: bytes32Schema().required(),
    datasetrestrict: addressSchema().required(),
    workerpoolrestrict: addressSchema().required(),
    requesterrestrict: addressSchema().required(),
  },
  '${path} is not a valid signed apporder',
);

const signedApporderSchema = () => apporderSchema().shape(signed(), '${path} is not a valid signed apporder');

const datasetorderSchema = () => object(
  {
    dataset: addressSchema().required(),
    datasetprice: uint256Schema().required(),
    volume: uint256Schema().required(),
    tag: bytes32Schema().required(),
    apprestrict: addressSchema().required(),
    workerpoolrestrict: addressSchema().required(),
    requesterrestrict: addressSchema().required(),
  },
  '${path} is not a valid signed datasetorder',
);

const signedDatasetorderSchema = () => datasetorderSchema().shape(
  signed(),
  '${path} is not a valid signed datasetorder',
);

const workerpoolorderSchema = () => object(
  {
    workerpool: addressSchema().required(),
    workerpoolprice: uint256Schema().required(),
    volume: uint256Schema().required(),
    tag: bytes32Schema().required(),
    category: uint256Schema().required(),
    trust: uint256Schema().required(),
    apprestrict: addressSchema().required(),
    datasetrestrict: addressSchema().required(),
    requesterrestrict: addressSchema().required(),
  },
  '${path} is not a valid signed workerpoolorder',
);

const signedWorkerpoolorderSchema = () => workerpoolorderSchema().shape(
  signed(),
  '${path} is not a valid signed workerpoolorder',
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
    tag: bytes32Schema().required(),
    category: uint256Schema().required(),
    trust: uint256Schema().required(),
    beneficiary: addressSchema().required(),
    callback: addressSchema().required(),
    params: paramsSchema(),
  },
  '${path} is not a valid signed requestorder',
);

const signedRequestorderSchema = () => requestorderSchema().shape(
  signed(),
  '${path} is not a valid signed requestorder',
);

module.exports = {
  stringSchema: string,
  uint256Schema,
  addressSchema,
  bytes32Schema,
  apporderSchema,
  signedApporderSchema,
  datasetorderSchema,
  signedDatasetorderSchema,
  workerpoolorderSchema,
  signedWorkerpoolorderSchema,
  requestorderSchema,
  signedRequestorderSchema,
  paramsSchema,
  chainIdSchema,
  hexnumberSchema,
  positiveIntSchema,
  positiveStrictIntSchema,
};