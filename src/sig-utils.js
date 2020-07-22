const Debug = require('debug');
const { Buffer } = require('buffer');
const {
  SigningKey,
  defaultAbiCoder,
  keccak256,
  joinSignature,
} = require('ethers').utils;

const debug = Debug('iexec:sig-utils');

// Typed data signature inspired by eth-sig-util refactored to work with ethers
const rawEncode = (encodedTypes, encodedValues) => Buffer.from(
  defaultAbiCoder.encode(encodedTypes, encodedValues).substr(2),
  'hex',
);
const sha3 = (value) => {
  const b = Buffer.from(keccak256(Buffer.from(value)).substr(2), 'hex');
  return b;
};

const TYPED_MESSAGE_SCHEMA = {
  type: 'object',
  properties: {
    types: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
          },
          required: ['name', 'type'],
        },
      },
    },
    primaryType: { type: 'string' },
    domain: { type: 'object' },
    message: { type: 'object' },
  },
  required: ['types', 'primaryType', 'domain', 'message'],
};

const TypedDataUtils = {
  encodeData(primaryType, data, types) {
    const encodedTypes = ['bytes32'];
    const encodedValues = [this.hashType(primaryType, types)];
    types[primaryType].forEach((field) => {
      let value = data[field.name];
      if (value !== undefined) {
        if (field.type === 'bytes') {
          encodedTypes.push('bytes32');
          value = sha3(value);
          encodedValues.push(value);
        } else if (field.type === 'string') {
          encodedTypes.push('bytes32');
          // convert string to buffer - prevents from interpreting strings like '0xabcd' as hex
          if (typeof value === 'string') {
            value = Buffer.from(value, 'utf8');
          }
          value = sha3(value);
          encodedValues.push(value);
        } else if (types[field.type] !== undefined) {
          encodedTypes.push('bytes32');
          value = sha3(this.encodeData(field.type, value, types));
          encodedValues.push(value);
        } else if (field.type.lastIndexOf(']') === field.type.length - 1) {
          throw new Error('Arrays currently unimplemented in encodeData');
        } else {
          encodedTypes.push(field.type);
          encodedValues.push(value);
        }
      }
    });
    return rawEncode(encodedTypes, encodedValues);
  },

  encodeType(primaryType, types) {
    let result = '';
    let deps = this.findTypeDependencies(primaryType, types).filter(
      dep => dep !== primaryType,
    );
    deps = [primaryType].concat(deps.sort());
    deps.forEach((type) => {
      const children = types[type];
      if (!children) {
        throw new Error(`No type definition specified: ${type}`);
      }
      result += `${type}(${types[type]
        .map(obj => `${obj.type} ${obj.name}`)
        .join(',')})`;
    });
    return result;
  },

  findTypeDependencies(primaryType, types, results = []) {
    const [sanitizedPrimaryType] = primaryType.match(/^\w*/);
    if (
      results.includes(sanitizedPrimaryType)
      || types[sanitizedPrimaryType] === undefined
    ) {
      return results;
    }
    results.push(sanitizedPrimaryType);
    types[sanitizedPrimaryType].forEach((field) => {
      this.findTypeDependencies(field.type, types, results).forEach((dep) => {
        if (!results.includes(dep)) results.push(dep);
      });
    });
    return results;
  },

  hashStruct(primaryType, data, types) {
    return sha3(this.encodeData(primaryType, data, types));
  },

  hashType(primaryType, types) {
    return sha3(this.encodeType(primaryType, types));
  },

  sanitizeData(data) {
    const sanitizedData = {};
    Object.keys(TYPED_MESSAGE_SCHEMA.properties).forEach((key) => {
      if (data[key]) sanitizedData[key] = data[key];
    });
    if (sanitizedData.types) {
      sanitizedData.types = Object.assign(
        { EIP712Domain: [] },
        sanitizedData.types,
      );
    }
    return sanitizedData;
  },

  sign(typedData) {
    const sanitizedData = this.sanitizeData(typedData);
    const parts = [Buffer.from('1901', 'hex')];
    parts.push(
      this.hashStruct(
        'EIP712Domain',
        sanitizedData.domain,
        sanitizedData.types,
      ),
    );
    if (sanitizedData.primaryType !== 'EIP712Domain') {
      parts.push(
        this.hashStruct(
          sanitizedData.primaryType,
          sanitizedData.message,
          sanitizedData.types,
        ),
      );
    }
    return sha3(Buffer.concat(parts));
  },
};

const signTypedData = (privateKey, msgParams) => {
  try {
    const messageHash = TypedDataUtils.sign(msgParams.data);
    const hexSig = new SigningKey(privateKey).signDigest(messageHash);
    const signature = joinSignature(hexSig);
    return signature;
  } catch (error) {
    debug('signTypedData()', error);
    throw error;
  }
};

const hashEIP712 = (typedData) => {
  try {
    return '0x'.concat(TypedDataUtils.sign(typedData).toString('hex'));
  } catch (error) {
    debug('hashEIP712()', error);
    throw error;
  }
};

const signTypedDataV3 = wallet => async (typedData) => {
  try {
    const pk = Buffer.from(wallet.privateKey.substring(2), 'hex');
    const sign = signTypedData(pk, { data: typedData });
    return sign;
  } catch (error) {
    console.error('signTypedDataV3()', error);
    throw error;
  }
};

module.exports = {
  signTypedDataV3,
  hashEIP712,
};
