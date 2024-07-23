[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / MarketCallError

# Class: MarketCallError

[errors](../modules/errors.md).MarketCallError

MarketCallError encapsulates an error occurring during a call to the Market API such as a network error or a server-side internal error.

## Hierarchy

- [`ApiCallError`](errors.ApiCallError.md)

  ↳ **`MarketCallError`**

## Table of contents

### Constructors

- [constructor](errors.MarketCallError.md#constructor)

### Properties

- [cause](errors.MarketCallError.md#cause)
- [originalError](errors.MarketCallError.md#originalerror)

## Constructors

### constructor

• **new MarketCallError**(`message`, `originalError`): [`MarketCallError`](errors.MarketCallError.md)

#### Parameters

| Name            | Type     | Description                                                    |
| :-------------- | :------- | :------------------------------------------------------------- |
| `message`       | `string` | A descriptive error message detailing the nature of the error. |
| `originalError` | `Error`  | The original Error object that caused this API call error.     |

#### Returns

[`MarketCallError`](errors.MarketCallError.md)

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
