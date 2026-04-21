[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecWalletModule

# Class: IExecWalletModule

module exposing wallet methods

## Extends

- [`IExecModule`](IExecModule.md)

## Constructors

### Constructor

> **new IExecWalletModule**(`configOrArgs`, `options?`): `IExecWalletModule`

Create an IExecModule instance

#### Parameters

##### configOrArgs

[`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) | [`IExecConfig`](IExecConfig.md)

##### options?

[`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)

#### Returns

`IExecWalletModule`

#### Inherited from

[`IExecModule`](IExecModule.md).[`constructor`](IExecModule.md#constructor)

## Properties

### config

> **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[`IExecModule`](IExecModule.md).[`config`](IExecModule.md#config)

## Methods

### checkBalances()

> **checkBalances**(`address`): `Promise`\<\{ `nRLC`: [`BN`](../interfaces/BN.md); `wei`: [`BN`](../interfaces/BN.md); \}\>

check the wallet balances (native and iExec token) of specified address

example:
```js
const { wei, nRLC } = await checkBalances(address);
console.log('iExec nano RLC:', nRLC.toString());
console.log('ethereum wei:', wei.toString());
```

#### Parameters

##### address

`string`

#### Returns

`Promise`\<\{ `nRLC`: [`BN`](../interfaces/BN.md); `wei`: [`BN`](../interfaces/BN.md); \}\>

***

### getAddress()

> **getAddress**(): `Promise`\<`string`\>

**SIGNER REQUIRED**

get the connected wallet address

example:
```js
const userAddress = await getAddress();
console.log('user address:', userAddress);
```

#### Returns

`Promise`\<`string`\>

***

### sendETH()

> **sendETH**(`WeiAmount`, `to`): `Promise`\<`string`\>

**SIGNER REQUIRED**

send some wei to the specified address

example:
```js
const txHash = await sendETH(amount, receiverAddress);
console.log('transaction hash:', txHash);
```

#### Parameters

##### WeiAmount

[`WeiAmount`](../type-aliases/WeiAmount.md)

##### to

`string`

#### Returns

`Promise`\<`string`\>

***

### sendRLC()

> **sendRLC**(`nRLCAmount`, `to`): `Promise`\<`string`\>

**SIGNER REQUIRED**

send some nRLC to the specified address

example:
```js
const txHash = await sendRLC(amount, receiverAddress);
console.log('transaction hash:', txHash);
```

#### Parameters

##### nRLCAmount

[`NRLCAmount`](../type-aliases/NRLCAmount.md)

##### to

`string`

#### Returns

`Promise`\<`string`\>

***

### sweep()

> **sweep**(`to`): `Promise`\<\{ `sendERC20TxHash`: `string`; `sendNativeTxHash`: `string`; \}\>

**SIGNER REQUIRED**

send all the iExec token and the native token owned by the wallet to the specified address

example:
```js
const { sendERC20TxHash, sendNativeTxHash } = await sweep(receiverAddress);
console.log('sweep RLC transaction hash:', sendERC20TxHash);
console.log('sweep ether transaction hash:', sendNativeTxHash);
```

#### Parameters

##### to

`string`

#### Returns

`Promise`\<\{ `sendERC20TxHash`: `string`; `sendNativeTxHash`: `string`; \}\>

***

### fromConfig()

> `static` **fromConfig**(`config`): `IExecWalletModule`

Create an IExecWalletModule instance using an IExecConfig instance

#### Parameters

##### config

[`IExecConfig`](IExecConfig.md)

#### Returns

`IExecWalletModule`

#### Overrides

[`IExecModule`](IExecModule.md).[`fromConfig`](IExecModule.md#fromconfig)
