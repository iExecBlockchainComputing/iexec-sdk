[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / ResultProxyCallError

# Class: ResultProxyCallError

[errors](../modules/errors.md).ResultProxyCallError

ResultProxyCallError encapsulates an error occurring during a call to the Result Proxy API such as a network error or a server-side internal error.

## Hierarchy

- [`ApiCallError`](errors.ApiCallError.md)

  ↳ **`ResultProxyCallError`**

## Table of contents

### Constructors

- [constructor](errors.ResultProxyCallError.md#constructor)

### Properties

- [cause](errors.ResultProxyCallError.md#cause)
- [originalError](errors.ResultProxyCallError.md#originalerror)

## Constructors

### constructor

• **new ResultProxyCallError**(`message`, `originalError`): [`ResultProxyCallError`](errors.ResultProxyCallError.md)

#### Parameters

| Name            | Type     | Description                                                    |
| :-------------- | :------- | :------------------------------------------------------------- |
| `message`       | `string` | A descriptive error message detailing the nature of the error. |
| `originalError` | `Error`  | The original Error object that caused this API call error.     |

#### Returns

[`ResultProxyCallError`](errors.ResultProxyCallError.md)

#### Inherited from

[ApiCallError](errors.ApiCallError.md).[constructor](errors.ApiCallError.md#constructor)

## Properties

### cause

• **cause**: `Error`

The original Error object that caused this API call error.

#### Inherited from

[ApiCallError](errors.ApiCallError.md).[cause](errors.ApiCallError.md#cause)

---

### originalError

• **originalError**: `Error`

**`Deprecated`**

use Error cause instead.

#### Inherited from

[ApiCallError](errors.ApiCallError.md).[originalError](errors.ApiCallError.md#originalerror)
