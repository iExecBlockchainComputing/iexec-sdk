[iexec](../README.md) / [Exports](../modules.md) / EnhancedWallet

# Class: EnhancedWallet

## Hierarchy

- `Wallet`

  ↳ **`EnhancedWallet`**

## Table of contents

### Constructors

- [constructor](EnhancedWallet.md#constructor)

## Constructors

### constructor

• **new EnhancedWallet**(`privateKey`, `provider?`, `options?`): [`EnhancedWallet`](EnhancedWallet.md)

#### Parameters

| Name                           | Type                                              |
| :----------------------------- | :------------------------------------------------ |
| `privateKey`                   | `string` \| `SigningKey`                          |
| `provider?`                    | `Provider`                                        |
| `options?`                     | `Object`                                          |
| `options.gasPrice?`            | `string`                                          |
| `options.getTransactionCount?` | (`blockTag?`: `BlockTag`) => `Promise`<`number`\> |

#### Returns

[`EnhancedWallet`](EnhancedWallet.md)

#### Overrides

Wallet.constructor
