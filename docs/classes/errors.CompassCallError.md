[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / CompassCallError

# Class: CompassCallError

[errors](../modules/errors.md).CompassCallError

CompassCallError encapsulates an error occurring during a call to the Compass API such as a network error or a server-side internal error.

## Hierarchy

- [`ApiCallError`](errors.ApiCallError.md)

  ↳ **`CompassCallError`**

## Table of contents

### Constructors

- [constructor](errors.CompassCallError.md#constructor)

### Properties

- [cause](errors.CompassCallError.md#cause)
- [originalError](errors.CompassCallError.md#originalerror)

## Constructors

### constructor

• **new CompassCallError**(`message`, `originalError`): [`CompassCallError`](errors.CompassCallError.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `string` | A descriptive error message detailing the nature of the error. |
| `originalError` | `Error` | The original Error object that caused this API call error. |

#### Returns

[`CompassCallError`](errors.CompassCallError.md)

#### Inherited from

[ApiCallError](errors.ApiCallError.md).[constructor](errors.ApiCallError.md#constructor)

## Properties

### cause

• **cause**: `Error`

The original Error object that caused this API call error.

#### Inherited from

[ApiCallError](errors.ApiCallError.md).[cause](errors.ApiCallError.md#cause)

___

### originalError

• **originalError**: `Error`

**`Deprecated`**

use Error cause instead.

#### Inherited from

[ApiCallError](errors.ApiCallError.md).[originalError](errors.ApiCallError.md#originalerror)
