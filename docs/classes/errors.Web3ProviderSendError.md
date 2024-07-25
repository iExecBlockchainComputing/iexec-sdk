[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / Web3ProviderSendError

# Class: Web3ProviderSendError

[errors](../modules/errors.md).Web3ProviderSendError

Web3ProviderSendError encapsulates an error thrown by the web3 provider during a transaction.

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

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `string` | A descriptive error message detailing the nature of the error. |
| `originalError` | `Error` | The original Error object that caused this web3 provider error. |

#### Returns

[`Web3ProviderSendError`](errors.Web3ProviderSendError.md)

#### Inherited from

[Web3ProviderError](errors.Web3ProviderError.md).[constructor](errors.Web3ProviderError.md#constructor)

## Properties

### cause

• **cause**: `Error`

The original Error object that caused this web3 provider error.

#### Inherited from

[Web3ProviderError](errors.Web3ProviderError.md).[cause](errors.Web3ProviderError.md#cause)

___

### originalError

• **originalError**: `Error`

**`Deprecated`**

use Error cause instead.

#### Inherited from

[Web3ProviderError](errors.Web3ProviderError.md).[originalError](errors.Web3ProviderError.md#originalerror)
