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

const wrapSignTypedDataV3 = async (promise) => {
  try {
    return await promise;
  } catch (err) {
    if (typeof err === 'string') {
      throw new Web3ProviderSignMessageError(err, err);
    }
    throw new Web3ProviderSignMessageError(err.message, err);
  }
};

module.exports = {
  wrapCall,
  wrapSend,
  wrapWait,
  wrapSignTypedDataV3,
};
