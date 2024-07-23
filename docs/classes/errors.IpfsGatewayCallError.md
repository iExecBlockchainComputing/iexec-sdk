[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / IpfsGatewayCallError

# Class: IpfsGatewayCallError

[errors](../modules/errors.md).IpfsGatewayCallError

IpfsGatewayCallError encapsulates an error occurring during a call to the IPFS gateway API such as a network error or a server-side internal error.

## Hierarchy

- [`ApiCallError`](errors.ApiCallError.md)

  ↳ **`IpfsGatewayCallError`**

## Table of contents

### Constructors

- [constructor](errors.IpfsGatewayCallError.md#constructor)

### Properties

- [cause](errors.IpfsGatewayCallError.md#cause)
- [originalError](errors.IpfsGatewayCallError.md#originalerror)

## Constructors

### constructor

• **new IpfsGatewayCallError**(`message`, `originalError`): [`IpfsGatewayCallError`](errors.IpfsGatewayCallError.md)

#### Parameters

| Name            | Type     | Description                                                    |
| :-------------- | :------- | :------------------------------------------------------------- |
| `message`       | `string` | A descriptive error message detailing the nature of the error. |
| `originalError` | `Error`  | The original Error object that caused this API call error.     |

#### Returns

[`IpfsGatewayCallError`](errors.IpfsGatewayCallError.md)

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
