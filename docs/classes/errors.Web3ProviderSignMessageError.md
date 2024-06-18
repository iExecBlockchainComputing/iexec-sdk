[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / Web3ProviderSignMessageError

# Class: Web3ProviderSignMessageError

[errors](../modules/errors.md).Web3ProviderSignMessageError

Web3ProviderSignMessageError encapsulates an error thrown by the web3 provider during a message signature.

## Hierarchy

- [`Web3ProviderError`](errors.Web3ProviderError.md)

  ↳ **`Web3ProviderSignMessageError`**

## Table of contents

### Constructors

- [constructor](errors.Web3ProviderSignMessageError.md#constructor)

### Properties

- [cause](errors.Web3ProviderSignMessageError.md#cause)
- [originalError](errors.Web3ProviderSignMessageError.md#originalerror)

## Constructors

### constructor

• **new Web3ProviderSignMessageError**(`message`, `originalError`): [`Web3ProviderSignMessageError`](errors.Web3ProviderSignMessageError.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `string` | A descriptive error message detailing the nature of the error. |
| `originalError` | `Error` | The original Error object that caused this web3 provider error. |

#### Returns

[`Web3ProviderSignMessageError`](errors.Web3ProviderSignMessageError.md)

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
