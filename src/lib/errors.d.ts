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
 * Web3ProviderError encapsulate an error thrown by the web3 provider.
 */
export class Web3ProviderError extends Error {
  constructor(message: string, originalError: Error);
  originalError?: Error;
}
/**
 * Web3ProviderCallError encapsulate an error thrown by the web3 provider during a web3 call.
 */
export class Web3ProviderCallError extends Web3ProviderError {}
/**
 * Web3ProviderSendError encapsulate an error thrown by the web3 provider during a transaction.
 */
export class Web3ProviderSendError extends Web3ProviderError {}
/**
 * Web3ProviderSignMessageError encapsulate an error thrown by the web3 provider during a message signature.
 */
export class Web3ProviderSignMessageError extends Web3ProviderError {}
/**
 * ObjectNotFoundError is thrown when trying to access an unknown resource.
 */
export class ObjectNotFoundError extends Error {
  constructor(objName: string, objId: string, chainId: string);
  objName?: string;
  objId?: string;
  chainId?: string;
}
/**
 * BridgeError is thrown when bridging RLC between mainchain and sidechain fail before the value transfer confirmation.
 */
export class BridgeError extends Error {
  sendTxHash?: string;
  originalError?: Error;
}
