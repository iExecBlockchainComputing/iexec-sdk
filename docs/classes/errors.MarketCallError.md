[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / MarketCallError

# Class: MarketCallError

[errors](../modules/errors.md).MarketCallError

MarketCallError encapsulate an error occurring during a call to the Market API such as a network error or a server internal error.

## Hierarchy

- [`ApiCallError`](errors.ApiCallError.md)

  ↳ **`MarketCallError`**

## Table of contents

### Constructors

- [constructor](errors.MarketCallError.md#constructor)

### Properties

- [originalError](errors.MarketCallError.md#originalerror)

## Constructors

### constructor

• **new MarketCallError**(`message`, `originalError`): [`MarketCallError`](errors.MarketCallError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |
| `originalError` | `Error` |

#### Returns

[`MarketCallError`](errors.MarketCallError.md)

#### Inherited from

[ApiCallError](errors.ApiCallError.md).[constructor](errors.ApiCallError.md#constructor)

## Properties

### originalError

• `Optional` **originalError**: `Error`

#### Inherited from

[ApiCallError](errors.ApiCallError.md).[originalError](errors.ApiCallError.md#originalerror)
