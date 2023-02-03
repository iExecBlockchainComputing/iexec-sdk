import Debug from 'debug';
import { utils } from 'ethers';

const debug = Debug('iexec:sig-utils');

export const hashEIP712 = (typedData) => {
  try {
    const { domain, message } = typedData;
    const { EIP712Domain, ...types } = typedData.types;
    // use experimental ether utils._TypedDataEncoder (to remove when TypedDataEncoder is included)
    // https://docs.ethers.io/v5/api/utils/hashing/#TypedDataEncoder
    /* eslint no-underscore-dangle: ["error", { "allow": ["_TypedDataEncoder"] }] */
    const TypedDataEncoder =
      utils._TypedDataEncoder &&
      utils._TypedDataEncoder.from &&
      typeof utils._TypedDataEncoder.from === 'function'
        ? utils._TypedDataEncoder
        : utils.TypedDataEncoder;
    return TypedDataEncoder.hash(domain, types, message);
  } catch (error) {
    debug('hashEIP712()', error);
    throw error;
  }
};
