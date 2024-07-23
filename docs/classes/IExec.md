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
- [voucher](IExec.md#voucher)
- [wallet](IExec.md#wallet)
- [workerpool](IExec.md#workerpool)

### Methods

- [fromConfig](IExec.md#fromconfig)

## Constructors

### constructor

• **new IExec**(`configOrArgs`, `options?`): [`IExec`](IExec.md)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name           | Type                                                                                     |
| :------------- | :--------------------------------------------------------------------------------------- |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) |
| `options?`     | [`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)                              |

#### Returns

[`IExec`](IExec.md)

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

## Properties

### account

• **account**: [`IExecAccountModule`](IExecAccountModule.md)

account module

---

### app

• **app**: [`IExecAppModule`](IExecAppModule.md)

app module

---

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

---

### dataset

• **dataset**: [`IExecDatasetModule`](IExecDatasetModule.md)

dataset module

---

### deal

• **deal**: [`IExecDealModule`](IExecDealModule.md)

deal module

---

### ens

• **ens**: [`IExecENSModule`](IExecENSModule.md)

ens module

---

### hub

• **hub**: [`IExecHubModule`](IExecHubModule.md)

hub module

---

### network

• **network**: [`IExecNetworkModule`](IExecNetworkModule.md)

network module

---

### order

• **order**: [`IExecOrderModule`](IExecOrderModule.md)

order module

---

### orderbook

• **orderbook**: [`IExecOrderbookModule`](IExecOrderbookModule.md)

orderbook module

---

### result

• **result**: [`IExecResultModule`](IExecResultModule.md)

result module

---

### secrets

• **secrets**: [`IExecSecretsModule`](IExecSecretsModule.md)

secrets module

---

### storage

• **storage**: [`IExecStorageModule`](IExecStorageModule.md)

storage module

---

### task

• **task**: [`IExecTaskModule`](IExecTaskModule.md)

task module

---

### voucher

• **voucher**: [`IExecVoucherModule`](internal_.IExecVoucherModule.md)

voucher module

---

### wallet

• **wallet**: [`IExecWalletModule`](IExecWalletModule.md)

wallet module

---

### workerpool

• **workerpool**: [`IExecWorkerpoolModule`](IExecWorkerpoolModule.md)

workerpool module

## Methods

### fromConfig

▸ **fromConfig**(`config`): [`IExec`](IExec.md)

Create an IExec instance using an IExecConfig instance

#### Parameters

| Name     | Type                            |
| :------- | :------------------------------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExec`](IExec.md)

#### Overrides

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)
