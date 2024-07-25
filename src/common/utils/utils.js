import Debug from 'debug';
import { Buffer } from 'buffer';
import { BN } from 'bn.js';
import {
  getAddress,
  randomBytes,
  formatUnits,
  parseUnits,
  hexlify,
  Result,
} from 'ethers';
// import-js/eslint-plugin-import/issues/2703
// eslint-disable-next-line import/no-unresolved
import { multiaddr } from '@multiformats/multiaddr';
import { ValidationError, ConfigurationError } from './errors.js';
import { NULL_BYTES32, TEE_FRAMEWORKS } from './constant.js';

export { BN } from 'bn.js';

const debug = Debug('iexec:utils');

export const bytes32Regex = /^(0x)([0-9a-f]{2}){32}$/;
export const addressRegex = /^(0x)([0-9a-fA-F]{2}){20}$/;

export const isBigInt = (obj) => typeof obj === 'bigint';

export const bnToBigInt = (bn) => BigInt(bn.toString());
export const bigIntToBn = (bigInt) => new BN(bigInt.toString());

const stringify = (val) => val.toString();

export const formatRLC = (nRLC) => {
  try {
    return formatUnits(stringify(nRLC), 9);
  } catch (error) {
    debug('formatRLC()', error);
    throw Error('Invalid nRLC');
  }
};

export const isRlcUnit = (str) => ['nRLC', 'RLC'].includes(str);

export const parseRLC = (value, defaultUnit = 'RLC') => {
  const [amount, inputUnit] = stringify(value).split(' ');
  const unit = inputUnit !== undefined ? inputUnit : defaultUnit;
  if (!isRlcUnit(unit)) {
    throw Error('Invalid token unit');
  }
  const pow = unit === 'RLC' ? 9 : 0;
  try {
    return bigIntToBn(parseUnits(amount, pow));
  } catch (error) {
    debug('parseRLC()', error);
    throw Error('Invalid token amount');
  }
};

export const formatEth = (wei) => {
  try {
    return formatUnits(BigInt(stringify(wei)));
  } catch (error) {
    debug('formatEth()', error);
    throw Error('Invalid wei');
  }
};

export const isEthUnit = (str) =>
  ['wei', 'kwei', 'mwei', 'gwei', 'szabo', 'finney', 'ether', 'eth'].includes(
    str,
  );

export const parseEth = (value, defaultUnit = 'ether') => {
  const [amount, inputUnit] = stringify(value).split(' ');
  const unit = inputUnit !== undefined ? inputUnit : defaultUnit;
  if (!isEthUnit(unit)) {
    throw Error('Invalid ether unit');
  }
  try {
    return bigIntToBn(parseUnits(amount, unit === 'eth' ? 'ether' : unit));
  } catch (error) {
    debug('formatEth()', error);
    throw Error('Invalid ether amount');
  }
};

export const truncateBnWeiToBnNRlc = (bnWei) => {
  const weiString = bnWei.toString();
  const nRlcString = weiString.length > 9 ? weiString.slice(0, -9) : '0';
  return new BN(nRlcString);
};

export const bnNRlcToBnWei = (bnNRlc) => {
  const nRlcString = bnNRlc.toString();
  const weiString = nRlcString !== '0' ? nRlcString.concat('000000000') : '0';
  return new BN(weiString);
};

export const bnifyNestedBigInt = (obj) => {
  const objOut = Array.isArray(obj) ? [] : {};
  Object.entries(obj).forEach((e) => {
    const [k, v] = e;
    if (isBigInt(v)) {
      objOut[k] = bigIntToBn(v);
    } else if (typeof v === 'object' && v !== null)
      objOut[k] = bnifyNestedBigInt(v);
    else objOut[k] = v;
  });
  return objOut;
};

export const stringifyNestedBn = (obj) => {
  const objOut = Array.isArray(obj) ? [] : {};
  Object.entries(obj).forEach((e) => {
    const [k, v] = e;
    if (v instanceof BN) {
      objOut[k] = v.toString();
    } else if (typeof v === 'object' && v !== null) {
      objOut[k] = stringifyNestedBn(v);
    } else objOut[k] = v;
  });
  return objOut;
};

export const checksummedAddress = (address) => getAddress(address);

export const utf8ToBuffer = (str) => Buffer.from(str, 'utf8');
export const hexToBuffer = (hexString) =>
  Buffer.from(hexString.substr(2), 'hex');

export const multiaddrHexToHuman = (hexString) => {
  let res;
  const buffer = hexToBuffer(hexString);
  try {
    res = multiaddr(new Uint8Array(buffer)).toString();
  } catch (error) {
    res = buffer.toString();
  }
  return res;
};

export const humanToMultiaddrBuffer = (str, { strict = true } = {}) => {
  let multiaddrBuffer;
  try {
    multiaddrBuffer = Buffer.from(multiaddr(str).bytes);
  } catch (error) {
    if (strict) throw error;
    multiaddrBuffer = utf8ToBuffer(str);
  }
  return multiaddrBuffer;
};

// ethers v6 uses proxies, this helper extracts a plain objet from a Result from ethers
export const formatEthersResult = (result) => {
  if (!(result instanceof Result)) {
    throw new TypeError(`value must be a ${Result.name}`);
  }

  // create a plain object from the proxy
  const obj = result.toObject();

  // check if obj is an array (may be empty)
  if (obj._ !== undefined || Object.keys(obj).length === 0) {
    const array = result.toArray();
    return array.map((v) => {
      // format nested
      if (v instanceof Result) {
        return formatEthersResult(v);
      }
      // convert bigints
      if (typeof v === 'bigint') {
        return bigIntToBn(v);
      }
      return v;
    });
  }

  // is an object
  Object.entries(obj).forEach(([k, v]) => {
    // format nested
    if (v instanceof Result) {
      obj[k] = formatEthersResult(v);
    }
    // convert bigints
    else if (typeof v === 'bigint') {
      obj[k] = bigIntToBn(v);
    }
  });
  return obj;
};

export const checkEventFromLogs = (eventName, logs = []) =>
  logs.find((log) => log.eventName === eventName) !== undefined;

export const getEventFromLogs = (eventName, logs, { strict = true } = {}) => {
  const eventFound = logs.find((log) => log.eventName === eventName);
  if (!eventFound) {
    if (strict) throw new Error(`Unknown event ${eventName}`);
    return undefined;
  }
  return eventFound;
};

export const parseTransactionLogs = (logs, abiInterface) =>
  logs
    .map((log) => {
      try {
        return abiInterface.parseLog(log);
      } catch (e) {
        return null;
      }
    })
    .filter((event) => event !== null);

export const getSalt = () => hexlify(randomBytes(32));

export const TAG_MAP = {
  tee: 0,
  [TEE_FRAMEWORKS.SCONE]: 1,
  [TEE_FRAMEWORKS.GRAMINE]: 2,
  gpu: 8,
};
Object.assign(
  TAG_MAP,
  Object.fromEntries(Object.entries(TAG_MAP).map(([k, v]) => [v, k])),
);

export const encodeTag = (tags) => {
  const binaryTags = new Array(256).fill(false);
  tags.forEach((tag) => {
    if (tag === '') return;
    if (TAG_MAP[tag] === undefined || typeof TAG_MAP[tag] !== 'number')
      throw new ValidationError(`Unknown tag ${tag}`);
    binaryTags[TAG_MAP[tag]] = true;
  });
  const binString = binaryTags.reduce(
    (acc, curr) => (curr ? `1${acc}` : `0${acc}`),
    '',
  );
  const hex = new BN(binString, 2).toString('hex');
  return NULL_BYTES32.substring(0, 66 - hex.length).concat(hex);
};

export const decodeTag = (tag) => {
  if (typeof tag !== 'string' || !bytes32Regex.test(tag))
    throw new ValidationError('tag must be bytes32 hex string');
  const binString = new BN(tag.substring(2), 'hex').toString(2);
  const tags = [];
  for (let i = 0; i < binString.length; i += 1) {
    const current = binString.charAt(binString.length - i - 1);
    if (current === '1') {
      const currentTag = TAG_MAP[i];
      if (currentTag === undefined || typeof currentTag !== 'string')
        throw new ValidationError(`Unknown bit ${i} in tag`);
      tags.push(currentTag);
    }
  }
  return tags;
};

export const sumTags = (tagArray) => {
  const binStringArray = tagArray.map((hexTag) => {
    if (typeof hexTag !== 'string' || !hexTag.match(bytes32Regex))
      throw new ValidationError('tag must be bytes32 hex string');
    return new BN(hexTag.substring(2), 'hex').toString(2);
  });
  let summedTagsBinString = '';
  for (let i = 0; i < 255; i += 1) {
    let currentBit = '0';
    binStringArray.forEach((binString) => {
      if (binString.charAt(binString.length - i - 1) === '1') {
        currentBit = '1';
      }
    });
    summedTagsBinString = currentBit + summedTagsBinString;
  }
  const hex = new BN(summedTagsBinString, 2).toString('hex');
  return NULL_BYTES32.substring(0, 66 - hex.length).concat(hex);
};

export const findMissingBitsInTag = (tag, requiredTag) => {
  if (typeof tag !== 'string' || !bytes32Regex.test(tag))
    throw new ValidationError('tag must be bytes32 hex string');
  if (typeof requiredTag !== 'string' || !bytes32Regex.test(requiredTag))
    throw new ValidationError('requiredTag must be bytes32 hex string');
  const tagBinString = new BN(tag.substring(2), 'hex').toString(2);
  const requiredTagBinString = new BN(requiredTag.substring(2), 'hex').toString(
    2,
  );
  const missingBits = [];
  for (let i = 0; i < requiredTagBinString.length; i += 1) {
    if (
      requiredTagBinString.charAt(requiredTagBinString.length - i - 1) ===
        '1' &&
      tagBinString.charAt(tagBinString.length - i - 1) !== '1'
    ) {
      missingBits.push(i);
    }
  }
  return missingBits;
};

export const checkActiveBitInTag = (tag, bit) => {
  if (typeof tag !== 'string' || !bytes32Regex.test(tag))
    throw new ValidationError('tag must be bytes32 hex string');
  if (typeof bit !== 'number' || bit < 0 || bit > 255)
    throw new ValidationError('Invalid bit tag');
  const binString = new BN(tag.substring(2), 'hex').toString(2);
  return binString.charAt(binString.length - bit - 1) === '1';
};

export const tagBitToHuman = (bit) => {
  if (typeof bit !== 'number' || bit < 0 || bit > 255)
    throw new ValidationError('Invalid bit tag');
  return TAG_MAP[bit] || bit;
};

export const sleep = (ms) =>
  new Promise((res) => {
    setTimeout(() => {
      res();
    }, ms);
  });

export const checkSigner = (contracts) => {
  if (!(contracts && contracts.signer)) {
    throw new ConfigurationError(
      'The current provider is not a signer, impossible to sign messages or transactions',
    );
  }
};

export const FETCH_INTERVAL = 5000;
