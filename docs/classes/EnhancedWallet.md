[iexec](../README.md) / [Exports](../modules.md) / EnhancedWallet

# Class: EnhancedWallet

## Hierarchy

- `Wallet`

  ↳ **`EnhancedWallet`**

## Table of contents

### Constructors

- [constructor](EnhancedWallet.md#constructor)

### Methods

- [signTypedData](EnhancedWallet.md#signtypeddata)

## Constructors

### constructor

• **new EnhancedWallet**(`privateKey`, `provider?`, `options?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `privateKey` | `BytesLike` \| `ExternallyOwnedAccount` \| `SigningKey` |
| `provider?` | `Provider` |
| `options?` | `Object` |
| `options.gasPrice?` | `string` |
| `options.getTransactionCount?` | (`blockTag?`: `BlockTag`) => `Promise`<`number`\> |

#### Overrides

Wallet.constructor

## Methods

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
