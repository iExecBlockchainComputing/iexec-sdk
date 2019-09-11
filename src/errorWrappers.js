const {
  Web3ProviderCallError,
  Web3ProviderSendError,
  Web3ProviderSignMessageError,
} = require('./errors');

const wrapCall = async (promise) => {
  try {
    return await promise;
  } catch (err) {
    if (typeof err === 'string') {
      throw new Web3ProviderCallError(err, err);
    }
    throw new Web3ProviderCallError(err.message, err);
  }
};

const wrapWait = wrapCall;

const wrapSend = async (promise) => {
  try {
    return await promise;
  } catch (err) {
    if (typeof err === 'string') {
      throw new Web3ProviderSendError(err, err);
    }
    throw new Web3ProviderSendError(err.message, err);
  }
};

const wrapSign = async (promise) => {
  try {
    return await promise;
  } catch (err) {
    if (typeof err === 'string') {
      throw new Web3ProviderSignMessageError(err, err);
    }
    throw new Web3ProviderSignMessageError(err.message, err);
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
