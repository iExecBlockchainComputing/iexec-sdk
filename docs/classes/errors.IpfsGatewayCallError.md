[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / IpfsGatewayCallError

# Class: IpfsGatewayCallError

[errors](../modules/errors.md).IpfsGatewayCallError

IpfsGatewayCallError encapsulate an error occurring during a call to the IPFS gateway API such as a network error or a server internal error.

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

| Name | Type |
| :------ | :------ |
| `message` | `string` |
| `originalError` | `Error` |

#### Returns

[`IpfsGatewayCallError`](errors.IpfsGatewayCallError.md)

#### Inherited from

[ApiCallError](errors.ApiCallError.md).[constructor](errors.ApiCallError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `Error`

#### Inherited from

[ApiCallError](errors.ApiCallError.md).[cause](errors.ApiCallError.md#cause)

___

### originalError

• `Optional` **originalError**: `Error`

**`Deprecated`**

use Error cause instead

#### Inherited from

[ApiCallError](errors.ApiCallError.md).[originalError](errors.ApiCallError.md#originalerror)
