const { ValidationError } = require('yup');

const getPropsToCopy = (error) => {
  const {
    name,
    message,
    stack,
    constructor,
    originalError,
    toJSON,
    ...propsToCopy
  } = error;
  return propsToCopy;
};

class Web3ProviderError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = this.constructor.name;
    this.originalError = originalError;
    if (originalError && typeof originalError === 'object') {
      Object.assign(this, getPropsToCopy(originalError));
    }
  }
}

class Web3ProviderCallError extends Web3ProviderError {
  constructor(...args) {
    super(...args);
    this.name = this.constructor.name;
  }
}

class Web3ProviderSendError extends Web3ProviderError {
  constructor(...args) {
    super(...args);
    this.name = this.constructor.name;
  }
}

class Web3ProviderSignMessageError extends Web3ProviderError {
  constructor(...args) {
    super(...args);
    this.name = this.constructor.name;
  }
}

class ObjectNotFoundError extends Error {
  constructor(objName, objId, chainId) {
    super(`No ${objName} found for id ${objId} on chain ${chainId}`);
    this.name = this.constructor.name;
    this.objName = objName;
    this.chainId = chainId;
    this.objectId = objId;
  }
}

module.exports = {
  ObjectNotFoundError,
  ValidationError,
  Web3ProviderError,
  Web3ProviderCallError,
  Web3ProviderSendError,
  Web3ProviderSignMessageError,
};
