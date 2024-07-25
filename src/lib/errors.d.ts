import { ValidationError as YupValidationError } from 'yup';
/**
 * ValidationError is thrown when a method is called with missing or unexpected parameters.
 */
export class ValidationError extends YupValidationError {}
/**
 * ValidationError is thrown when the current configuration does not allow to perform a specific operation
 */
export class ConfigurationError extends Error {}
/**
 * Web3ProviderError encapsulates an error thrown by the web3 provider.
 */
export class Web3ProviderError extends Error {
  constructor(
    /**
     * A descriptive error message detailing the nature of the error.
     */
    message: string,
    /**
     * The original Error object that caused this web3 provider error.
     */
    originalError: Error,
  );
  /**
   * @deprecated use Error cause instead.
   */
  originalError: Error;
  /**
   * The original Error object that caused this web3 provider error.
   */
  cause: Error;
}
/**
 * Web3ProviderCallError encapsulates an error thrown by the web3 provider during a web3 call.
 */
export class Web3ProviderCallError extends Web3ProviderError {}
/**
 * Web3ProviderSendError encapsulates an error thrown by the web3 provider during a transaction.
 */
export class Web3ProviderSendError extends Web3ProviderError {}
/**
 * Web3ProviderSignMessageError encapsulates an error thrown by the web3 provider during a message signature.
 */
export class Web3ProviderSignMessageError extends Web3ProviderError {}
/**
 * ObjectNotFoundError is thrown when trying to access an unknown onchain resource.
 */
export class ObjectNotFoundError extends Error {
  constructor(
    /**
     * Name of the resource.
     */
    objName: string,
    /**
     * Id or address of the resource.
     */
    objId: string,
    /**
     * Chain id of the blockchain.
     */
    chainId: string,
  );
  /**
   * Name of the resource.
   */
  objName: string;
  /**
   * Id or address of the resource.
   */
  objId: string;
  /**
   * Chain id of the blockchain.
   */
  chainId: string;
}
/**
 * BridgeError is thrown when bridging RLC between mainchain and sidechain fail before the value transfer confirmation.
 */
export class BridgeError extends Error {
  constructor(
    /**
     * The original Error object that caused this API call error.
     */
    originalError: Error,
    /**
     * Hash of the transaction sending the value to the bridge contract.
     */
    sendTxHash: string,
  );
  /**
   * Hash of the transaction sending the value to the bridge contract.
   */
  sendTxHash: string;
  /**
   * @deprecated use Error cause instead
   */
  originalError: Error;
  /**
   * The original Error object that caused this API call error.
   */
  cause: Error;
}

/**
 * ApiCallError encapsulates an error occurring during a call to an API such as a network error or a server-side internal error.
 */
export class ApiCallError extends Error {
  constructor(
    /**
     * A descriptive error message detailing the nature of the error.
     */
    message: string,
    /**
     * The original Error object that caused this API call error.
     */
    originalError: Error,
  );
  /**
   * @deprecated use Error cause instead.
   */
  originalError: Error;
  /**
   * The original Error object that caused this API call error.
   */
  cause: Error;
}

/**
 * SmsCallError encapsulates an error occurring during a call to the SMS API such as a network error or a server-side internal error.
 */
export class SmsCallError extends ApiCallError {}

/**
 * ResultProxyCallError encapsulates an error occurring during a call to the Result Proxy API such as a network error or a server-side internal error.
 */
export class ResultProxyCallError extends ApiCallError {}

/**
 * MarketCallError encapsulates an error occurring during a call to the Market API such as a network error or a server-side internal error.
 */
export class MarketCallError extends ApiCallError {}

/**
 * IpfsGatewayCallError encapsulates an error occurring during a call to the IPFS gateway API such as a network error or a server-side internal error.
 */
export class IpfsGatewayCallError extends ApiCallError {}

/**
 * WorkerpoolCallError encapsulates an error occurring during a call to a workerpool API such as a network error or a server-side internal error.
 */
export class WorkerpoolCallError extends ApiCallError {}
