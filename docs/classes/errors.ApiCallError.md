[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / ApiCallError

# Class: ApiCallError

[errors](../modules/errors.md).ApiCallError

ApiCallError encapsulates an error occurring during a call to an API such as a network error or a server-side internal error.

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

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `string` | A descriptive error message detailing the nature of the error. |
| `originalError` | `Error` | The original Error object that caused this API call error. |

#### Returns

[`ApiCallError`](errors.ApiCallError.md)

#### Overrides

Error.constructor

## Properties

### cause

• **cause**: `Error`

The original Error object that caused this API call error.

___

### originalError

• **originalError**: `Error`

**`Deprecated`**

use Error cause instead.
