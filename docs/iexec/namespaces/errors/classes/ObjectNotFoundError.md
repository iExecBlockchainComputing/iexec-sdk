[**iexec**](../../../../README.md)

***

[iexec](../../../../globals.md) / [errors](../README.md) / ObjectNotFoundError

# Class: ObjectNotFoundError

ObjectNotFoundError is thrown when trying to access an unknown onchain resource.

## Extends

- `Error`

## Constructors

### Constructor

> **new ObjectNotFoundError**(`objName`, `objId`, `chainId`): `ObjectNotFoundError`

#### Parameters

##### objName

`string`

Name of the resource.

##### objId

`string`

Id or address of the resource.

##### chainId

`string`

Chain id of the blockchain.

#### Returns

`ObjectNotFoundError`

#### Overrides

`Error.constructor`

## Properties

### chainId

> **chainId**: `string`

Chain id of the blockchain.

***

### objId

> **objId**: `string`

Id or address of the resource.

***

### objName

> **objName**: `string`

Name of the resource.
