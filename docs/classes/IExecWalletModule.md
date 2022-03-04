[iexec](../README.md) / [Exports](../modules.md) / IExecWalletModule

# Class: IExecWalletModule

module exposing wallet methods

## Hierarchy

- [`IExecModule`](IExecModule.md)

  ↳ **`IExecWalletModule`**

## Table of contents

### Constructors

- [constructor](IExecWalletModule.md#constructor)

### Properties

- [config](IExecWalletModule.md#config)

### Methods

- [bridgeToMainchain](IExecWalletModule.md#bridgetomainchain)
- [bridgeToSidechain](IExecWalletModule.md#bridgetosidechain)
- [checkBalances](IExecWalletModule.md#checkbalances)
- [checkBridgedBalances](IExecWalletModule.md#checkbridgedbalances)
- [getAddress](IExecWalletModule.md#getaddress)
- [obsBridgeToMainchain](IExecWalletModule.md#obsbridgetomainchain)
- [obsBridgeToSidechain](IExecWalletModule.md#obsbridgetosidechain)
- [sendETH](IExecWalletModule.md#sendeth)
- [sendRLC](IExecWalletModule.md#sendrlc)
- [sweep](IExecWalletModule.md#sweep)
- [unwrapEnterpriseRLC](IExecWalletModule.md#unwrapenterpriserlc)
- [wrapEnterpriseRLC](IExecWalletModule.md#wrapenterpriserlc)
- [fromConfig](IExecWalletModule.md#fromconfig)

## Constructors

### constructor

• **new IExecWalletModule**(`configOrArgs`, `options?`)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/internal_.IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/internal_.IExecConfigOptions.md) |

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

#### Defined in

[src/lib/IExecModule.d.ts:13](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecModule.d.ts#L13)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

#### Defined in

[src/lib/IExecModule.d.ts:20](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecModule.d.ts#L20)

## Methods

### bridgeToMainchain

▸ **bridgeToMainchain**(`nRLCAmount`): `Promise`<{ `receiveTxHash?`: `string` ; `sendTxHash`: `string`  }\>

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

| Name | Type |
| :------ | :------ |
| `nRLCAmount` | [`NRLCAmount`](../modules/internal_.md#nrlcamount) |

#### Returns

`Promise`<{ `receiveTxHash?`: `string` ; `sendTxHash`: `string`  }\>

#### Defined in

[src/lib/IExecWalletModule.d.ts:173](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecWalletModule.d.ts#L173)

___

### bridgeToSidechain

▸ **bridgeToSidechain**(`nRLCAmount`): `Promise`<{ `receiveTxHash?`: `string` ; `sendTxHash`: `string`  }\>

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

| Name | Type |
| :------ | :------ |
| `nRLCAmount` | [`NRLCAmount`](../modules/internal_.md#nrlcamount) |

#### Returns

`Promise`<{ `receiveTxHash?`: `string` ; `sendTxHash`: `string`  }\>

#### Defined in

[src/lib/IExecWalletModule.d.ts:157](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecWalletModule.d.ts#L157)

___

### checkBalances

▸ **checkBalances**(`address`): `Promise`<{ `nRLC`: `BN` ; `wei`: `BN`  }\>

check the wallet balances (native and iExec token) of specified address

example:
```js
const { wei, nRLC } = await checkBalances(address);
console.log('iExec nano RLC:', nRLC.toString());
console.log('ethereum wei:', wei.toString());
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

#### Returns

`Promise`<{ `nRLC`: `BN` ; `wei`: `BN`  }\>

#### Defined in

[src/lib/IExecWalletModule.d.ts:93](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecWalletModule.d.ts#L93)

___

### checkBridgedBalances

▸ **checkBridgedBalances**(`address`): `Promise`<{ `nRLC`: `BN` ; `wei`: `BN`  }\>

check the wallet balances (native and iExec token) of specified address on bridged chain

example:
```js
const { wei, nRLC } = await checkBalances(address);
console.log('iExec nano RLC:', nRLC.toString());
console.log('ethereum wei:', wei.toString());
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

#### Returns

`Promise`<{ `nRLC`: `BN` ; `wei`: `BN`  }\>

#### Defined in

[src/lib/IExecWalletModule.d.ts:107](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecWalletModule.d.ts#L107)

___

### getAddress

▸ **getAddress**(): `Promise`<`string`\>

get the connected wallet address

example:
```js
const userAddress = await getAddress();
console.log('user address:', userAddress);
```

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecWalletModule.d.ts:82](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecWalletModule.d.ts#L82)

___

### obsBridgeToMainchain

▸ **obsBridgeToMainchain**(`nRLCAmount`): `Promise`<[`BrigdeObservable`](internal_.BrigdeObservable.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `nRLCAmount` | [`NRLCAmount`](../modules/internal_.md#nrlcamount) |

#### Returns

`Promise`<[`BrigdeObservable`](internal_.BrigdeObservable.md)\>

#### Defined in

[src/lib/IExecWalletModule.d.ts:203](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecWalletModule.d.ts#L203)

___

### obsBridgeToSidechain

▸ **obsBridgeToSidechain**(`nRLCAmount`): `Promise`<[`BrigdeObservable`](internal_.BrigdeObservable.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `nRLCAmount` | [`NRLCAmount`](../modules/internal_.md#nrlcamount) |

#### Returns

`Promise`<[`BrigdeObservable`](internal_.BrigdeObservable.md)\>

#### Defined in

[src/lib/IExecWalletModule.d.ts:189](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecWalletModule.d.ts#L189)

___

### sendETH

▸ **sendETH**(`WeiAmount`, `to`): `Promise`<`string`\>

send some wei to the specified address

example:
```js
const txHash = await sendETH(amount, receiverAddress);
console.log('transaction hash:', txHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `WeiAmount` | [`WeiAmount`](../modules/internal_.md#weiamount) |
| `to` | `string` |

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecWalletModule.d.ts:120](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecWalletModule.d.ts#L120)

___

### sendRLC

▸ **sendRLC**(`nRLCAmount`, `to`): `Promise`<`string`\>

send some nRLC to the specified address

example:
```js
const txHash = await sendRLC(amount, receiverAddress);
console.log('transaction hash:', txHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `nRLCAmount` | [`NRLCAmount`](../modules/internal_.md#nrlcamount) |
| `to` | `string` |

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecWalletModule.d.ts:130](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecWalletModule.d.ts#L130)

___

### sweep

▸ **sweep**(`to`): `Promise`<{ `sendERC20TxHash`: `string` ; `sendNativeTxHash`: `string`  }\>

send all the iExec token and the native token owned by the wallet to the specified address

example:
```js
const { sendERC20TxHash, sendNativeTxHash } = await sweep(receiverAddress);
console.log('sweep RLC transaction hash:', sendERC20TxHash);
console.log('sweep ether transaction hash:', sendNativeTxHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `to` | `string` |

#### Returns

`Promise`<{ `sendERC20TxHash`: `string` ; `sendNativeTxHash`: `string`  }\>

#### Defined in

[src/lib/IExecWalletModule.d.ts:141](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecWalletModule.d.ts#L141)

___

### unwrapEnterpriseRLC

▸ **unwrapEnterpriseRLC**(`nRLCAmount`): `Promise`<`string`\>

**ONLY ERLC WHITELISTED ACCOUNTS**

unwrap some neRLC (enterprise nRLC) into nRLC

example:
```js
const txHash = await unwrapEnterpriseRLC(amount);
console.log(`unwrapped ${amount} neRLC into nRLC (tx: ${txHash})`);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `nRLCAmount` | [`NRLCAmount`](../modules/internal_.md#nrlcamount) |

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecWalletModule.d.ts:227](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecWalletModule.d.ts#L227)

___

### wrapEnterpriseRLC

▸ **wrapEnterpriseRLC**(`nRLCAmount`): `Promise`<`string`\>

**ONLY ERLC WHITELISTED ACCOUNTS**

wrap some nRLC into neRLC (enterprise nRLC)

example:
```js
const txHash = await wrapEnterpriseRLC(amount);
console.log(`wrapped ${amount} nRLC into neRLC (tx: ${txHash})`);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `nRLCAmount` | [`NRLCAmount`](../modules/internal_.md#nrlcamount) |

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecWalletModule.d.ts:215](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecWalletModule.d.ts#L215)

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

[src/lib/IExecModule.d.ts:24](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecModule.d.ts#L24)
