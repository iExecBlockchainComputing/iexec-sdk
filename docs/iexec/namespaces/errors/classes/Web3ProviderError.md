[**iexec**](../../../../README.md)

***

[iexec](../../../../globals.md) / [errors](../README.md) / Web3ProviderError

# Class: Web3ProviderError

Web3ProviderError encapsulates an error thrown by the web3 provider.

## Extends

- `Error`

## Extended by

- [`Web3ProviderCallError`](Web3ProviderCallError.md)
- [`Web3ProviderSendError`](Web3ProviderSendError.md)
- [`Web3ProviderSignMessageError`](Web3ProviderSignMessageError.md)

## Constructors

### Constructor

> **new Web3ProviderError**(`message`, `options?`): `Web3ProviderError`

#### Parameters

##### message

`string`

A descriptive error message detailing the nature of the error.

##### options?

###### cause?

`unknown`

The original error that caused this web3 provider error.

#### Returns

`Web3ProviderError`

#### Overrides

`Error.constructor`

## Properties

### cause?

> `optional` **cause**: `unknown`

The original error that caused this web3 provider error.

***

### isUserRejection?

> `optional` **isUserRejection**: `boolean`

Wether the error was caused by a user rejection
