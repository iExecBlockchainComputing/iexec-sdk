const Debug = require('debug');
const { Buffer } = require('buffer');
const BN = require('bn.js');
const JSZip = require('jszip');
const NodeRSA = require('node-rsa');
const aesjs = require('aes-js');
const {
  getAddress,
  randomBytes,
  formatUnits,
  parseUnits,
} = require('ethers').utils;
const { BigNumber } = require('ethers');
const multiaddr = require('multiaddr');
const { ValidationError } = require('./errors');

const debug = Debug('iexec:utils');

const NULL_BYTES = '0x';
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const NULL_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

const bytes32Regex = /^(0x)([0-9a-f]{2}){32}$/;
const addressRegex = /^(0x)([0-9a-fA-F]{2}){20}$/;

const isEthersBn = obj => !!(obj._ethersType && obj._ethersType === 'BigNumber');

const bnToEthersBn = bn => BigNumber.from(bn.toString());
const ethersBnToBn = ethersBn => new BN(ethersBn.toString());

const stringify = (val) => {
  try {
    let stringVal;
    switch (typeof nRLC) {
      case 'number':
        stringVal = Number(val).toString();
        break;
      case 'string':
        stringVal = val;
        break;
      default:
        stringVal = val.toString();
        break;
    }
    return stringVal;
  } catch (error) {
    debug('stringify()', error);
    throw Error('Invalid val');
  }
};

const formatRLC = (nRLC) => {
  try {
    return formatUnits(stringify(nRLC), 9);
  } catch (error) {
    debug('formatRLC()', error);
    throw Error('Invalid nRLC');
  }
};

const parseRLC = (value, defaultUnit = 'RLC') => {
  const [amount, inputUnit] = stringify(value).split(' ');
  const unit = inputUnit !== undefined ? inputUnit : defaultUnit;
  let pow;
  if (unit === 'RLC') {
    pow = 9;
  } else if (unit === 'nRLC') {
    pow = 0;
  } else {
    throw Error('Invalid token unit');
  }
  try {
    return ethersBnToBn(parseUnits(amount, pow));
  } catch (error) {
    debug('parseRLC()', error);
    throw Error('Invalid token amount');
  }
};

const formatEth = (wei) => {
  try {
    return formatUnits(BigNumber.from(stringify(wei)));
  } catch (error) {
    debug('formatEth()', error);
    throw Error('Invalid wei');
  }
};

const parseEth = (value, defaultUnit = 'ether') => {
  const [amount, inputUnit] = stringify(value).split(' ');
  const unit = inputUnit !== undefined ? inputUnit : defaultUnit;
  if (
    !['wei', 'kwei', 'mwei', 'gwei', 'szabo', 'finney', 'ether'].includes(unit)
  ) {
    throw Error('Invalid ether unit');
  }
  try {
    return ethersBnToBn(parseUnits(amount, unit));
  } catch (error) {
    debug('formatEth()', error);
    throw Error('Invalid ether amount');
  }
};

const truncateBnWeiToBnNRlc = (bnWei) => {
  const weiString = bnWei.toString();
  const nRlcString = weiString.length > 9 ? weiString.slice(0, -9) : '0';
  return new BN(nRlcString);
};

const bnNRlcToBnWei = (bnNRlc) => {
  const nRlcString = bnNRlc.toString();
  const weiString = nRlcString !== '0' ? nRlcString.concat('000000000') : '0';
  return new BN(weiString);
};

const bnifyNestedEthersBn = (obj) => {
  const objOut = {};
  Object.entries(obj).forEach((e) => {
    const [k, v] = e;
    if (isEthersBn(v)) {
      objOut[k] = ethersBnToBn(v);
    } else if (typeof v === 'object' && v._hex) objOut[k] = new BN(v._hex.substring(2), 16);
    else if (typeof v === 'object') objOut[k] = bnifyNestedEthersBn(v);
    else objOut[k] = v;
  });
  return objOut;
};

const stringifyNestedBn = (obj) => {
  const objOut = {};
  Object.entries(obj).forEach((e) => {
    const [k, v] = e;
    if (v instanceof BN) objOut[k] = v.toString();
    else if (typeof v === 'object') {
      objOut[k] = stringifyNestedBn(v);
    } else objOut[k] = v;
  });
  return objOut;
};

const checksummedAddress = address => getAddress(address);

const utf8ToBuffer = str => Buffer.from(str, 'utf8');
const hexToBuffer = hexString => Buffer.from(hexString.substr(2), 'hex');

const multiaddrHexToHuman = (hexString) => {
  let res;
  const buffer = hexToBuffer(hexString);
  try {
    res = multiaddr(buffer).toString('utf8');
  } catch (error) {
    res = buffer.toString();
  }
  return res;
};

const humanToMultiaddrBuffer = (str, { strict = true } = {}) => {
  let multiaddrBuffer;
  try {
    multiaddrBuffer = multiaddr(str).buffer;
  } catch (error) {
    if (strict) throw error;
    multiaddrBuffer = utf8ToBuffer(str);
  }
  return multiaddrBuffer;
};

const cleanRPC = (rpcObj) => {
  const keys = Object.keys(rpcObj);
  const cleanObj = keys.reduce((accu, curr) => {
    if (Number.isNaN(parseInt(curr, 10))) {
      let value;
      if (
        Array.isArray(rpcObj[curr])
        && !rpcObj[curr].find(e => typeof e === 'object')
      ) {
        value = rpcObj[curr];
      } else if (typeof rpcObj[curr] === 'object') {
        value = cleanRPC(rpcObj[curr]);
      } else {
        value = rpcObj[curr];
      }
      return Object.assign(accu, { [curr]: value });
    }
    return accu;
  }, {});
  return cleanObj;
};

const checkEvent = (eventName, events) => {
  let confirm = false;
  events.forEach((event) => {
    if (event.event === eventName) confirm = true;
  });
  return confirm;
};

const getEventFromLogs = (eventName, events, { strict = true } = {}) => {
  let eventFound;
  events.forEach((event) => {
    if (event.event === eventName) {
      eventFound = event;
    }
  });
  if (!eventFound) {
    if (strict) throw new Error(`Unknown event ${eventName}`);
    return {};
  }
  return eventFound;
};

const secToDate = (secs) => {
  const t = new Date(1970, 0, 1);
  t.setSeconds(secs);
  return t;
};

const getSalt = () => {
  const hex = BigNumber.from(randomBytes(32))
    .toHexString()
    .substring(2);
  const salt = NULL_BYTES32.substr(0, 66 - hex.length).concat(hex);
  return salt;
};

const TAG_MAP = {
  tee: 1,
  1: 'tee',
  gpu: 9,
  9: 'gpu',
};

const encodeTag = (tags) => {
  const binaryTags = new Array(256).fill(false);
  tags.forEach((tag) => {
    if (TAG_MAP[tag] === undefined || typeof TAG_MAP[tag] !== 'number') throw new ValidationError(`Unknown tag ${tag}`);
    binaryTags[TAG_MAP[tag] - 1] = true;
  });
  const binString = binaryTags.reduce(
    (acc, curr) => (curr ? `1${acc}` : `0${acc}`),
    '',
  );
  const hex = new BN(binString, 2).toString('hex');
  const encodedTag = NULL_BYTES32.substr(0, 66 - hex.length).concat(hex);
  return encodedTag;
};

const decodeTag = (tag) => {
  if (typeof tag !== 'string' || !tag.match(bytes32Regex)) throw new ValidationError('tag must be bytes32 hex string');
  const binString = new BN(tag.substr(2), 'hex').toString(2);
  const tags = [];
  for (let i = 1; i < binString.length + 1; i += 1) {
    const current = binString.charAt(binString.length - i);
    if (current === '1') {
      const currentTag = TAG_MAP[i];
      if (currentTag === undefined || typeof currentTag !== 'string') throw new ValidationError(`Unknown bit ${i} in tag`);
      tags.push(currentTag);
    }
  }
  return tags;
};

const sumTags = (tagArray) => {
  const binStringArray = tagArray.map((hexTag) => {
    if (typeof hexTag !== 'string' || !hexTag.match(bytes32Regex)) throw new ValidationError('tag must be bytes32 hex string');
    return new BN(hexTag.substr(2), 'hex').toString(2);
  });
  let summedTagsBinString = '';
  for (let i = 1; i < 256; i += 1) {
    let currentBit = '0';
    binStringArray.forEach((binString) => {
      if (binString.charAt(binString.length - i) === '1') {
        currentBit = '1';
      }
    });
    summedTagsBinString = currentBit + summedTagsBinString;
  }
  const hex = new BN(summedTagsBinString, 2).toString('hex');
  const encodedTag = NULL_BYTES32.substr(0, 66 - hex.length).concat(hex);
  return encodedTag;
};

const findMissingBitsInTag = (tag, requiredTag) => {
  debug('requiredTag', requiredTag);
  debug('tag', tag);
  if (typeof tag !== 'string' || !tag.match(bytes32Regex)) throw new ValidationError('tag must be bytes32 hex string');
  if (typeof requiredTag !== 'string' || !requiredTag.match(bytes32Regex)) throw new ValidationError('requiredTag must be bytes32 hex string');
  const tagBinString = new BN(tag.substr(2), 'hex').toString(2);
  const requiredTagBinString = new BN(requiredTag.substr(2), 'hex').toString(2);
  const missingBits = [];
  for (let i = 1; i <= requiredTagBinString.length; i += 1) {
    if (
      requiredTagBinString.charAt(requiredTagBinString.length - i) === '1'
      && tagBinString.charAt(tagBinString.length - i) !== '1'
    ) {
      missingBits.push(i);
    }
  }
  return missingBits;
};

const checkActiveBitInTag = (tag, bit) => {
  if (typeof tag !== 'string' || !tag.match(bytes32Regex)) throw new ValidationError('tag must be bytes32 hex string');
  if (typeof bit !== 'number' || bit < 1 || bit > 256) throw new ValidationError('Invalid bit tag');
  const binString = new BN(tag.substr(2), 'hex').toString(2);
  return binString.charAt(binString.length - bit) === '1';
};

const tagBitToHuman = (bit) => {
  if (typeof bit !== 'number' || bit < 1 || bit > 256) throw new ValidationError('Invalid bit tag');
  return TAG_MAP[bit] || bit;
};

const decryptResult = async (encResultsZipBuffer, beneficiaryKey) => {
  const rootFolder = 'iexec_out';
  const encKeyFile = 'encrypted_key';
  const encResultsFile = 'result.zip.aes';

  const zipBuffer = Buffer.from(encResultsZipBuffer);
  const keyBuffer = Buffer.from(beneficiaryKey);

  let zip;
  try {
    zip = await new JSZip().loadAsync(zipBuffer);
  } catch (error) {
    debug(error);
    throw Error('Failed to load encrypted results zip file');
  }

  let encryptedResultsKeyArrayBuffer;
  try {
    encryptedResultsKeyArrayBuffer = await zip
      .file(`${rootFolder}/${encKeyFile}`)
      .async('arraybuffer');
  } catch (error) {
    throw Error(`Missing ${encKeyFile} file in zip input file`);
  }
  const encryptedResultsKeyBuffer = Buffer.from(
    encryptedResultsKeyArrayBuffer,
    'ArrayBuffer',
  );

  debug('Decrypting results key');
  let resultsKey;
  try {
    const key = new NodeRSA(keyBuffer);
    resultsKey = key.decrypt(encryptedResultsKeyBuffer);
  } catch (error) {
    debug(error);
    throw Error('Failed to decrypt results key with beneficiary key');
  }
  debug('resultsKey', resultsKey);
  debug('Decrypting results');
  try {
    const iv = await new Promise((resolve, reject) => {
      zip
        .file(`${rootFolder}/${encResultsFile}`)
        .nodeStream()
        .on('data', (data) => {
          try {
            resolve(Buffer.from(data.slice(0, 16)));
          } catch (e) {
            debug('error', e);
            reject(e);
          }
        })
        .on('error', (e) => {
          debug('error', e);
          reject(e);
        })
        .resume();
    });
    debug('iv', iv);

    const decryptedFile = await new Promise((resolve, reject) => {
      const aesCbc = new aesjs.ModeOfOperation.cbc(resultsKey, iv);
      const chunks = [];
      zip
        .file(`${rootFolder}/${encResultsFile}`)
        .nodeStream()
        .on('data', (data) => {
          try {
            // remove 16 bytes iv from enc file
            const buffer = chunks.length !== 0
              ? Buffer.from(aesCbc.decrypt(data))
              : Buffer.from(aesCbc.decrypt(data.slice(16)));
            chunks.push(buffer);
          } catch (e) {
            debug('error', e);
            reject(e);
          }
        })
        .on('error', (e) => {
          debug('error', e);
          reject(e);
        })
        .on('end', async () => {
          // remove pkcs7 padding
          const lastChunk = chunks[chunks.length - 1];
          const padding = lastChunk[lastChunk.length - 1];
          if (!padding || padding > 16 || padding > lastChunk.length) throw Error('Invalid padding');
          const unpaddedChunk = lastChunk.slice(0, lastChunk.length - padding);
          chunks[chunks.length - 1] = unpaddedChunk;
          resolve(Buffer.concat(chunks));
        })
        .resume();
    });
    return decryptedFile;
  } catch (error) {
    debug(error);
    throw Error('Failed to decrypt results with decrypted results key');
  }
};

const sleep = ms => new Promise(res => setTimeout(res, ms));
const FETCH_INTERVAL = 5000;

module.exports = {
  BN,
  formatRLC,
  formatEth,
  parseRLC,
  parseEth,
  decryptResult,
  checksummedAddress,
  cleanRPC,
  checkEvent,
  getEventFromLogs,
  bnToEthersBn,
  ethersBnToBn,
  bnifyNestedEthersBn,
  stringifyNestedBn,
  multiaddrHexToHuman,
  humanToMultiaddrBuffer,
  utf8ToBuffer,
  hexToBuffer,
  secToDate,
  getSalt,
  NULL_BYTES,
  NULL_ADDRESS,
  NULL_BYTES32,
  truncateBnWeiToBnNRlc,
  bnNRlcToBnWei,
  encodeTag,
  decodeTag,
  sumTags,
  findMissingBitsInTag,
  checkActiveBitInTag,
  tagBitToHuman,
  bytes32Regex,
  addressRegex,
  sleep,
  FETCH_INTERVAL,
};
