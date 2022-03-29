[iexec](../README.md) / [Exports](../modules.md) / IExec

# Class: IExec

module exposing all the iExec SDK modules

## Hierarchy

- [`IExecModule`](IExecModule.md)

  ↳ **`IExec`**

## Table of contents

### Constructors

- [constructor](IExec.md#constructor)

### Properties

- [account](IExec.md#account)
- [app](IExec.md#app)
- [config](IExec.md#config)
- [dataset](IExec.md#dataset)
- [deal](IExec.md#deal)
- [ens](IExec.md#ens)
- [hub](IExec.md#hub)
- [network](IExec.md#network)
- [order](IExec.md#order)
- [orderbook](IExec.md#orderbook)
- [result](IExec.md#result)
- [storage](IExec.md#storage)
- [task](IExec.md#task)
- [wallet](IExec.md#wallet)
- [workerpool](IExec.md#workerpool)

### Methods

- [fromConfig](IExec.md#fromconfig)

## Constructors

### constructor

• **new IExec**(`configOrArgs`, `options?`)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/internal_.IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/internal_.IExecConfigOptions.md) |

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

#### Defined in

[src/lib/IExecModule.d.ts:13](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExecModule.d.ts#L13)

## Properties

### account

• **account**: [`IExecAccountModule`](IExecAccountModule.md)

account module

#### Defined in

[src/lib/IExec.d.ts:24](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExec.d.ts#L24)

___

### app

• **app**: [`IExecAppModule`](IExecAppModule.md)

app module

#### Defined in

[src/lib/IExec.d.ts:28](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExec.d.ts#L28)

___

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

#### Defined in

[src/lib/IExecModule.d.ts:20](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExecModule.d.ts#L20)

___

### dataset

• **dataset**: [`IExecDatasetModule`](IExecDatasetModule.md)

dataset module

#### Defined in

[src/lib/IExec.d.ts:32](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExec.d.ts#L32)

___

### deal

• **deal**: [`IExecDealModule`](IExecDealModule.md)

deal module

#### Defined in

[src/lib/IExec.d.ts:36](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExec.d.ts#L36)

___

### ens

• **ens**: [`IExecENSModule`](IExecENSModule.md)

ens module

#### Defined in

[src/lib/IExec.d.ts:40](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExec.d.ts#L40)

___

### hub

• **hub**: [`IExecHubModule`](IExecHubModule.md)

hub module

#### Defined in

[src/lib/IExec.d.ts:44](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExec.d.ts#L44)

___

### network

• **network**: [`IExecNetworkModule`](IExecNetworkModule.md)

network module

#### Defined in

[src/lib/IExec.d.ts:48](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExec.d.ts#L48)

___

### order

• **order**: [`IExecOrderModule`](IExecOrderModule.md)

order module

#### Defined in

[src/lib/IExec.d.ts:52](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExec.d.ts#L52)

___

### orderbook

• **orderbook**: [`IExecOrderbookModule`](IExecOrderbookModule.md)

orderbook module

#### Defined in

[src/lib/IExec.d.ts:56](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExec.d.ts#L56)

___

### result

• **result**: [`IExecResultModule`](IExecResultModule.md)

result module

#### Defined in

[src/lib/IExec.d.ts:60](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExec.d.ts#L60)

___

### storage

• **storage**: [`IExecStorageModule`](IExecStorageModule.md)

storage module

#### Defined in

[src/lib/IExec.d.ts:64](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExec.d.ts#L64)

___

### task

• **task**: [`IExecTaskModule`](IExecTaskModule.md)

task module

#### Defined in

[src/lib/IExec.d.ts:68](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExec.d.ts#L68)

___

### wallet

• **wallet**: [`IExecWalletModule`](IExecWalletModule.md)

wallet module

#### Defined in

[src/lib/IExec.d.ts:72](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExec.d.ts#L72)

___

### workerpool

• **workerpool**: [`IExecWorkerpoolModule`](IExecWorkerpoolModule.md)

workerpool module

#### Defined in

[src/lib/IExec.d.ts:76](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExec.d.ts#L76)

## Methods

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

[src/lib/IExecModule.d.ts:24](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExecModule.d.ts#L24)
