[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecAccountModule

# Class: IExecAccountModule

module exposing account methods

## Extends

- [`IExecModule`](IExecModule.md)

## Constructors

### Constructor

> **new IExecAccountModule**(`configOrArgs`, `options?`): `IExecAccountModule`

Create an IExecModule instance

#### Parameters

##### configOrArgs

[`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) | [`IExecConfig`](IExecConfig.md)

##### options?

[`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)

#### Returns

`IExecAccountModule`

#### Inherited from

[`IExecModule`](IExecModule.md).[`constructor`](IExecModule.md#constructor)

## Properties

### config

> **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[`IExecModule`](IExecModule.md).[`config`](IExecModule.md#config)

## Methods

### approve()

> **approve**(`amount`, `spenderAddress`): `Promise`\<`string`\>

**SIGNER REQUIRED**

approves the spender to use the account up to a specified amount, denoted in nRLC (1 nRLC = 1*10^-9 RLC).

example:
```js
const txHash = await approve(amount, spenderAddress);
console.log('tx:', txHash);
```

#### Parameters

##### amount

[`NRLCAmount`](../type-aliases/NRLCAmount.md)

##### spenderAddress

`string`

#### Returns

`Promise`\<`string`\>

***

### checkAllowance()

> **checkAllowance**(`ownerAddress`, `spenderAddress`): `Promise`\<[`NRLCAmount`](../type-aliases/NRLCAmount.md)\>

checks the amount of allowance approved for the specified spender to use the account of the owner.

example:
```js
const allowanceAmount = await checkAllowance(ownerAddress, spenderAddress);
console.log('allowance amount:', allowanceAmount);
```

#### Parameters

##### ownerAddress

`string`

##### spenderAddress

`string`

#### Returns

`Promise`\<[`NRLCAmount`](../type-aliases/NRLCAmount.md)\>

***

### checkBalance()

> **checkBalance**(`address`): `Promise`\<\{ `locked`: [`BN`](../interfaces/BN.md); `stake`: [`BN`](../interfaces/BN.md); \}\>

check the account balance of specified address (stake is available nRLC, locked is escrowed nRLC)

example:
```js
const balance = await checkBalance(ethAddress);
console.log('Nano RLC staked:', balance.stake.toString());
console.log('Nano RLC locked:', balance.locked.toString());
```

#### Parameters

##### address

`string`

#### Returns

`Promise`\<\{ `locked`: [`BN`](../interfaces/BN.md); `stake`: [`BN`](../interfaces/BN.md); \}\>

***

### checkBridgedBalance()

> **checkBridgedBalance**(`address`): `Promise`\<\{ `locked`: [`BN`](../interfaces/BN.md); `stake`: [`BN`](../interfaces/BN.md); \}\>

check the account balance on bridged chain of specified address ie: when connected to mainnet, check the account ballance on bellecour
example:
```js
const balance = await checkBridgedBalance(ethAddress);
console.log('Nano RLC staked:', balance.stake.toString());
console.log('Nano RLC locked:', balance.locked.toString());
```

#### Parameters

##### address

`string`

#### Returns

`Promise`\<\{ `locked`: [`BN`](../interfaces/BN.md); `stake`: [`BN`](../interfaces/BN.md); \}\>

***

### deposit()

> **deposit**(`amount`): `Promise`\<\{ `amount`: [`BN`](../interfaces/BN.md); `txHash`: `string`; \}\>

**SIGNER REQUIRED**

deposit some nRLC (1 nRLC = 1*10^-9 RLC) from user wallet to user account

example:
```js
const { amount, txHash } = await deposit('1000000000');
console.log('Deposited:', amount);
console.log('tx:', txHash);
```

#### Parameters

##### amount

[`NRLCAmount`](../type-aliases/NRLCAmount.md)

#### Returns

`Promise`\<\{ `amount`: [`BN`](../interfaces/BN.md); `txHash`: `string`; \}\>

***

### revokeApproval()

> **revokeApproval**(`spenderAddress`): `Promise`\<`string`\>

**SIGNER REQUIRED**

revokes the approval for the spender to use the account.

example:
```js
const txHash = await revokeApproval(spenderAddress);
console.log('tx:', txHash);
```

#### Parameters

##### spenderAddress

`string`

#### Returns

`Promise`\<`string`\>

***

### withdraw()

> **withdraw**(`amount`): `Promise`\<\{ `amount`: [`BN`](../interfaces/BN.md); `txHash`: `string`; \}\>

**SIGNER REQUIRED**

withdraw some nRLC (1 nRLC = 1*10^-9 RLC) from user account to user wallet

example:
```js
const { amount, txHash } = await iexec.account.withdraw('1000000000');
console.log('Withdrawn:', amount);
console.log('tx:', txHash);
```

#### Parameters

##### amount

[`NRLCAmount`](../type-aliases/NRLCAmount.md)

#### Returns

`Promise`\<\{ `amount`: [`BN`](../interfaces/BN.md); `txHash`: `string`; \}\>

***

### fromConfig()

> `static` **fromConfig**(`config`): `IExecAccountModule`

Create an IExecAccountModule instance using an IExecConfig instance

#### Parameters

##### config

[`IExecConfig`](IExecConfig.md)

#### Returns

`IExecAccountModule`

#### Overrides

[`IExecModule`](IExecModule.md).[`fromConfig`](IExecModule.md#fromconfig)
