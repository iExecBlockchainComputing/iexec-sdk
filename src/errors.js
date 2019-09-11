const { ValidationError } = require('./validator');

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

module.exports = {
  ValidationError,
  Web3ProviderError,
  Web3ProviderCallError,
  Web3ProviderSendError,
  Web3ProviderSignMessageError,
};
