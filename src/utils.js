const Debug = require('debug');
const ethUtil = require('ethjs-util');
const jws = require('jws');
const fetch = require('cross-fetch');
const qs = require('query-string');
const BN = require('bn.js');
const ethers = require('ethers');

const debug = Debug('iexec:utils');

const bnToEthersBn = bn => ethers.utils.bigNumberify(bn.toString());
const ethersBnToBn = ethersBn => new BN(ethersBn.toString());

const minBn = (bnArray) => {
  let min = new BN(bnArray[0]);
  bnArray.map((e) => {
    if (e.lt(min)) min = e;
    return min;
  });
  return min;
};

const getContractAddress = (desc, chainID, { strict = true } = {}) => {
  try {
    if (!('networks' in desc)) {
      if (strict) {
        throw Error('missing networks key in contract JSON description');
      }
      return undefined;
    }
    if (!(chainID in desc.networks)) {
      if (strict) {
        throw Error(`missing "${chainID}" key in contract JSON description`);
      }
      return undefined;
    }
    if (!('address' in desc.networks[chainID])) {
      if (strict) {
        throw Error(
          `missing address key in contract JSON description for chainID: ${chainID}`,
        );
      }
      return undefined;
    }
    return desc.networks[chainID].address;
  } catch (error) {
    debug('getContractAddress()', error);
    throw error;
  }
};

const isEthAddress = (address, { strict = false } = {}) => {
  const isHexString = ethUtil.isHexString(address);
  if (!isHexString && strict) {
    throw Error(`address ${address} is not a valid Ethereum address`);
  }
  return isHexString;
};

/* eslint no-underscore-dangle: ["error", { "allow": ["_eventName"] }] */
const checkEvent = (eventName, events) => {
  let confirm = false;
  events.forEach((event) => {
    debug('event', event._eventName);
    if (event._eventName === eventName) confirm = true;
  });
  return confirm;
};

const getEventFromLogs = (eventName, events, { strict = true } = {}) => {
  let eventFound = {};
  events.forEach((event) => {
    debug('event', event._eventName);
    if (event._eventName === eventName) {
      eventFound = event;
    }
  });
  if (!eventFound && strict) throw new Error(`unknown event ${eventName}`);
  return eventFound;
};

const toUpperFirst = str => ''.concat(str[0].toUpperCase(), str.substr(1));

const secToDate = (secs) => {
  const t = new Date(1970, 0, 1);
  t.setSeconds(secs);
  return t;
};

const decodeJWTForPrint = (jwtoken) => {
  const { payload } = jws.decode(jwtoken);
  const tokenDetails = {
    address: payload.blockchainaddr,
    issuer: payload.iss,
    'issued date': secToDate(payload.iat),
  };
  return tokenDetails;
};

const decodeJWT = jws.decode;

const API_URL = 'https://gateway.iex.ec/';
// const API_URL = 'http://localhost:3000/';

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

const httpRequest = verb => async (endpoint, body = {}, api = API_URL) => {
  const baseURL = api;
  const queryString = makeQueryString(verb, body);
  const url = baseURL.concat(endpoint, queryString);
  const response = await fetch(
    url,
    Object.assign(
      {
        method: verb,
        headers: {
          Accept: 'application/json',
          'content-type': 'application/json',
        },
      },
      makeBody(verb, body),
    ),
  );
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.indexOf('application/json') !== -1) {
    const json = await response.json();
    if (json.ok) return json;
    if (json.error) throw new Error(json.error);
  } else {
    throw new Error('the http response is not of JSON type');
  }
  throw new Error('API call error');
};

const gatewayAuth = async (
  chainID,
  address,
  eth,
  endpoint,
  { postBody = {} } = {},
) => {
  try {
    debug('gatewayAuth()');

    const { data } = await httpRequest('POST')('challenge', {
      chainID,
    });
    debug('data', data);

    const typedData = JSON.parse(data);
    debug('typedData', typedData);

    const signTypedDatav3 = td => new Promise((resolve, reject) => {
      eth.sendAsync(
        {
          method: 'eth_signTypedData_v3',
          params: [null, td],
        },
        (err, result) => {
          if (err) reject(err);
          resolve(result.result);
        },
      );
    });

    const sign = await signTypedDatav3(typedData);
    debug('sign', sign);

    const serializedSign = '0x'
      .concat(sign.r.substr(2))
      .concat(sign.s.substr(2))
      .concat(sign.v.toString(16));

    const body = Object.assign(
      {
        auth: {
          data,
          address,
          sig: serializedSign,
        },
      },
      postBody,
    );
    const response = await httpRequest('POST')(endpoint, body);
    debug('response', response);
    return response;
  } catch (error) {
    debug('gatewayAuth() error', error);
    throw error;
  }
};

const http = {
  get: httpRequest('GET'),
  post: httpRequest('POST'),
  authorizedPost: gatewayAuth,
};

const getSalt = () => ethers.utils.hexlify(ethers.utils.bigNumberify(ethers.utils.randomBytes(32)));

module.exports = {
  getContractAddress,
  isEthAddress,
  checkEvent,
  getEventFromLogs,
  minBn,
  bnToEthersBn,
  ethersBnToBn,
  toUpperFirst,
  secToDate,
  decodeJWTForPrint,
  decodeJWT,
  gatewayAuth,
  http,
  getSalt,
};
