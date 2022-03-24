[iexec](../README.md) / [Exports](../modules.md) / IExecNetworkModule

# Class: IExecNetworkModule

module exposing network methods

## Hierarchy

- [`IExecModule`](IExecModule.md)

  ↳ **`IExecNetworkModule`**

## Table of contents

### Constructors

- [constructor](IExecNetworkModule.md#constructor)

### Properties

- [config](IExecNetworkModule.md#config)

### Methods

- [getNetwork](IExecNetworkModule.md#getnetwork)
- [fromConfig](IExecNetworkModule.md#fromconfig)

## Constructors

### constructor

• **new IExecNetworkModule**(`configOrArgs`, `options?`)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/internal_.IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/internal_.IExecConfigOptions.md) |

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

#### Defined in

[src/lib/IExecModule.d.ts:13](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/7feaf0f/src/lib/IExecModule.d.ts#L13)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

#### Defined in

[src/lib/IExecModule.d.ts:20](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/7feaf0f/src/lib/IExecModule.d.ts#L20)

## Methods

### getNetwork

▸ **getNetwork**(): `Promise`<{ `chainId`: `number` ; `isNative`: `boolean`  }\>

get info about the current iExec network

_NB_: `isNative` is true when the iExec instance use the chain's native token for payment (otherwise the payment token is an ERC20)

example:
```js
const { chainId, isNative } = await getNetwork();
console.log(`working on chain ${chainId}, using native token: ${isNative}`);
```

#### Returns

`Promise`<{ `chainId`: `number` ; `isNative`: `boolean`  }\>

#### Defined in

[src/lib/IExecNetworkModule.d.ts:18](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/7feaf0f/src/lib/IExecNetworkModule.d.ts#L18)

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

[src/lib/IExecModule.d.ts:24](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/7feaf0f/src/lib/IExecModule.d.ts#L24)
