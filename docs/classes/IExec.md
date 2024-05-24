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
- [secrets](IExec.md#secrets)
- [storage](IExec.md#storage)
- [task](IExec.md#task)
- [wallet](IExec.md#wallet)
- [workerpool](IExec.md#workerpool)

### Methods

- [fromConfig](IExec.md#fromconfig)

## Constructors

### constructor

• **new IExec**(`configOrArgs`, `options?`): [`IExec`](IExec.md)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/IExecConfigOptions.md) |

#### Returns

[`IExec`](IExec.md)

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

## Properties

### account

• **account**: [`IExecAccountModule`](IExecAccountModule.md)

account module

___

### app

• **app**: [`IExecAppModule`](IExecAppModule.md)

app module

___

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

___

### dataset

• **dataset**: [`IExecDatasetModule`](IExecDatasetModule.md)

dataset module

___

### deal

• **deal**: [`IExecDealModule`](IExecDealModule.md)

deal module

___

### ens

• **ens**: [`IExecENSModule`](IExecENSModule.md)

ens module

___

### hub

• **hub**: [`IExecHubModule`](IExecHubModule.md)

hub module

___

### network

• **network**: [`IExecNetworkModule`](IExecNetworkModule.md)

network module

___

### order

• **order**: [`IExecOrderModule`](IExecOrderModule.md)

order module

___

### orderbook

• **orderbook**: [`IExecOrderbookModule`](IExecOrderbookModule.md)

orderbook module

___

### result

• **result**: [`IExecResultModule`](IExecResultModule.md)

result module

___

### secrets

• **secrets**: [`IExecSecretsModule`](IExecSecretsModule.md)

secrets module

___

### storage

• **storage**: [`IExecStorageModule`](IExecStorageModule.md)

storage module

___

### task

• **task**: [`IExecTaskModule`](IExecTaskModule.md)

task module

___

### wallet

• **wallet**: [`IExecWalletModule`](IExecWalletModule.md)

wallet module

___

### workerpool

• **workerpool**: [`IExecWorkerpoolModule`](IExecWorkerpoolModule.md)

workerpool module

## Methods

### fromConfig

▸ **fromConfig**(`config`): [`IExec`](IExec.md)

Create an IExec instance using an IExecConfig instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExec`](IExec.md)

#### Overrides

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)
