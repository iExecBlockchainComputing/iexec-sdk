[**iexec**](../../../../README.md)

***

[iexec](../../../../globals.md) / [errors](../README.md) / ValidationError

# Class: ValidationError

ValidationError is thrown when a method is called with missing or unexpected parameters.

## Extends

- `ValidationError`

## Constructors

### Constructor

> **new ValidationError**(`errorOrErrors`, `value?`, `field?`, `type?`, `disableStack?`): `ValidationError`

#### Parameters

##### errorOrErrors

`string` | `ValidationError` | readonly `ValidationError`[]

##### value?

`any`

##### field?

`string`

##### type?

`string`

##### disableStack?

`boolean`

#### Returns

`ValidationError`

#### Inherited from

`YupValidationError.constructor`
