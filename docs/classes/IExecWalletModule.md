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

### bridgeToMainchain

▸ **bridgeToMainchain**(`nRLCAmount`): `Promise`<{ `receiveTxHash?`: `string` ; `sendTxHash`: `string`  }\>

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

| Name | Type |
| :------ | :------ |
| `nRLCAmount` | [`NRLCAmount`](../modules/internal_.md#nrlcamount) |

#### Returns

`Promise`<{ `receiveTxHash?`: `string` ; `sendTxHash`: `string`  }\>

___

### bridgeToSidechain

▸ **bridgeToSidechain**(`nRLCAmount`): `Promise`<{ `receiveTxHash?`: `string` ; `sendTxHash`: `string`  }\>

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

| Name | Type |
| :------ | :------ |
| `nRLCAmount` | [`NRLCAmount`](../modules/internal_.md#nrlcamount) |

#### Returns

`Promise`<{ `receiveTxHash?`: `string` ; `sendTxHash`: `string`  }\>

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

___

### getAddress

▸ **getAddress**(): `Promise`<`string`\>

**SIGNER REQUIRED**

get the connected wallet address

example:
```js
const userAddress = await getAddress();
console.log('user address:', userAddress);
```

#### Returns

`Promise`<`string`\>

___

### obsBridgeToMainchain

▸ **obsBridgeToMainchain**(`nRLCAmount`): `Promise`<[`BrigdeObservable`](internal_.BrigdeObservable.md)\>

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

| Name | Type |
| :------ | :------ |
| `nRLCAmount` | [`NRLCAmount`](../modules/internal_.md#nrlcamount) |

#### Returns

`Promise`<[`BrigdeObservable`](internal_.BrigdeObservable.md)\>

___

### obsBridgeToSidechain

▸ **obsBridgeToSidechain**(`nRLCAmount`): `Promise`<[`BrigdeObservable`](internal_.BrigdeObservable.md)\>

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

| Name | Type |
| :------ | :------ |
| `nRLCAmount` | [`NRLCAmount`](../modules/internal_.md#nrlcamount) |

#### Returns

`Promise`<[`BrigdeObservable`](internal_.BrigdeObservable.md)\>

___

### sendETH

▸ **sendETH**(`WeiAmount`, `to`): `Promise`<`string`\>

**SIGNER REQUIRED**

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

___

### sendRLC

▸ **sendRLC**(`nRLCAmount`, `to`): `Promise`<`string`\>

**SIGNER REQUIRED**

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

___

### sweep

▸ **sweep**(`to`): `Promise`<{ `sendERC20TxHash`: `string` ; `sendNativeTxHash`: `string`  }\>

**SIGNER REQUIRED**

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

___

### unwrapEnterpriseRLC

▸ **unwrapEnterpriseRLC**(`nRLCAmount`): `Promise`<`string`\>

**SIGNER REQUIRED, ONLY ERLC WHITELISTED ACCOUNTS**

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

___

### wrapEnterpriseRLC

▸ **wrapEnterpriseRLC**(`nRLCAmount`): `Promise`<`string`\>

**SIGNER REQUIRED, ONLY ERLC WHITELISTED ACCOUNTS**

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

___

### fromConfig

▸ `Static` **fromConfig**(`config`): [`IExecWalletModule`](IExecWalletModule.md)

Create an IExecWalletModule instance using an IExecConfig instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExecWalletModule`](IExecWalletModule.md)

#### Overrides

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)
