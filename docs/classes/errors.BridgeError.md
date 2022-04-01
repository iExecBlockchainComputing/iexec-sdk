[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / BridgeError

# Class: BridgeError

[errors](../modules/errors.md).BridgeError

BridgeError is thrown when bridging RLC between mainchain and sidechain fail before the value transfert confirmation.

## Hierarchy

- `Error`

  ↳ **`BridgeError`**

## Table of contents

### Constructors

- [constructor](errors.BridgeError.md#constructor)

### Properties

- [originalError](errors.BridgeError.md#originalerror)
- [sendTxHash](errors.BridgeError.md#sendtxhash)

## Constructors

### constructor

• **new BridgeError**(`message?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Inherited from

Error.constructor

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1028

## Properties

### originalError

• `Optional` **originalError**: `Error`

#### Defined in

[src/lib/errors.d.ts:43](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/lib/errors.d.ts#L43)

___

### sendTxHash

• `Optional` **sendTxHash**: `string`

#### Defined in

[src/lib/errors.d.ts:42](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/lib/errors.d.ts#L42)
