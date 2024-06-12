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

- [cause](errors.Web3ProviderSendError.md#cause)
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

### cause

• `Optional` **cause**: `Error`

#### Inherited from

[Web3ProviderError](errors.Web3ProviderError.md).[cause](errors.Web3ProviderError.md#cause)

___

### originalError

• `Optional` **originalError**: `Error`

**`Deprecated`**

use Error cause instead

#### Inherited from

[Web3ProviderError](errors.Web3ProviderError.md).[originalError](errors.Web3ProviderError.md#originalerror)
