[**iexec**](../../../../README.md)

***

[iexec](../../../../globals.md) / [errors](../README.md) / CompassCallError

# Class: CompassCallError

CompassCallError encapsulates an error occurring during a call to the Compass API such as a network error or a server-side internal error.

## Extends

- [`ApiCallError`](ApiCallError.md)

## Constructors

### Constructor

> **new CompassCallError**(`message`, `options?`): `CompassCallError`

#### Parameters

##### message

`string`

A descriptive error message detailing the nature of the error.

##### options?

###### cause?

`unknown`

The original error that caused this API call error.

#### Returns

`CompassCallError`

#### Inherited from

[`ApiCallError`](ApiCallError.md).[`constructor`](ApiCallError.md#constructor)

## Properties

### cause?

> `optional` **cause**: `unknown`

The original error that caused this API call error.

#### Inherited from

[`ApiCallError`](ApiCallError.md).[`cause`](ApiCallError.md#cause)
