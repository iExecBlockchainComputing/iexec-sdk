[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / Web3ProviderSendError

# Class: Web3ProviderSendError

[errors](../modules/errors.md).Web3ProviderSendError

Web3ProviderSendError encapsulate an error thrown by the web3 provider during a transaction.

## Hierarchy

- [`Web3ProviderError`](errors.Web3ProviderError.md)

  ↳ **`Web3ProviderSendError`**

## Table of contents

### Constructors

- [constructor](errors.Web3ProviderSendError.md#constructor)

### Properties

- [originalError](errors.Web3ProviderSendError.md#originalerror)

## Constructors

### constructor

• **new Web3ProviderSendError**(`message`, `originalError`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |
| `originalError` | `Error` |

#### Inherited from

[Web3ProviderError](errors.Web3ProviderError.md).[constructor](errors.Web3ProviderError.md#constructor)

#### Defined in

[src/lib/errors.d.ts:14](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/500b144/src/lib/errors.d.ts#L14)

## Properties

### originalError

• `Optional` **originalError**: `Error`

#### Inherited from

[Web3ProviderError](errors.Web3ProviderError.md).[originalError](errors.Web3ProviderError.md#originalerror)

#### Defined in

[src/lib/errors.d.ts:15](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/500b144/src/lib/errors.d.ts#L15)
