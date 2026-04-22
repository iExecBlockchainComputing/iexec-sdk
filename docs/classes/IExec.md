[**iexec**](../README.md)

***

[iexec](../globals.md) / IExec

# Class: IExec

module exposing all the iExec SDK modules

## Extends

- [`IExecModule`](IExecModule.md)

## Constructors

### Constructor

> **new IExec**(`configOrArgs`, `options?`): `IExec`

Create an IExecModule instance

#### Parameters

##### configOrArgs

[`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) | [`IExecConfig`](IExecConfig.md)

##### options?

[`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)

#### Returns

`IExec`

#### Inherited from

[`IExecModule`](IExecModule.md).[`constructor`](IExecModule.md#constructor)

## Properties

### account

> **account**: [`IExecAccountModule`](IExecAccountModule.md)

account module

***

### app

> **app**: [`IExecAppModule`](IExecAppModule.md)

app module

***

### config

> **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[`IExecModule`](IExecModule.md).[`config`](IExecModule.md#config)

***

### dataset

> **dataset**: [`IExecDatasetModule`](IExecDatasetModule.md)

dataset module

***

### deal

> **deal**: [`IExecDealModule`](IExecDealModule.md)

deal module

***

### ens

> **ens**: [`IExecENSModule`](IExecENSModule.md)

ens module

***

### hub

> **hub**: [`IExecHubModule`](IExecHubModule.md)

hub module

***

### network

> **network**: [`IExecNetworkModule`](IExecNetworkModule.md)

network module

***

### order

> **order**: [`IExecOrderModule`](IExecOrderModule.md)

order module

***

### orderbook

> **orderbook**: [`IExecOrderbookModule`](IExecOrderbookModule.md)

orderbook module

***

### result

> **result**: [`IExecResultModule`](IExecResultModule.md)

result module

***

### secrets

> **secrets**: [`IExecSecretsModule`](IExecSecretsModule.md)

secrets module

***

### storage

> **storage**: [`IExecStorageModule`](IExecStorageModule.md)

storage module

***

### task

> **task**: [`IExecTaskModule`](IExecTaskModule.md)

task module

***

### wallet

> **wallet**: [`IExecWalletModule`](IExecWalletModule.md)

wallet module

***

### workerpool

> **workerpool**: [`IExecWorkerpoolModule`](IExecWorkerpoolModule.md)

workerpool module

## Methods

### fromConfig()

> `static` **fromConfig**(`config`): `IExec`

Create an IExec instance using an IExecConfig instance

#### Parameters

##### config

[`IExecConfig`](IExecConfig.md)

#### Returns

`IExec`

#### Overrides

[`IExecModule`](IExecModule.md).[`fromConfig`](IExecModule.md#fromconfig)
