[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / BridgeError

# Class: BridgeError

[errors](../modules/errors.md).BridgeError

BridgeError is thrown when bridging RLC between mainchain and sidechain fail before the value transfer confirmation.

## Hierarchy

- `Error`

  ↳ **`BridgeError`**

## Table of contents

### Constructors

- [constructor](errors.BridgeError.md#constructor)

### Properties

- [cause](errors.BridgeError.md#cause)
- [originalError](errors.BridgeError.md#originalerror)
- [sendTxHash](errors.BridgeError.md#sendtxhash)

## Constructors

### constructor

• **new BridgeError**(`originalError`, `sendTxHash`): [`BridgeError`](errors.BridgeError.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `originalError` | `Error` | The original Error object that caused this API call error. |
| `sendTxHash` | `string` | Hash of the transaction sending the value to the bridge contract. |

#### Returns

[`BridgeError`](errors.BridgeError.md)

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

use Error cause instead

___

### sendTxHash

• **sendTxHash**: `string`

Hash of the transaction sending the value to the bridge contract.
