[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / ApiCallError

# Class: ApiCallError

[errors](../modules/errors.md).ApiCallError

ApiCallError encapsulate an error occurring during a call to an API such as a network error or a server internal error.

## Hierarchy

- `Error`

  ↳ **`ApiCallError`**

  ↳↳ [`SmsCallError`](errors.SmsCallError.md)

  ↳↳ [`ResultProxyCallError`](errors.ResultProxyCallError.md)

  ↳↳ [`MarketCallError`](errors.MarketCallError.md)

  ↳↳ [`IpfsGatewayCallError`](errors.IpfsGatewayCallError.md)

  ↳↳ [`WorkerpoolCallError`](errors.WorkerpoolCallError.md)

## Table of contents

### Constructors

- [constructor](errors.ApiCallError.md#constructor)

### Properties

- [cause](errors.ApiCallError.md#cause)
- [originalError](errors.ApiCallError.md#originalerror)

## Constructors

### constructor

• **new ApiCallError**(`message`, `originalError`): [`ApiCallError`](errors.ApiCallError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |
| `originalError` | `Error` |

#### Returns

[`ApiCallError`](errors.ApiCallError.md)

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
