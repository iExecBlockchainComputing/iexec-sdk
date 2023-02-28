[iexec](../README.md) / [Exports](../modules.md) / [errors](../modules/errors.md) / ValidationError

# Class: ValidationError

[errors](../modules/errors.md).ValidationError

ValidationError is thrown when a method is called with missing or unexpected parameters.

## Hierarchy

- `ValidationError`

  ↳ **`ValidationError`**

## Table of contents

### Constructors

- [constructor](errors.ValidationError.md#constructor)

## Constructors

### constructor

• **new ValidationError**(`errorOrErrors`, `value?`, `field?`, `type?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `errorOrErrors` | `string` \| `ValidationError` \| readonly `ValidationError`[] |
| `value?` | `any` |
| `field?` | `string` |
| `type?` | `string` |

#### Inherited from

YupValidationError.constructor
