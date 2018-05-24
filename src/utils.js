const Debug = require('debug');
const ethUtil = require('ethjs-util');
const jws = require('jws');

const debug = Debug('iexec:utils');

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
        throw Error(`missing address key in contract JSON description for chainID: ${chainID}`);
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

module.exports = {
  getContractAddress,
  isEthAddress,
  toUpperFirst,
  secToDate,
  decodeJWTForPrint,
  decodeJWT,
};
