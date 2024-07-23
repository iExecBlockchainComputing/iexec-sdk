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

- [approve](IExecAccountModule.md#approve)
- [checkAllowance](IExecAccountModule.md#checkallowance)
- [checkBalance](IExecAccountModule.md#checkbalance)
- [checkBridgedBalance](IExecAccountModule.md#checkbridgedbalance)
- [deposit](IExecAccountModule.md#deposit)
- [revokeApproval](IExecAccountModule.md#revokeapproval)
- [withdraw](IExecAccountModule.md#withdraw)
- [fromConfig](IExecAccountModule.md#fromconfig)

## Constructors

### constructor

• **new IExecAccountModule**(`configOrArgs`, `options?`): [`IExecAccountModule`](IExecAccountModule.md)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name           | Type                                                                                     |
| :------------- | :--------------------------------------------------------------------------------------- |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) |
| `options?`     | [`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)                              |

#### Returns

[`IExecAccountModule`](IExecAccountModule.md)

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

## Methods

### approve

▸ **approve**(`amount`, `spenderAddress`): `Promise`<`string`\>

**SIGNER REQUIRED**

approves the spender to use the account up to a specified amount, denoted in nRLC (1 nRLC = 1\*10^-9 RLC).

example:

```js
const txHash = await approve(amount, spenderAddress);
console.log('tx:', txHash);
```

#### Parameters

| Name             | Type                                     |
| :--------------- | :--------------------------------------- |
| `amount`         | [`NRLCAmount`](../modules.md#nrlcamount) |
| `spenderAddress` | `string`                                 |

#### Returns

`Promise`<`string`\>

---

### checkAllowance

▸ **checkAllowance**(`ownerAddress`, `spenderAddress`): `Promise`<[`NRLCAmount`](../modules.md#nrlcamount)\>

checks the amount of allowance approved for the specified spender to use the account of the owner.

example:

```js
const allowanceAmount = await checkAllowance(ownerAddress, spenderAddress);
console.log('allowance amount:', allowanceAmount);
```

#### Parameters

| Name             | Type     |
| :--------------- | :------- |
| `ownerAddress`   | `string` |
| `spenderAddress` | `string` |

#### Returns

`Promise`<[`NRLCAmount`](../modules.md#nrlcamount)\>

---

### checkBalance

▸ **checkBalance**(`address`): `Promise`<{ `locked`: [`BN`](utils.BN.md) ; `stake`: [`BN`](utils.BN.md) }\>

check the account balance of specified address (stake is available nRLC, locked is escrowed nRLC)

example:

```js
const balance = await checkBalance(ethAddress);
console.log('Nano RLC staked:', balance.stake.toString());
console.log('Nano RLC locked:', balance.locked.toString());
```

#### Parameters

| Name      | Type     |
| :-------- | :------- |
| `address` | `string` |

#### Returns

`Promise`<{ `locked`: [`BN`](utils.BN.md) ; `stake`: [`BN`](utils.BN.md) }\>

---

### checkBridgedBalance

▸ **checkBridgedBalance**(`address`): `Promise`<{ `locked`: [`BN`](utils.BN.md) ; `stake`: [`BN`](utils.BN.md) }\>

check the account balance on bridged chain of specified address ie: when connected to mainnet, check the account ballance on bellecour
example:

```js
const balance = await checkBridgedBalance(ethAddress);
console.log('Nano RLC staked:', balance.stake.toString());
console.log('Nano RLC locked:', balance.locked.toString());
```

#### Parameters

| Name      | Type     |
| :-------- | :------- |
| `address` | `string` |

#### Returns

`Promise`<{ `locked`: [`BN`](utils.BN.md) ; `stake`: [`BN`](utils.BN.md) }\>

---

### deposit

▸ **deposit**(`amount`): `Promise`<{ `amount`: [`BN`](utils.BN.md) ; `txHash`: `string` }\>

**SIGNER REQUIRED**

deposit some nRLC (1 nRLC = 1\*10^-9 RLC) from user wallet to user account

example:

```js
const { amount, txHash } = await deposit('1000000000');
console.log('Deposited:', amount);
console.log('tx:', txHash);
```

#### Parameters

| Name     | Type                                     |
| :------- | :--------------------------------------- |
| `amount` | [`NRLCAmount`](../modules.md#nrlcamount) |

#### Returns

`Promise`<{ `amount`: [`BN`](utils.BN.md) ; `txHash`: `string` }\>

---

### revokeApproval

▸ **revokeApproval**(`spenderAddress`): `Promise`<`string`\>

**SIGNER REQUIRED**

revokes the approval for the spender to use the account.

example:

```js
const txHash = await revokeApproval(spenderAddress);
console.log('tx:', txHash);
```

#### Parameters

| Name             | Type     |
| :--------------- | :------- |
| `spenderAddress` | `string` |

#### Returns

`Promise`<`string`\>

---

### withdraw

▸ **withdraw**(`amount`): `Promise`<{ `amount`: [`BN`](utils.BN.md) ; `txHash`: `string` }\>

**SIGNER REQUIRED**

withdraw some nRLC (1 nRLC = 1\*10^-9 RLC) from user account to user wallet

example:

```js
const { amount, txHash } = await iexec.account.withdraw('1000000000');
console.log('Withdrawn:', amount);
console.log('tx:', txHash);
```

#### Parameters

| Name     | Type                                     |
| :------- | :--------------------------------------- |
| `amount` | [`NRLCAmount`](../modules.md#nrlcamount) |

#### Returns

`Promise`<{ `amount`: [`BN`](utils.BN.md) ; `txHash`: `string` }\>

---

### fromConfig

▸ **fromConfig**(`config`): [`IExecAccountModule`](IExecAccountModule.md)

Create an IExecAccountModule instance using an IExecConfig instance

#### Parameters

| Name     | Type                            |
| :------- | :------------------------------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExecAccountModule`](IExecAccountModule.md)

#### Overrides

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)
