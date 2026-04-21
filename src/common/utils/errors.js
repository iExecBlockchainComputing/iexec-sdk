/* eslint-disable sonarjs/no-identical-functions */
export { ValidationError } from 'yup';

export class ConfigurationError extends Error {
  constructor(...args) {
    super(...args);
    this.name = this.constructor.name;
  }
}

export class Web3ProviderError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = this.constructor.name;
    // detect user rejection from ethers error code
    if (options?.cause?.code === 'ACTION_REJECTED') {
      this.isUserRejection = true;
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

export class ApiCallError extends Error {
  constructor(message, options = {}) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export class SmsCallError extends ApiCallError {
  constructor(message, ...args) {
    super(`SMS error: ${message}`, ...args);
    this.name = this.constructor.name;
  }
}

export class ResultProxyCallError extends ApiCallError {
  constructor(message, ...args) {
    super(`Result Proxy error: ${message}`, ...args);
    this.name = this.constructor.name;
  }
}

export class MarketCallError extends ApiCallError {
  constructor(message, ...args) {
    super(`Market API error: ${message}`, ...args);
    this.name = this.constructor.name;
  }
}

export class IpfsGatewayCallError extends ApiCallError {
  constructor(message, ...args) {
    super(`IPFS gateway error: ${message}`, ...args);
    this.name = this.constructor.name;
  }
}

export class CompassCallError extends ApiCallError {
  constructor(message, ...args) {
    super(`Compass API error: ${message}`, ...args);
    this.name = this.constructor.name;
  }
}

export class WorkerpoolCallError extends ApiCallError {
  constructor(message, ...args) {
    super(`Workerpool API error: ${message}`, ...args);
    this.name = this.constructor.name;
  }
}
