[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / WorkerpoolCallError

# Class: WorkerpoolCallError

[errors](../modules/errors.md).WorkerpoolCallError

WorkerpoolCallError encapsulate an error occurring during a call to a workerpool API such as a network error or a server internal error.

## Hierarchy

- [`ApiCallError`](errors.ApiCallError.md)

  ↳ **`WorkerpoolCallError`**

## Table of contents

### Constructors

- [constructor](errors.WorkerpoolCallError.md#constructor)

### Properties

- [cause](errors.WorkerpoolCallError.md#cause)
- [originalError](errors.WorkerpoolCallError.md#originalerror)

## Constructors

### constructor

• **new WorkerpoolCallError**(`message`, `originalError`): [`WorkerpoolCallError`](errors.WorkerpoolCallError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |
| `originalError` | `Error` |

#### Returns

[`WorkerpoolCallError`](errors.WorkerpoolCallError.md)

#### Inherited from

[ApiCallError](errors.ApiCallError.md).[constructor](errors.ApiCallError.md#constructor)

## Properties

### cause

• `Optional` **cause**: `Error`

#### Inherited from

[ApiCallError](errors.ApiCallError.md).[cause](errors.ApiCallError.md#cause)

___

### originalError

• `Optional` **originalError**: `Error`

**`Deprecated`**

use Error cause instead

#### Inherited from

[ApiCallError](errors.ApiCallError.md).[originalError](errors.ApiCallError.md#originalerror)
