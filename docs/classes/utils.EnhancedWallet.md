[iexec](../README.md) / [Exports](../modules.md) / [utils](../modules/utils.md) / EnhancedWallet

# Class: EnhancedWallet

[utils](../modules/utils.md).EnhancedWallet

## Hierarchy

- `Wallet`

  ↳ **`EnhancedWallet`**

## Table of contents

### Constructors

- [constructor](utils.EnhancedWallet.md#constructor)

### Methods

- [signTypedData](utils.EnhancedWallet.md#signtypeddata)

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

#### Defined in

[src/lib/utils.d.ts:20](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/utils.d.ts#L20)

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

#### Defined in

[src/lib/utils.d.ts:29](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/utils.d.ts#L29)
