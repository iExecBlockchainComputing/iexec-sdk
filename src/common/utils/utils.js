import Debug from 'debug';
import { Buffer } from 'buffer';
import BnJs from 'bn.js';
import JSZip from 'jszip';
import NodeRSA from 'node-rsa';
import aesJs from 'aes-js';
import { utils, BigNumber } from 'ethers';
// import-js/eslint-plugin-import/issues/2703
// eslint-disable-next-line import/no-unresolved
import { multiaddr } from '@multiformats/multiaddr';
import { ValidationError, ConfigurationError } from './errors.js';
import { NULL_BYTES32, TEE_FRAMEWORKS } from './constant.js';

export const BN = BnJs;

const { getAddress, randomBytes, formatUnits, parseUnits, hexlify } = utils;

const debug = Debug('iexec:utils');

export const bytes32Regex = /^(0x)([0-9a-f]{2}){32}$/;
export const addressRegex = /^(0x)([0-9a-fA-F]{2}){20}$/;

export const isEthersBn = (obj) =>
  !!(obj._ethersType && obj._ethersType === 'BigNumber');

export const bnToEthersBn = (bn) => BigNumber.from(bn.toString());
export const ethersBnToBn = (ethersBn) => new BN(ethersBn.toString());

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
    return ethersBnToBn(parseUnits(amount, pow));
  } catch (error) {
    debug('parseRLC()', error);
    throw Error('Invalid token amount');
  }
};

export const formatEth = (wei) => {
  try {
    return formatUnits(BigNumber.from(stringify(wei)));
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
    return ethersBnToBn(parseUnits(amount, unit === 'eth' ? 'ether' : unit));
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

export const bnifyNestedEthersBn = (obj) => {
  const objOut = Array.isArray(obj) ? [] : {};
  Object.entries(obj).forEach((e) => {
    const [k, v] = e;
    if (isEthersBn(v)) {
      objOut[k] = ethersBnToBn(v);
    } else if (typeof v === 'object' && v._hex)
      objOut[k] = new BN(v._hex.substring(2), 16);
    else if (typeof v === 'object') objOut[k] = bnifyNestedEthersBn(v);
    else objOut[k] = v;
  });
  return objOut;
};

export const stringifyNestedBn = (obj) => {
  const objOut = Array.isArray(obj) ? [] : {};
  Object.entries(obj).forEach((e) => {
    const [k, v] = e;
    if (v instanceof BN) objOut[k] = v.toString();
    else if (typeof v === 'object') {
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

export const cleanRPC = (rpcObj) => {
  const keys = Object.keys(rpcObj);
  return keys.reduce((acc, curr) => {
    if (Number.isNaN(parseInt(curr, 10))) {
      let value;
      if (
        Array.isArray(rpcObj[curr]) &&
        !rpcObj[curr].find((e) => typeof e === 'object')
      ) {
        value = rpcObj[curr];
      } else if (typeof rpcObj[curr] === 'object') {
        value = cleanRPC(rpcObj[curr]);
      } else {
        value = rpcObj[curr];
      }
      return Object.assign(acc, { [curr]: value });
    }
    return acc;
  }, {});
};

export const checkEvent = (eventName, events) => {
  let confirm = false;
  events.forEach((event) => {
    if (event.event === eventName) confirm = true;
  });
  return confirm;
};

export const getEventFromLogs = (eventName, events, { strict = true } = {}) => {
  const eventFound = events.find((event) => event.event === eventName);
  if (!eventFound) {
    if (strict) throw new Error(`Unknown event ${eventName}`);
    return {};
  }
  return eventFound;
};

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

export const decryptResult = async (encResultsZipBuffer, beneficiaryKey) => {
  const encKeyFile = 'aes-key.rsa';
  const encResultsFile = 'iexec_out.zip.aes';

  const encryptedZipBuffer = Buffer.from(encResultsZipBuffer);
  const keyBuffer = Buffer.from(beneficiaryKey);

  let zip;
  try {
    zip = await new JSZip().loadAsync(encryptedZipBuffer);
  } catch (error) {
    debug(error);
    throw Error('Failed to load encrypted results zip file');
  }

  let encryptedResultsKeyArrayBuffer;
  try {
    encryptedResultsKeyArrayBuffer = await zip
      .file(encKeyFile)
      .async('arraybuffer');
  } catch (error) {
    throw Error(`Missing ${encKeyFile} file in zip input file`);
  }

  const base64encodedEncryptedAesKey = Buffer.from(
    encryptedResultsKeyArrayBuffer,
  ).toString();

  const encryptedAesKeyBuffer = Buffer.from(
    base64encodedEncryptedAesKey,
    'base64',
  );

  debug('Decrypting results key');
  let aesKeyBuffer;
  try {
    const key = new NodeRSA(keyBuffer, {
      encryptionScheme: 'pkcs1',
    });
    const decryptedAesKeyBuffer = key.decrypt(encryptedAesKeyBuffer);

    // alt not used because crypto-browserify does not support createPrivateKey
    // const decryptedAesKeyBuffer = crypto.privateDecrypt(
    //   {
    //     key: crypto.createPrivateKey(keyBuffer),
    //     padding: crypto.constants.RSA_PKCS1_PADDING,
    //   },
    //   encryptedAesKeyBuffer,
    // );

    const base64EncodedResultsKey = decryptedAesKeyBuffer.toString();
    aesKeyBuffer = Buffer.from(base64EncodedResultsKey, 'base64');
  } catch (error) {
    debug(error);
    throw Error('Failed to decrypt results key with beneficiary key');
  }

  debug('Decrypting results');
  let encryptedZipArrayBuffer;

  try {
    encryptedZipArrayBuffer = await zip
      .file(encResultsFile)
      .async('arraybuffer');
  } catch (error) {
    throw Error(`Missing ${encResultsFile} file in zip input file`);
  }

  // decrypt AES ECB (with one time AES key)
  try {
    const aesEcb = new aesJs.ModeOfOperation.ecb(aesKeyBuffer);
    const base64EncodedEncryptedZip = Buffer.from(
      encryptedZipArrayBuffer,
    ).toString();
    const encryptedOutZipBuffer = Buffer.from(
      base64EncodedEncryptedZip,
      'base64',
    );
    const decryptedOutZipBuffer = Buffer.from(
      aesEcb.decrypt(encryptedOutZipBuffer),
    );
    // remove pkcs7 padding
    const padding = decryptedOutZipBuffer[decryptedOutZipBuffer.length - 1];
    return decryptedOutZipBuffer.slice(
      0,
      decryptedOutZipBuffer.length - padding,
    );
  } catch (error) {
    debug(error);
    throw Error('Failed to decrypt results with decrypted results key');
  }
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
