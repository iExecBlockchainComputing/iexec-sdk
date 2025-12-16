[**iexec**](../../../../README.md)

***

[iexec](../../../../globals.md) / [errors](../README.md) / ApiCallError

# Class: ApiCallError

ApiCallError encapsulates an error occurring during a call to an API such as a network error or a server-side internal error.

## Extends

- `Error`

## Extended by

- [`SmsCallError`](SmsCallError.md)
- [`ResultProxyCallError`](ResultProxyCallError.md)
- [`MarketCallError`](MarketCallError.md)
- [`IpfsGatewayCallError`](IpfsGatewayCallError.md)
- [`CompassCallError`](CompassCallError.md)
- [`WorkerpoolCallError`](WorkerpoolCallError.md)

## Constructors

### Constructor

> **new ApiCallError**(`message`, `originalError`): `ApiCallError`

#### Parameters

##### message

`string`

A descriptive error message detailing the nature of the error.

##### originalError

`Error`

The original Error object that caused this API call error.

#### Returns

`ApiCallError`

#### Overrides

`Error.constructor`

## Properties

### cause

> **cause**: `Error`

The original Error object that caused this API call error.

***

### ~~originalError~~

> **originalError**: `Error`

#### Deprecated

use Error cause instead.
