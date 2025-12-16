[**iexec**](../../../../README.md)

***

[iexec](../../../../globals.md) / [errors](../README.md) / SmsCallError

# Class: SmsCallError

SmsCallError encapsulates an error occurring during a call to the SMS API such as a network error or a server-side internal error.

## Extends

- [`ApiCallError`](ApiCallError.md)

## Constructors

### Constructor

> **new SmsCallError**(`message`, `originalError`): `SmsCallError`

#### Parameters

##### message

`string`

A descriptive error message detailing the nature of the error.

##### originalError

`Error`

The original Error object that caused this API call error.

#### Returns

`SmsCallError`

#### Inherited from

[`ApiCallError`](ApiCallError.md).[`constructor`](ApiCallError.md#constructor)

## Properties

### cause

> **cause**: `Error`

The original Error object that caused this API call error.

#### Inherited from

[`ApiCallError`](ApiCallError.md).[`cause`](ApiCallError.md#cause)

***

### ~~originalError~~

> **originalError**: `Error`

#### Deprecated

use Error cause instead.

#### Inherited from

[`ApiCallError`](ApiCallError.md).[`originalError`](ApiCallError.md#originalerror)
