const {
  Web3ProviderCallError,
  Web3ProviderSendError,
  Web3ProviderSignMessageError,
} = require('./errors');

const PROCESSING_RESPONSE_ERROR = 'processing response error';

const getMessage = (err) => {
  if (typeof err === 'string') {
    return err;
  }
  if (err.reason) {
    if (err.reason === PROCESSING_RESPONSE_ERROR) {
      if (err.error && err.error.message) {
        return `${PROCESSING_RESPONSE_ERROR}: ${err.error.message}`;
      }
      if (err.body && err.body.error && err.body.error.message) {
        return `${PROCESSING_RESPONSE_ERROR}: ${err.body.error.message}`;
      }
    }
    return err.reason;
  }
  return err.message;
};

const wrapCall = async (promise) => {
  try {
    return await promise;
  } catch (err) {
    throw new Web3ProviderCallError(getMessage(err), err);
  }
};

const wrapWait = wrapCall;

const wrapSend = async (promise) => {
  try {
    return await promise;
  } catch (err) {
    throw new Web3ProviderSendError(getMessage(err), err);
  }
};

const wrapSign = async (promise) => {
  try {
    return await promise;
  } catch (err) {
    throw new Web3ProviderSignMessageError(getMessage(err), err);
  }
};

const wrapSignTypedDataV3 = wrapSign;

const wrapPersonalSign = wrapSign;

module.exports = {
  wrapCall,
  wrapSend,
  wrapWait,
  wrapPersonalSign,
  wrapSignTypedDataV3,
};
