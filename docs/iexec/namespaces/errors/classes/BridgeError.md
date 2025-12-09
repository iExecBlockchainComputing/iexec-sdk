[**iexec**](../../../../README.md)

***

[iexec](../../../../globals.md) / [errors](../README.md) / BridgeError

# Class: BridgeError

BridgeError is thrown when bridging RLC between mainchain and sidechain fail before the value transfer confirmation.

## Extends

- `Error`

## Constructors

### Constructor

> **new BridgeError**(`originalError`, `sendTxHash`): `BridgeError`

#### Parameters

##### originalError

`Error`

The original Error object that caused this API call error.

##### sendTxHash

`string`

Hash of the transaction sending the value to the bridge contract.

#### Returns

`BridgeError`

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

use Error cause instead

***

### sendTxHash

> **sendTxHash**: `string`

Hash of the transaction sending the value to the bridge contract.
