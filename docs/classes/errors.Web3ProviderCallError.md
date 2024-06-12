[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / Web3ProviderCallError

# Class: Web3ProviderCallError

[errors](../modules/errors.md).Web3ProviderCallError

Web3ProviderCallError encapsulate an error thrown by the web3 provider during a web3 call.

## Hierarchy

- [`Web3ProviderError`](errors.Web3ProviderError.md)

  ↳ **`Web3ProviderCallError`**

## Table of contents

### Constructors

- [constructor](errors.Web3ProviderCallError.md#constructor)

### Properties

- [cause](errors.Web3ProviderCallError.md#cause)
- [originalError](errors.Web3ProviderCallError.md#originalerror)

## Constructors

### constructor

• **new Web3ProviderCallError**(`message`, `originalError`): [`Web3ProviderCallError`](errors.Web3ProviderCallError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |
| `originalError` | `Error` |

#### Returns

[`Web3ProviderCallError`](errors.Web3ProviderCallError.md)

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
