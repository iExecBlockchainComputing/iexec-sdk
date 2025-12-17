[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / ObjectNotFoundError

# Class: ObjectNotFoundError

[errors](../modules/errors.md).ObjectNotFoundError

ObjectNotFoundError is thrown when trying to access an unknown onchain resource.

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

• **new ObjectNotFoundError**(`objName`, `objId`, `chainId`): [`ObjectNotFoundError`](errors.ObjectNotFoundError.md)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `objName` | `string` | Name of the resource. |
| `objId` | `string` | Id or address of the resource. |
| `chainId` | `string` | Chain id of the blockchain. |

#### Returns

[`ObjectNotFoundError`](errors.ObjectNotFoundError.md)

#### Overrides

Error.constructor

## Properties

### chainId

• **chainId**: `string`

Chain id of the blockchain.

___

### objId

• **objId**: `string`

Id or address of the resource.

___

### objName

• **objName**: `string`

Name of the resource.
