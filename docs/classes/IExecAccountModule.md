[iexec](../README.md) / [Exports](../modules.md) / IExecAccountModule

# Class: IExecAccountModule

module exposing account methods

## Hierarchy

- [`IExecModule`](IExecModule.md)

  ↳ **`IExecAccountModule`**

## Table of contents

### Constructors

- [constructor](IExecAccountModule.md#constructor)

### Properties

- [config](IExecAccountModule.md#config)

### Methods

- [checkBalance](IExecAccountModule.md#checkbalance)
- [checkBridgedBalance](IExecAccountModule.md#checkbridgedbalance)
- [deposit](IExecAccountModule.md#deposit)
- [withdraw](IExecAccountModule.md#withdraw)
- [fromConfig](IExecAccountModule.md#fromconfig)

## Constructors

### constructor

• **new IExecAccountModule**(`configOrArgs`, `options?`)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfigArgs`](../interfaces/internal_.IExecConfigArgs.md) \| [`IExecConfig`](IExecConfig.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/internal_.IExecConfigOptions.md) |

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

## Methods

### checkBalance

▸ **checkBalance**(`address`): `Promise`<{ `locked`: `BN` ; `stake`: `BN`  }\>

check the account balance of specified address (stake is availlable nRLC, locked is escowed nRLC)

example:
```js
const balance = await checkBalance(ethAddress);
console.log('Nano RLC staked:', balance.stake.toString());
console.log('Nano RLC locked:', balance.locked.toString());
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

#### Returns

`Promise`<{ `locked`: `BN` ; `stake`: `BN`  }\>

___

### checkBridgedBalance

▸ **checkBridgedBalance**(`address`): `Promise`<{ `locked`: `BN` ; `stake`: `BN`  }\>

check the account balance on bridged chain of specified address ie: when connected to mainnet, check the account ballance on bellecour
example:
```js
const balance = await checkBridgedBalance(ethAddress);
console.log('Nano RLC staked:', balance.stake.toString());
console.log('Nano RLC locked:', balance.locked.toString());
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

#### Returns

`Promise`<{ `locked`: `BN` ; `stake`: `BN`  }\>

___

### deposit

▸ **deposit**(`amount`): `Promise`<{ `amount`: `BN` ; `txHash`: `string`  }\>

**SIGNER REQUIRED**

deposit some nRLC (1 nRLC = 1*10^-9 RLC) from user wallet to user account

example:
```js
const { amount, txHash } = await deposit('1000000000');
console.log('Deposited:', amount);
console.log('tx:', txHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `amount` | [`NRLCAmount`](../modules/internal_.md#nrlcamount) |

#### Returns

`Promise`<{ `amount`: `BN` ; `txHash`: `string`  }\>

___

### withdraw

▸ **withdraw**(`amount`): `Promise`<{ `amount`: `BN` ; `txHash`: `string`  }\>

**SIGNER REQUIRED**

withdraw some nRLC (1 nRLC = 1*10^-9 RLC) from user account to user wallet

example:
```js
const { amount, txHash } = await iexec.account.withdraw('1000000000');
console.log('Withdrawn:', amount);
console.log('tx:', txHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `amount` | [`NRLCAmount`](../modules/internal_.md#nrlcamount) |

#### Returns

`Promise`<{ `amount`: `BN` ; `txHash`: `string`  }\>

___

### fromConfig

▸ `Static` **fromConfig**(`config`): [`IExecAccountModule`](IExecAccountModule.md)

Create an IExecAccountModule instance using an IExecConfig instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExecAccountModule`](IExecAccountModule.md)

#### Overrides

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)
