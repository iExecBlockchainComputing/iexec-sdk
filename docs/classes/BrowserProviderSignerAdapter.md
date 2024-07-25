[iexec](../README.md) / [Exports](../modules.md) / BrowserProviderSignerAdapter

# Class: BrowserProviderSignerAdapter

BrowserProvider wrapped in an AbstractSigner

## Hierarchy

- `AbstractSigner`

  ↳ **`BrowserProviderSignerAdapter`**

## Table of contents

### Constructors

- [constructor](BrowserProviderSignerAdapter.md#constructor)

### Methods

- [connect](BrowserProviderSignerAdapter.md#connect)
- [getAddress](BrowserProviderSignerAdapter.md#getaddress)
- [signMessage](BrowserProviderSignerAdapter.md#signmessage)
- [signTransaction](BrowserProviderSignerAdapter.md#signtransaction)
- [signTypedData](BrowserProviderSignerAdapter.md#signtypeddata)

## Constructors

### constructor

• **new BrowserProviderSignerAdapter**(`browserProvider`): [`BrowserProviderSignerAdapter`](BrowserProviderSignerAdapter.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `browserProvider` | `BrowserProvider` |

#### Returns

[`BrowserProviderSignerAdapter`](BrowserProviderSignerAdapter.md)

#### Overrides

AbstractSigner.constructor

## Methods

### connect

▸ **connect**(`provider`): `Signer`

#### Parameters

| Name | Type |
| :------ | :------ |
| `provider` | ``null`` \| `Provider` |

#### Returns

`Signer`

#### Overrides

AbstractSigner.connect

___

### getAddress

▸ **getAddress**(): `Promise`<`string`\>

#### Returns

`Promise`<`string`\>

#### Overrides

AbstractSigner.getAddress

___

### signMessage

▸ **signMessage**(`message`): `Promise`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` \| `Uint8Array` |

#### Returns

`Promise`<`string`\>

#### Overrides

AbstractSigner.signMessage

___

### signTransaction

▸ **signTransaction**(`tx`): `Promise`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `tx` | `TransactionRequest` |

#### Returns

`Promise`<`string`\>

#### Overrides

AbstractSigner.signTransaction

___

### signTypedData

▸ **signTypedData**(`domain`, `types`, `value`): `Promise`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `domain` | `TypedDataDomain` |
| `types` | `Record`<`string`, `TypedDataField`[]\> |
| `value` | `Record`<`string`, `any`\> |

#### Returns

`Promise`<`string`\>

#### Overrides

AbstractSigner.signTypedData
