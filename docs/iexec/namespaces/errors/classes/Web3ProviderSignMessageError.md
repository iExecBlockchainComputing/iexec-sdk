[**iexec**](../../../../README.md)

***

[iexec](../../../../globals.md) / [errors](../README.md) / Web3ProviderSignMessageError

# Class: Web3ProviderSignMessageError

Web3ProviderSignMessageError encapsulates an error thrown by the web3 provider during a message signature.

## Extends

- [`Web3ProviderError`](Web3ProviderError.md)

## Constructors

### Constructor

> **new Web3ProviderSignMessageError**(`message`, `originalError`): `Web3ProviderSignMessageError`

#### Parameters

##### message

`string`

A descriptive error message detailing the nature of the error.

##### originalError

`Error`

The original Error object that caused this web3 provider error.

#### Returns

`Web3ProviderSignMessageError`

#### Inherited from

[`Web3ProviderError`](Web3ProviderError.md).[`constructor`](Web3ProviderError.md#constructor)

## Properties

### cause

> **cause**: `Error`

The original Error object that caused this web3 provider error.

#### Inherited from

[`Web3ProviderError`](Web3ProviderError.md).[`cause`](Web3ProviderError.md#cause)

***

### isUserRejection?

> `optional` **isUserRejection**: `boolean`

Wether the error was caused by a user rejection

#### Inherited from

[`Web3ProviderError`](Web3ProviderError.md).[`isUserRejection`](Web3ProviderError.md#isuserrejection)

***

### ~~originalError~~

> **originalError**: `Error`

#### Deprecated

use Error cause instead.

#### Inherited from

[`Web3ProviderError`](Web3ProviderError.md).[`originalError`](Web3ProviderError.md#originalerror)
