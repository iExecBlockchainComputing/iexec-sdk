[iexec](../README.md) / [Exports](../modules.md) / IExecModule

# Class: IExecModule

module base

## Hierarchy

- **`IExecModule`**

  ↳ [`IExec`](IExec.md)

  ↳ [`IExecAccountModule`](IExecAccountModule.md)

  ↳ [`IExecAppModule`](IExecAppModule.md)

  ↳ [`IExecDatasetModule`](IExecDatasetModule.md)

  ↳ [`IExecDealModule`](IExecDealModule.md)

  ↳ [`IExecENSModule`](IExecENSModule.md)

  ↳ [`IExecHubModule`](IExecHubModule.md)

  ↳ [`IExecNetworkModule`](IExecNetworkModule.md)

  ↳ [`IExecOrderModule`](IExecOrderModule.md)

  ↳ [`IExecOrderbookModule`](IExecOrderbookModule.md)

  ↳ [`IExecResultModule`](IExecResultModule.md)

  ↳ [`IExecStorageModule`](IExecStorageModule.md)

  ↳ [`IExecTaskModule`](IExecTaskModule.md)

  ↳ [`IExecWalletModule`](IExecWalletModule.md)

  ↳ [`IExecWorkerpoolModule`](IExecWorkerpoolModule.md)

## Table of contents

### Constructors

- [constructor](IExecModule.md#constructor)

### Properties

- [config](IExecModule.md#config)

### Methods

- [fromConfig](IExecModule.md#fromconfig)

## Constructors

### constructor

• **new IExecModule**(`configOrArgs`, `options?`)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/internal_.IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/internal_.IExecConfigOptions.md) |

#### Defined in

[src/lib/IExecModule.d.ts:13](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/7feaf0f/src/lib/IExecModule.d.ts#L13)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Defined in

[src/lib/IExecModule.d.ts:20](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/7feaf0f/src/lib/IExecModule.d.ts#L20)

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

#### Defined in

[src/lib/IExecModule.d.ts:24](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/7feaf0f/src/lib/IExecModule.d.ts#L24)
