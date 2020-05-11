const Debug = require('debug');
const fetch = require('cross-fetch');
const { Buffer } = require('buffer');
const qs = require('query-string');
const BN = require('bn.js');
const Big = require('big.js');
const JSZip = require('jszip');
const NodeRSA = require('node-rsa');
const aesjs = require('aes-js');
const {
  getAddress,
  bigNumberify,
  randomBytes,
  formatEther,
  parseEther,
} = require('ethers').utils;
const multiaddr = require('multiaddr');
const { hashEIP712 } = require('./sig-utils');
const { wrapSignTypedDataV3 } = require('./errorWrappers');
const { ValidationError } = require('./errors');

const debug = Debug('iexec:utils');

const NULL_BYTES = '0x';
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const NULL_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

const bytes32Regex = /^(0x)([0-9a-f]{2}){32}$/;
const addressRegex = /^(0x)([0-9a-fA-F]{2}){20}$/;

const isEthersBn = obj => !!(obj._ethersType && obj._ethersType === 'BigNumber');

const bnToEthersBn = bn => bigNumberify(bn.toString());
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
    Big.NE = -10;
    Big.PE = 10;
    return new Big(stringify(nRLC)).times(new Big(10).pow(-9)).toString();
  } catch (error) {
    debug('formatRLC()', error);
    throw Error('Invalid nRLC');
  }
};

const parseRLC = (rlc) => {
  try {
    Big.NE = -10;
    Big.PE = 18;
    const rlcAmount = new Big(stringify(rlc));
    return new BN(rlcAmount.times(new Big(10).pow(9)).toString());
  } catch (error) {
    debug('parseRLC()', error);
    throw Error('Invalid rlcString');
  }
};

const formatEth = (wei) => {
  try {
    return formatEther(bigNumberify(stringify(wei)));
  } catch (error) {
    debug('formatEth()', error);
    throw Error('Invalid wei');
  }
};

const parseEth = ether => ethersBnToBn(parseEther(stringify(ether)));

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

const API_URL = 'https://gateway.iex.ec/';

const makeBody = (verb, body) => {
  if (verb === 'GET') return {};
  return { body: JSON.stringify(body) };
};

const makeQueryString = (verb, body) => {
  if (verb === 'GET' && Object.keys(body).length !== 0) {
    return '?'.concat(qs.stringify(body));
  }
  return '';
};

const httpRequest = verb => async (
  endpoint,
  body = {},
  optionalHeaders = {},
  api = API_URL,
) => {
  const baseURL = api;
  const queryString = makeQueryString(verb, body);
  const url = baseURL.concat(endpoint, queryString);
  const headers = Object.assign(
    {
      Accept: 'application/json',
      'content-type': 'application/json',
    },
    optionalHeaders,
  );
  const response = await fetch(
    url,
    Object.assign(
      {
        method: verb,
        headers,
      },
      makeBody(verb, body),
    ),
  );
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.indexOf('application/json') !== -1) {
    const json = await response.json();
    if (json.error) throw new Error(json.error);
    if (response.status === 200 && json) return json;
  } else {
    throw new Error('The http response is not of JSON type');
  }
  throw new Error('API call error');
};

const download = verb => async (
  endpoint,
  body = {},
  optionalHeaders = {},
  api = API_URL,
) => {
  const baseURL = api;
  const queryString = makeQueryString(verb, body);
  const url = baseURL.concat(endpoint, queryString);
  const headers = Object.assign(
    {
      Accept: ['application/zip'],
      'content-type': 'application/json',
    },
    optionalHeaders,
  );
  const response = await fetch(
    url,
    Object.assign(
      {
        method: verb,
        headers,
      },
      makeBody(verb, body),
    ),
  );
  if (!response.ok) {
    throw Error(
      `API call error: ${response.status} ${
        response.statusText ? response.statusText : ''
      }`,
    );
  }
  return response;
};

const signTypedDatav3 = async (eth, address, typedData) => {
  const signTDv3 = td => eth.send('eth_signTypedData_v3', [address, JSON.stringify(td)]);
  const sign = await wrapSignTypedDataV3(signTDv3(typedData));
  return sign;
};

const getAuthorization = async (
  chainId,
  address,
  ethProvider,
  { apiURL = API_URL, challengeEndpoint = 'challenge' } = {},
) => {
  try {
    const challenge = await httpRequest('GET')(
      challengeEndpoint,
      {
        chainId,
        address,
      },
      {},
      apiURL,
    );
    debug('challenge', challenge);
    const typedData = challenge.data || challenge;
    debug('typedData', typedData);
    const sign = await signTypedDatav3(ethProvider, address, typedData);
    debug('sign', sign);
    const hash = hashEIP712(typedData);
    debug('hash', hash);
    const separator = '_';
    const authorization = hash
      .concat(separator)
      .concat(sign)
      .concat(separator)
      .concat(address);
    debug('authorization', authorization);
    return authorization;
  } catch (error) {
    debug('getAuthorization()', error);
    throw Error('Failed to get authorization');
  }
};

const http = {
  get: httpRequest('GET'),
  post: httpRequest('POST'),
};

const getSalt = () => {
  const hex = bigNumberify(randomBytes(32))
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
    if (TAG_MAP[tag] === undefined || typeof TAG_MAP[tag] !== 'number') throw new ValidationError(`unknown tag ${tag}`);
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
      if (currentTag === undefined || typeof currentTag !== 'string') throw new ValidationError(`unknown bit ${i}`);
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
  if (typeof bit !== 'number' || bit < 1 || bit > 256) throw new ValidationError('invalid bit tag');
  const binString = new BN(tag.substr(2), 'hex').toString(2);
  return binString.charAt(binString.length - bit) === '1';
};

const tagBitToHuman = (bit) => {
  if (typeof bit !== 'number' || bit < 1 || bit > 256) throw new ValidationError('invalid bit tag');
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
          if (!padding || padding > 16 || padding > lastChunk.length) throw Error('invalid padding');
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
  ethersBigNumberify: bigNumberify,
  bnifyNestedEthersBn,
  stringifyNestedBn,
  multiaddrHexToHuman,
  humanToMultiaddrBuffer,
  utf8ToBuffer,
  hexToBuffer,
  secToDate,
  getAuthorization,
  http,
  download,
  getSalt,
  NULL_BYTES,
  NULL_ADDRESS,
  NULL_BYTES32,
  signTypedDatav3,
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
