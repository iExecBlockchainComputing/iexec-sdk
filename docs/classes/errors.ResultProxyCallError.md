[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / ResultProxyCallError

# Class: ResultProxyCallError

[errors](../modules/errors.md).ResultProxyCallError

ResultProxyCallError encapsulate an error occurring during a call to the Result-Proxy API such as a network error or a server internal error.

## Hierarchy

- [`ApiCallError`](errors.ApiCallError.md)

  ↳ **`ResultProxyCallError`**

## Table of contents

### Constructors

- [constructor](errors.ResultProxyCallError.md#constructor)

### Properties

- [originalError](errors.ResultProxyCallError.md#originalerror)

## Constructors

### constructor

• **new ResultProxyCallError**(`message`, `originalError`): [`ResultProxyCallError`](errors.ResultProxyCallError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |
| `originalError` | `Error` |

#### Returns

[`ResultProxyCallError`](errors.ResultProxyCallError.md)

#### Inherited from

[ApiCallError](errors.ApiCallError.md).[constructor](errors.ApiCallError.md#constructor)

## Properties

### originalError

• `Optional` **originalError**: `Error`

#### Inherited from

[ApiCallError](errors.ApiCallError.md).[originalError](errors.ApiCallError.md#originalerror)
