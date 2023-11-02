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

• **new ObjectNotFoundError**(`objName`, `objId`, `chainId`): [`ObjectNotFoundError`](errors.ObjectNotFoundError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `objName` | `string` |
| `objId` | `string` |
| `chainId` | `string` |

#### Returns

[`ObjectNotFoundError`](errors.ObjectNotFoundError.md)

#### Overrides

Error.constructor

## Properties

### chainId

• `Optional` **chainId**: `string`

___

### objId

• `Optional` **objId**: `string`

___

### objName

• `Optional` **objName**: `string`
