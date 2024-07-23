[iexec](../README.md) / [Exports](../modules.md) / BrowserProviderSigner

# Class: BrowserProviderSigner

## Hierarchy

- `AbstractSigner`

  ↳ **`BrowserProviderSigner`**

## Table of contents

### Constructors

- [constructor](BrowserProviderSigner.md#constructor)

### Methods

- [connect](BrowserProviderSigner.md#connect)
- [getAddress](BrowserProviderSigner.md#getaddress)
- [signMessage](BrowserProviderSigner.md#signmessage)
- [signTransaction](BrowserProviderSigner.md#signtransaction)
- [signTypedData](BrowserProviderSigner.md#signtypeddata)

## Constructors

### constructor

• **new BrowserProviderSigner**(`ethereum`, `network?`): [`BrowserProviderSigner`](BrowserProviderSigner.md)

#### Parameters

| Name       | Type              |
| :--------- | :---------------- |
| `ethereum` | `Eip1193Provider` |
| `network?` | `Networkish`      |

#### Returns

[`BrowserProviderSigner`](BrowserProviderSigner.md)

#### Overrides

AbstractSigner.constructor

## Methods

### connect

▸ **connect**(`provider`): `Signer`

#### Parameters

| Name       | Type                 |
| :--------- | :------------------- |
| `provider` | `null` \| `Provider` |

#### Returns

`Signer`

#### Overrides

AbstractSigner.connect

---

### getAddress

▸ **getAddress**(): `Promise`<`string`\>

#### Returns

`Promise`<`string`\>

#### Overrides

AbstractSigner.getAddress

---

### signMessage

▸ **signMessage**(`message`): `Promise`<`string`\>

#### Parameters

| Name      | Type                     |
| :-------- | :----------------------- |
| `message` | `string` \| `Uint8Array` |

#### Returns

`Promise`<`string`\>

#### Overrides

AbstractSigner.signMessage

---

### signTransaction

▸ **signTransaction**(`tx`): `Promise`<`string`\>

#### Parameters

| Name | Type                 |
| :--- | :------------------- |
| `tx` | `TransactionRequest` |

#### Returns

`Promise`<`string`\>

#### Overrides

AbstractSigner.signTransaction

---

### signTypedData

▸ **signTypedData**(`domain`, `types`, `value`): `Promise`<`string`\>

#### Parameters

| Name     | Type                                    |
| :------- | :-------------------------------------- |
| `domain` | `TypedDataDomain`                       |
| `types`  | `Record`<`string`, `TypedDataField`[]\> |
| `value`  | `Record`<`string`, `any`\>              |

#### Returns

`Promise`<`string`\>

#### Overrides

AbstractSigner.signTypedData
