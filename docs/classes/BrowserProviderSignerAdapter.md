[**iexec**](../README.md)

***

[iexec](../globals.md) / BrowserProviderSignerAdapter

# Class: BrowserProviderSignerAdapter

BrowserProvider wrapped in an AbstractSigner

## Extends

- `AbstractSigner`

## Constructors

### Constructor

> **new BrowserProviderSignerAdapter**(`browserProvider`): `BrowserProviderSignerAdapter`

#### Parameters

##### browserProvider

`BrowserProvider`

#### Returns

`BrowserProviderSignerAdapter`

#### Overrides

`AbstractSigner.constructor`

## Methods

### connect()

> **connect**(`provider`): `Signer`

Returns the signer connected to %%provider%%.

 This may throw, for example, a Signer connected over a Socket or
 to a specific instance of a node may not be transferrable.

#### Parameters

##### provider

`Provider` | `null`

#### Returns

`Signer`

#### Overrides

`AbstractSigner.connect`

***

### getAddress()

> **getAddress**(): `Promise`\<`string`\>

Resolves to the Signer address.

#### Returns

`Promise`\<`string`\>

#### Overrides

`AbstractSigner.getAddress`

***

### signMessage()

> **signMessage**(`message`): `Promise`\<`string`\>

#### Parameters

##### message

`string` | `Uint8Array`\<`ArrayBufferLike`\>

#### Returns

`Promise`\<`string`\>

#### Overrides

`AbstractSigner.signMessage`

***

### signTransaction()

> **signTransaction**(`tx`): `Promise`\<`string`\>

#### Parameters

##### tx

`TransactionRequest`

#### Returns

`Promise`\<`string`\>

#### Overrides

`AbstractSigner.signTransaction`

***

### signTypedData()

> **signTypedData**(`domain`, `types`, `value`): `Promise`\<`string`\>

#### Parameters

##### domain

`TypedDataDomain`

##### types

`Record`\<`string`, `TypedDataField`[]\>

##### value

`Record`\<`string`, `any`\>

#### Returns

`Promise`\<`string`\>

#### Overrides

`AbstractSigner.signTypedData`
