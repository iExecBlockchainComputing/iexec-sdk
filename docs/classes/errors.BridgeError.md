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

• **new BridgeError**(`message?`): [`BridgeError`](errors.BridgeError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Returns

[`BridgeError`](errors.BridgeError.md)

#### Inherited from

Error.constructor

## Properties

### cause

• `Optional` **cause**: `Error`

___

### originalError

• `Optional` **originalError**: `Error`

**`Deprecated`**

use Error cause instead

___

### sendTxHash

• `Optional` **sendTxHash**: `string`
