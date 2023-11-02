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

• **new EnhancedWallet**(`privateKey`, `provider?`, `options?`): [`EnhancedWallet`](EnhancedWallet.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `privateKey` | `string` \| `SigningKey` |
| `provider?` | `Provider` |
| `options?` | `Object` |
| `options.gasPrice?` | `string` |
| `options.getTransactionCount?` | (`blockTag?`: `BlockTag`) => `Promise`<`number`\> |

#### Returns

[`EnhancedWallet`](EnhancedWallet.md)

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

#### Overrides

Wallet.signTypedData
