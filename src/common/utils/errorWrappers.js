import {
  Web3ProviderCallError,
  Web3ProviderSendError,
  Web3ProviderSignMessageError,
} from './errors.js';

const getMessage = (err) => {
  if (typeof err === 'string') {
    return err;
  }
  if (err.info && err.info.error && err.info.error.message) {
    return err.info.error.message;
  }
  return err.message;
};

export const wrapCall = async (promise) => {
  try {
    return await promise;
  } catch (cause) {
    throw new Web3ProviderCallError(getMessage(cause), { cause });
  }
};

export const wrapWait = wrapCall;

export const wrapSend = async (promise) => {
  try {
    return await promise;
  } catch (cause) {
    throw new Web3ProviderSendError(getMessage(cause), { cause });
  }
};

export const wrapSign = async (promise) => {
  try {
    return await promise;
  } catch (cause) {
    throw new Web3ProviderSignMessageError(getMessage(cause), { cause });
  }
};

export const wrapSignTypedData = wrapSign;

export const wrapPersonalSign = wrapSign;
