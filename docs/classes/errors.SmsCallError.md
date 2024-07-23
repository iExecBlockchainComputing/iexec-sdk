[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / SmsCallError

# Class: SmsCallError

[errors](../modules/errors.md).SmsCallError

SmsCallError encapsulates an error occurring during a call to the SMS API such as a network error or a server-side internal error.

## Hierarchy

- [`ApiCallError`](errors.ApiCallError.md)

  ↳ **`SmsCallError`**

## Table of contents

### Constructors

- [constructor](errors.SmsCallError.md#constructor)

### Properties

- [cause](errors.SmsCallError.md#cause)
- [originalError](errors.SmsCallError.md#originalerror)

## Constructors

### constructor

• **new SmsCallError**(`message`, `originalError`): [`SmsCallError`](errors.SmsCallError.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `string` | A descriptive error message detailing the nature of the error. |
| `originalError` | `Error` | The original Error object that caused this API call error. |

#### Returns

[`SmsCallError`](errors.SmsCallError.md)

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
