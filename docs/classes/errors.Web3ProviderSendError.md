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

• **new Web3ProviderSendError**(`message`, `originalError`): [`Web3ProviderSendError`](errors.Web3ProviderSendError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |
| `originalError` | `Error` |

#### Returns

[`Web3ProviderSendError`](errors.Web3ProviderSendError.md)

#### Inherited from

[Web3ProviderError](errors.Web3ProviderError.md).[constructor](errors.Web3ProviderError.md#constructor)

## Properties

### originalError

• `Optional` **originalError**: `Error`

#### Inherited from

[Web3ProviderError](errors.Web3ProviderError.md).[originalError](errors.Web3ProviderError.md#originalerror)
