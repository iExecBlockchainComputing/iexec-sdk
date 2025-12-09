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

### bridgeToMainchain()

> **bridgeToMainchain**(`nRLCAmount`): `Promise`\<\{ `receiveTxHash?`: `string`; `sendTxHash`: `string`; \}\>

**SIGNER REQUIRED**

send some nRLC to the mainchain

_NB_:
- RLC is send to the sidechain bridge smart contract on sidechain then credited on mainchain by the mainchain bridge smart contract
- the reception of the value on the mainchain (`receiveTxHash`) will not be monitored if the bridged network configuration is missing

example:
```js
const { sendTxHash, receiveTxHash } = await bridgeToSidechain('1000000000');
console.log(`sent RLC on sidechain (tx: ${sendTxHash}), wallet credited on mainchain (tx: ${receiveTxHash})`);
```

#### Parameters

##### nRLCAmount

[`NRLCAmount`](../type-aliases/NRLCAmount.md)

#### Returns

`Promise`\<\{ `receiveTxHash?`: `string`; `sendTxHash`: `string`; \}\>

***

### bridgeToSidechain()

> **bridgeToSidechain**(`nRLCAmount`): `Promise`\<\{ `receiveTxHash?`: `string`; `sendTxHash`: `string`; \}\>

**SIGNER REQUIRED**

send some nRLC to the sidechain

_NB_:
- RLC is send to the mainchain bridge smart contract on mainchain then credited on sidechain by the sidechain bridge smart contract
- the reception of the value on the sidechain (`receiveTxHash`) will not be monitored if the bridged network configuration is missing

example:
```js
const { sendTxHash, receiveTxHash } = await bridgeToSidechain('1000000000');
console.log(`sent RLC on mainchain (tx: ${sendTxHash}), wallet credited on sidechain (tx: ${receiveTxHash})`);
```

#### Parameters

##### nRLCAmount

[`NRLCAmount`](../type-aliases/NRLCAmount.md)

#### Returns

`Promise`\<\{ `receiveTxHash?`: `string`; `sendTxHash`: `string`; \}\>

***

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

### checkBridgedBalances()

> **checkBridgedBalances**(`address`): `Promise`\<\{ `nRLC`: [`BN`](../interfaces/BN.md); `wei`: [`BN`](../interfaces/BN.md); \}\>

check the wallet balances (native and iExec token) of specified address on bridged chain

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

### obsBridgeToMainchain()

> **obsBridgeToMainchain**(`nRLCAmount`): `Promise`\<[`BridgeObservable`](../-internal-/classes/BridgeObservable.md)\>

**SIGNER REQUIRED**

return an Observable with a subscribe method to start and monitor the bridge to mainchain process

example:
```js
const bridgeObservable = await obsBridgeToMainchain('1000000000');
const cancel = bridgeObservable.subscribe({
  next: ({message, ...rest}) => console.log(message, ...rest),
  error: (err) => console.error(err),
  complete: () => console.log('completed'),
});
```

#### Parameters

##### nRLCAmount

[`NRLCAmount`](../type-aliases/NRLCAmount.md)

#### Returns

`Promise`\<[`BridgeObservable`](../-internal-/classes/BridgeObservable.md)\>

***

### obsBridgeToSidechain()

> **obsBridgeToSidechain**(`nRLCAmount`): `Promise`\<[`BridgeObservable`](../-internal-/classes/BridgeObservable.md)\>

**SIGNER REQUIRED**

return an Observable with a subscribe method to start and monitor the bridge to sidechain process

example:
```js
const bridgeObservable = await obsBridgeToSidechain('1000000000');
const cancel = bridgeObservable.subscribe({
  next: ({message, ...rest}) => console.log(message, ...rest),
  error: (err) => console.error(err),
  complete: () => console.log('completed'),
});
```

#### Parameters

##### nRLCAmount

[`NRLCAmount`](../type-aliases/NRLCAmount.md)

#### Returns

`Promise`\<[`BridgeObservable`](../-internal-/classes/BridgeObservable.md)\>

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
