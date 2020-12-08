const Debug = require('debug');
const ethersUtils = require('ethers').utils;

const debug = Debug('iexec:sig-utils');

const hashEIP712 = (typedData) => {
  try {
    const { domain, message } = typedData;
    const { EIP712Domain, ...types } = typedData.types;
    // use experiental ether utils._TypedDataEncoder (to remove when TypedDataEncoder is included)
    // https://docs.ethers.io/v5/api/utils/hashing/#TypedDataEncoder
    /* eslint no-underscore-dangle: ["error", { "allow": ["_TypedDataEncoder"] }] */
    const TypedDataEncoder = ethersUtils._TypedDataEncoder
      && ethersUtils._TypedDataEncoder.from
      && typeof ethersUtils._TypedDataEncoder.from === 'function'
      ? ethersUtils._TypedDataEncoder
      : ethersUtils.TypedDataEncoder;
    return TypedDataEncoder.hash(domain, types, message);
  } catch (error) {
    debug('hashEIP712()', error);
    throw error;
  }
};

module.exports = {
  hashEIP712,
};
