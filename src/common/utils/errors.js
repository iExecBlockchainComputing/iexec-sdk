export { ValidationError } from 'yup';

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

export class ConfigurationError extends Error {
  constructor(...args) {
    super(...args);
    this.name = this.constructor.name;
  }
}

export class Web3ProviderError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = this.constructor.name;
    this.originalError = originalError;
    if (originalError && typeof originalError === 'object') {
      Object.assign(this, getPropsToCopy(originalError));
    }
  }
}

export class Web3ProviderCallError extends Web3ProviderError {
  constructor(...args) {
    super(...args);
    this.name = this.constructor.name;
  }
}

export class Web3ProviderSendError extends Web3ProviderError {
  constructor(...args) {
    super(...args);
    this.name = this.constructor.name;
  }
}

export class Web3ProviderSignMessageError extends Web3ProviderError {
  constructor(...args) {
    super(...args);
    this.name = this.constructor.name;
  }
}

export class ObjectNotFoundError extends Error {
  constructor(objName, objId, chainId) {
    super(`No ${objName} found for id ${objId} on chain ${chainId}`);
    this.name = this.constructor.name;
    this.objName = objName;
    this.chainId = chainId;
    this.objectId = objId;
  }
}

export class BridgeError extends Error {
  constructor(originalError, sendTxHash) {
    super(
      `Failed to get bridged chain confirmation for transaction ${sendTxHash}`,
    );
    this.name = this.constructor.name;
    this.sendTxHash = sendTxHash;
    this.originalError = originalError;
    if (originalError && typeof originalError === 'object') {
      Object.assign(this, getPropsToCopy(originalError));
    }
  }
}
