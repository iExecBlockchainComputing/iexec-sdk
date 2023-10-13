import Debug from 'debug';
import { TypedDataEncoder } from 'ethers';

const debug = Debug('iexec:sig-utils');

export const hashEIP712 = (typedData) => {
  try {
    const { domain, message } = typedData;
    const { EIP712Domain, ...types } = typedData.types;
    return TypedDataEncoder.hash(domain, types, message);
  } catch (error) {
    debug('hashEIP712()', error);
    throw error;
  }
};
