[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / Web3ProviderSignMessageError

# Class: Web3ProviderSignMessageError

[errors](../modules/errors.md).Web3ProviderSignMessageError

Web3ProviderSignMessageError encapsulate an error thrown by the web3 provider during a message signature.

## Hierarchy

- [`Web3ProviderError`](errors.Web3ProviderError.md)

  ↳ **`Web3ProviderSignMessageError`**

## Table of contents

### Constructors

- [constructor](errors.Web3ProviderSignMessageError.md#constructor)

### Properties

- [originalError](errors.Web3ProviderSignMessageError.md#originalerror)

## Constructors

### constructor

• **new Web3ProviderSignMessageError**(`message`, `originalError`): [`Web3ProviderSignMessageError`](errors.Web3ProviderSignMessageError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |
| `originalError` | `Error` |

#### Returns

[`Web3ProviderSignMessageError`](errors.Web3ProviderSignMessageError.md)

#### Inherited from

[Web3ProviderError](errors.Web3ProviderError.md).[constructor](errors.Web3ProviderError.md#constructor)

## Properties

### originalError

• `Optional` **originalError**: `Error`

#### Inherited from

[Web3ProviderError](errors.Web3ProviderError.md).[originalError](errors.Web3ProviderError.md#originalerror)
