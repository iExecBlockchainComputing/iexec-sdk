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
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/internal_.IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/internal_.IExecConfigOptions.md) |

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

#### Defined in

[src/lib/IExecModule.d.ts:13](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecModule.d.ts#L13)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

#### Defined in

[src/lib/IExecModule.d.ts:20](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecModule.d.ts#L20)

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

#### Defined in

[src/lib/IExecAccountModule.d.ts:40](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecAccountModule.d.ts#L40)

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

#### Defined in

[src/lib/IExecAccountModule.d.ts:50](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecAccountModule.d.ts#L50)

___

### deposit

▸ **deposit**(`amount`): `Promise`<{ `amount`: `BN` ; `txHash`: `string`  }\>

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

#### Defined in

[src/lib/IExecAccountModule.d.ts:18](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecAccountModule.d.ts#L18)

___

### withdraw

▸ **withdraw**(`amount`): `Promise`<{ `amount`: `BN` ; `txHash`: `string`  }\>

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

#### Defined in

[src/lib/IExecAccountModule.d.ts:29](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecAccountModule.d.ts#L29)

___

### fromConfig

▸ `Static` **fromConfig**(`config`): [`IExecModule`](IExecModule.md)

Create an IExecModule using an IExecConfig instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExecModule`](IExecModule.md)

#### Inherited from

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)

#### Defined in

[src/lib/IExecModule.d.ts:24](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/19522bb/src/lib/IExecModule.d.ts#L24)
