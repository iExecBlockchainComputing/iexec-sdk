[iexec](../README.md) / [Exports](../modules.md) / [{internal}](../modules/internal_.md) / EnhancedWallet

# Class: EnhancedWallet

[{internal}](../modules/internal_.md).EnhancedWallet

## Hierarchy

- `Wallet`

  ↳ **`EnhancedWallet`**

## Table of contents

### Constructors

- [constructor](internal_.EnhancedWallet.md#constructor)

### Methods

- [signTypedData](internal_.EnhancedWallet.md#signtypeddata)

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

[src/common/utils/signers.d.ts:12](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/common/utils/signers.d.ts#L12)

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

[src/common/utils/signers.d.ts:21](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/common/utils/signers.d.ts#L21)
