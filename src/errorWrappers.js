const {
  Web3ProviderCallError,
  Web3ProviderSendError,
  Web3ProviderSignMessageError,
} = require('./errors');

const getMessage = (err) => {
  if (typeof err === 'string') {
    return err;
  }
  if (err.error && err.error.message) {
    return err.error.message;
  }
  if (err.body && err.body.error && err.body.error.message) {
    return err.body.error.message;
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
