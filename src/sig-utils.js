const Debug = require('debug');
const { intToHex, isHexPrefixed, stripHexPrefix } = require('ethjs-util');
const EC = require('elliptic').ec;
const BN = require('bn.js');
const {
  defaultAbiCoder,
  keccak256,
  solidityKeccak256,
  bigNumberify,
} = require('ethers').utils;

const debug = Debug('iexec:sig-utils');
const secp256k1 = new EC('secp256k1');

const addHexPrefix = (str) => {
  if (typeof str !== 'string') {
    return str;
  }
  return isHexPrefixed(str) ? str : `0x${str}`;
};

const typedSignatureHash = (typedData) => {
  const error = new Error('Expect argument to be non-empty array');
  if (typeof typedData !== 'object' || !typedData.length) throw error;

  const data = typedData.map(e => (e.type === 'bytes' ? Buffer.toBuffer(e.value) : e.value));
  const types = typedData.map(e => e.type);
  const schema = typedData.map((e) => {
    if (!e.name) throw error;
    return `${e.type} ${e.name}`;
  });

  return solidityKeccak256(
    ['bytes32', 'bytes32'],
    [
      solidityKeccak256(new Array(typedData.length).fill('string'), schema),
      solidityKeccak256(types, data),
    ],
  );
};

function padWithZeroes(number, length) {
  let myString = `${number}`;
  while (myString.length < length) {
    myString = `0${myString}`;
  }
  return myString;
}

const signsecp256k1 = (message, privateKey, noncefn, data) => {
  try {
    const privKeyBuffer = Buffer.from(privateKey, 'hex');
    const messageBuffer = Buffer.from(message);
    const result = secp256k1.sign(messageBuffer, privKeyBuffer, {
      canonical: true,
      k: noncefn,
      pers: data,
    });
    const res = {
      signature: Buffer.concat([
        result.r.toArrayLike(Buffer, 'be', 32),
        result.s.toArrayLike(Buffer, 'be', 32),
      ]),
      recovery: result.recoveryParam,
    };
    return res;
  } catch (error) {
    debug('sign()', error);
    throw error;
  }
};

const ecsign = (msgHash, privateKey) => {
  const sig = signsecp256k1(msgHash, privateKey);
  const ret = {};
  ret.r = sig.signature.slice(0, 32);
  ret.s = sig.signature.slice(32, 64);
  ret.v = sig.recovery + 27;
  return ret;
};

const fromSigned = num => new BN(num).fromTwos(256);
const bufferToInt = buf => new BN(buf).toNumber();
const toUnsigned = num => Buffer.from(num.toTwos(256).toArray());

const concatSig = (v, r, s) => {
  const rSig = fromSigned(r);
  const sSig = fromSigned(s);
  const vSig = bufferToInt(v);
  const rStr = padWithZeroes(toUnsigned(rSig).toString('hex'), 64);
  const sStr = padWithZeroes(toUnsigned(sSig).toString('hex'), 64);
  const vStr = stripHexPrefix(intToHex(vSig));
  return addHexPrefix(rStr.concat(sStr, vStr)).toString('hex');
};

const signTypedData = (privateKey, msgParams) => {
  const msgHash = typedSignatureHash(msgParams.data);
  debug('msgHash', msgHash);
  const sig = ecsign(msgHash, privateKey);
  const buff = concatSig(sig.v, sig.r, sig.s);
  const hex = buff.toString('hex');
  return hex;
};

const getStructType = (primaryType, members) => {
  const reducer = (oldValue, e) => {
    let newValue = oldValue;
    if (newValue) newValue = newValue.concat(',');
    newValue = newValue.concat(e.type.concat(' ').concat(e.name));
    return newValue;
  };
  const args = members.reduce(reducer, String(''));
  const structType = primaryType
    .concat('(')
    .concat(args)
    .concat(')');
  return structType;
};

const hashStruct = (primaryType, members, obj) => {
  const type = getStructType(primaryType, members);
  const typeHash = keccak256(Buffer.from(type, 'utf8'));
  const encodedTypes = ['bytes32'].concat(
    members.map((e) => {
      if (e.type === 'string' || e.type === 'bytes') return 'bytes32';
      return e.type;
    }),
  );
  const values = [typeHash].concat(
    members.map((e) => {
      if (e.type === 'string') return keccak256(Buffer.from(obj[e.name], 'utf8'));
      if (e.type === 'uint256') return bigNumberify(obj[e.name]);
      if (e.type === 'uint8') return bigNumberify(obj[e.name]);
      return obj[e.name];
    }),
  );
  const encoded = defaultAbiCoder.encode(encodedTypes, values);
  const structHash = keccak256(encoded);
  return structHash;
};

const hashEIP712 = (typedData) => {
  const domainSeparatorHash = hashStruct(
    'EIP712Domain',
    typedData.types.EIP712Domain,
    typedData.domain,
  );
  const messageHash = hashStruct(
    typedData.primaryType,
    typedData.types[typedData.primaryType],
    typedData.message,
  );
  const hash = solidityKeccak256(
    ['bytes', 'bytes32', 'bytes32'],
    ['0x1901', domainSeparatorHash, messageHash],
  );
  return hash;
};

const signTypedDatav3 = async (privateKey, typedData) => {
  try {
    debug('typedData', typedData);
    const privKeyBuffer = Buffer.from(privateKey, 'hex');
    const solSha3 = hashEIP712(JSON.parse(typedData));
    const sig = ecsign(Buffer.from(solSha3.substr(2), 'hex'), privKeyBuffer);
    const sign = {
      r: addHexPrefix(sig.r.toString('hex')),
      s: addHexPrefix(sig.s.toString('hex')),
      v: sig.v,
    };
    const serializedSign = addHexPrefix(
      sign.r
        .substr(2)
        .concat(sign.s.substr(2))
        .concat(sign.v.toString(16)),
    );
    return serializedSign;
  } catch (error) {
    debug('signStruct()', error);
    throw error;
  }
};

const deserializeSig = (sig) => {
  const r = addHexPrefix(sig.substring(2).substr(0, 64));
  const s = addHexPrefix(sig.substring(2).substr(64, 64));
  const v = parseInt(sig.substring(2).substr(128, 2), 16);
  return { r, s, v };
};

module.exports = {
  signTypedData,
  signTypedDatav3,
  deserializeSig,
  hashStruct,
  hashEIP712,
};
