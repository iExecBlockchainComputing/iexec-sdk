[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / ObjectNotFoundError

# Class: ObjectNotFoundError

[errors](../modules/errors.md).ObjectNotFoundError

ObjectNotFoundError is thrown when trying to access an unknown resource.

## Hierarchy

- `Error`

  ↳ **`ObjectNotFoundError`**

## Table of contents

### Constructors

- [constructor](errors.ObjectNotFoundError.md#constructor)

### Properties

- [chainId](errors.ObjectNotFoundError.md#chainid)
- [objId](errors.ObjectNotFoundError.md#objid)
- [objName](errors.ObjectNotFoundError.md#objname)

## Constructors

### constructor

• **new ObjectNotFoundError**(`objName`, `objId`, `chainId`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `objName` | `string` |
| `objId` | `string` |
| `chainId` | `string` |

#### Overrides

Error.constructor

#### Defined in

[src/lib/errors.d.ts:33](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/af88fc2/src/lib/errors.d.ts#L33)

## Properties

### chainId

• `Optional` **chainId**: `string`

#### Defined in

[src/lib/errors.d.ts:36](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/af88fc2/src/lib/errors.d.ts#L36)

___

### objId

• `Optional` **objId**: `string`

#### Defined in

[src/lib/errors.d.ts:35](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/af88fc2/src/lib/errors.d.ts#L35)

___

### objName

• `Optional` **objName**: `string`

#### Defined in

[src/lib/errors.d.ts:34](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/af88fc2/src/lib/errors.d.ts#L34)
