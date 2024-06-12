[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / Web3ProviderError

# Class: Web3ProviderError

[errors](../modules/errors.md).Web3ProviderError

Web3ProviderError encapsulate an error thrown by the web3 provider.

## Hierarchy

- `Error`

  ↳ **`Web3ProviderError`**

  ↳↳ [`Web3ProviderCallError`](errors.Web3ProviderCallError.md)

  ↳↳ [`Web3ProviderSendError`](errors.Web3ProviderSendError.md)

  ↳↳ [`Web3ProviderSignMessageError`](errors.Web3ProviderSignMessageError.md)

## Table of contents

### Constructors

- [constructor](errors.Web3ProviderError.md#constructor)

### Properties

- [cause](errors.Web3ProviderError.md#cause)
- [originalError](errors.Web3ProviderError.md#originalerror)

## Constructors

### constructor

• **new Web3ProviderError**(`message`, `originalError`): [`Web3ProviderError`](errors.Web3ProviderError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |
| `originalError` | `Error` |

#### Returns

[`Web3ProviderError`](errors.Web3ProviderError.md)

#### Overrides

Error.constructor

## Properties

### cause

• `Optional` **cause**: `Error`

___

### originalError

• `Optional` **originalError**: `Error`

**`Deprecated`**

use Error cause instead
