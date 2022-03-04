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

- [originalError](errors.Web3ProviderCallError.md#originalerror)

## Constructors

### constructor

• **new Web3ProviderCallError**(`message`, `originalError`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |
| `originalError` | `Error` |

#### Inherited from

[Web3ProviderError](errors.Web3ProviderError.md).[constructor](errors.Web3ProviderError.md#constructor)

#### Defined in

[src/lib/errors.d.ts:14](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/92c9bf6/src/lib/errors.d.ts#L14)

## Properties

### originalError

• `Optional` **originalError**: `Error`

#### Inherited from

[Web3ProviderError](errors.Web3ProviderError.md).[originalError](errors.Web3ProviderError.md#originalerror)

#### Defined in

[src/lib/errors.d.ts:15](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/92c9bf6/src/lib/errors.d.ts#L15)
