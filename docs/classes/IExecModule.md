[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecModule

# Class: IExecModule

module base

## Extended by

- [`IExec`](IExec.md)
- [`IExecAccountModule`](IExecAccountModule.md)
- [`IExecAppModule`](IExecAppModule.md)
- [`IExecDatasetModule`](IExecDatasetModule.md)
- [`IExecDealModule`](IExecDealModule.md)
- [`IExecENSModule`](IExecENSModule.md)
- [`IExecHubModule`](IExecHubModule.md)
- [`IExecNetworkModule`](IExecNetworkModule.md)
- [`IExecOrderModule`](IExecOrderModule.md)
- [`IExecOrderbookModule`](IExecOrderbookModule.md)
- [`IExecResultModule`](IExecResultModule.md)
- [`IExecSecretsModule`](IExecSecretsModule.md)
- [`IExecStorageModule`](IExecStorageModule.md)
- [`IExecTaskModule`](IExecTaskModule.md)
- [`IExecWalletModule`](IExecWalletModule.md)
- [`IExecWorkerpoolModule`](IExecWorkerpoolModule.md)

## Constructors

### Constructor

> **new IExecModule**(`configOrArgs`, `options?`): `IExecModule`

Create an IExecModule instance

#### Parameters

##### configOrArgs

[`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) | [`IExecConfig`](IExecConfig.md)

##### options?

[`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)

#### Returns

`IExecModule`

## Properties

### config

> **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

## Methods

### fromConfig()

> `static` **fromConfig**(`config`): `IExecModule`

Create an IExecModule instance using an IExecConfig instance

#### Parameters

##### config

[`IExecConfig`](IExecConfig.md)

#### Returns

`IExecModule`
