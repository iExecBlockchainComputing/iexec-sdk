const Debug = require('debug');
const ethjsUtil = require('ethjs-util');
const EC = require('elliptic').ec;
const BN = require('bn.js');
const keccak256 = require('js-sha3').keccak_256;

const debug = Debug('iexec:sig-utils');
const secp256k1 = new EC('secp256k1');

const zeros = bytes => Buffer.allocUnsafe(bytes).fill(0);

const setLength = (_msg, length, right) => {
  const buf = zeros(length);

  const msg = Buffer.from(_msg);
  if (right) {
    if (msg.length < length) {
      msg.copy(buf);
      return buf;
    }
    return msg.slice(0, length);
  }
  if (msg.length < length) {
    msg.copy(buf, length - msg.length);
    return buf;
  }
  return msg.slice(-length);
};

function addHexPrefix(str) {
  if (typeof str !== 'string') {
    return str;
  }

  return ethjsUtil.isHexPrefixed(str) ? str : `0x${str}`;
}

// Convert from short to canonical names
// FIXME: optimise or make this nicer?
function elementaryName(name) {
  if (name.startsWith('int[')) {
    return `int256${name.slice(3)}`;
  } if (name === 'int') {
    return 'int256';
  } if (name.startsWith('uint[')) {
    return `uint256${name.slice(4)}`;
  } if (name === 'uint') {
    return 'uint256';
  } if (name.startsWith('fixed[')) {
    return `fixed128x128${name.slice(5)}`;
  } if (name === 'fixed') {
    return 'fixed128x128';
  } if (name.startsWith('ufixed[')) {
    return `ufixed128x128${name.slice(6)}`;
  } if (name === 'ufixed') {
    return 'ufixed128x128';
  }
  return name;
}

// Parse N from type<N>
function parseTypeN(type) {
  return parseInt(/^\D+(\d+)$/.exec(type)[1], 10);
}

function parseNumber(arg) {
  const type = typeof arg;
  if (type === 'string') {
    if (ethjsUtil.isHexPrefixed(arg)) {
      return new BN(ethjsUtil.stripHexPrefix(arg), 16);
    }
    return new BN(arg, 10);
  } if (type === 'number') {
    return new BN(arg);
  } if (arg.toArray) {
    // assume this is a BN for the moment, replace with BN.isBN soon
    return arg;
  }
  throw new Error('Argument is not a number');
}

const solidityPack = (types, values) => {
  if (types.length !== values.length) {
    throw new Error('Number of types are not matching the values');
  }

  let size;
  let num;
  const ret = [];

  for (let i = 0; i < types.length; i += 1) {
    const type = elementaryName(types[i]);
    const value = values[i];

    if (type === 'bytes') {
      ret.push(value);
    } else if (type === 'string') {
      ret.push(Buffer.from(value, 'utf8'));
    } else if (type === 'bool') {
      ret.push(Buffer.from(value ? '01' : '00', 'hex'));
    } else if (type === 'address') {
      ret.push(setLength(value, 20));
    } else if (type.startsWith('bytes')) {
      size = parseTypeN(type);
      if (size < 1 || size > 32) {
        throw new Error(`Invalid bytes<N> width: ${size}`);
      }

      ret.push(setLength(value, size, true));
    } else if (type.startsWith('uint')) {
      size = parseTypeN(type);
      if (size % 8 || size < 8 || size > 256) {
        throw new Error(`Invalid uint<N> width: ${size}`);
      }

      num = parseNumber(value);
      if (num.bitLength() > size) {
        throw new Error(
          `Supplied uint exceeds width: ${size} vs ${num.bitLength()}`,
        );
      }

      ret.push(num.toArrayLike(Buffer, 'be', size / 8));
    } else if (type.startsWith('int')) {
      size = parseTypeN(type);
      if (size % 8 || size < 8 || size > 256) {
        throw new Error(`Invalid int<N> width: ${size}`);
      }

      num = parseNumber(value);
      if (num.bitLength() > size) {
        throw new Error(
          `Supplied int exceeds width: ${size} vs ${num.bitLength()}`,
        );
      }

      ret.push(num.toTwos(size).toArrayLike(Buffer, 'be', size / 8));
    } else {
      // FIXME: support all other types
      throw new Error(`Unsupported or invalid type: ${type}`);
    }
  }

  return Buffer.concat(ret);
};

const soliditySHA3 = (types, values) => {
  const solPack = solidityPack(types, values);
  const solSHA3 = Buffer.from(keccak256(solPack), 'hex');
  return solSHA3;
};
/**
 * @param typedData - Array of data along with types, as per EIP712.
 * @returns Buffer
 */
const typedSignatureHash = (typedData) => {
  const error = new Error('Expect argument to be non-empty array');
  if (typeof typedData !== 'object' || !typedData.length) throw error;

  const data = typedData.map(
    e => (e.type === 'bytes' ? Buffer.toBuffer(e.value) : e.value),
  );
  const types = typedData.map(e => e.type);
  const schema = typedData.map((e) => {
    if (!e.name) throw error;
    return `${e.type} ${e.name}`;
  });

  return soliditySHA3(
    ['bytes32', 'bytes32'],
    [
      soliditySHA3(new Array(typedData.length).fill('string'), schema),
      soliditySHA3(types, data),
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
  const vStr = ethjsUtil.stripHexPrefix(ethjsUtil.intToHex(vSig));
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

module.exports = {
  signTypedData,
};
