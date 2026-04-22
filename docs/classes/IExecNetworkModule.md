[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecNetworkModule

# Class: IExecNetworkModule

module exposing network methods

## Extends

- [`IExecModule`](IExecModule.md)

## Constructors

### Constructor

> **new IExecNetworkModule**(`configOrArgs`, `options?`): `IExecNetworkModule`

Create an IExecModule instance

#### Parameters

##### configOrArgs

[`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) | [`IExecConfig`](IExecConfig.md)

##### options?

[`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)

#### Returns

`IExecNetworkModule`

#### Inherited from

[`IExecModule`](IExecModule.md).[`constructor`](IExecModule.md#constructor)

## Properties

### config

> **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[`IExecModule`](IExecModule.md).[`config`](IExecModule.md#config)

## Methods

### getNetwork()

> **getNetwork**(): `Promise`\<\{ `chainId`: `string`; \}\>

get info about the current iExec network

example:
```js
const { chainId } = await getNetwork();
console.log(`working on chain ${chainId}`);
```

#### Returns

`Promise`\<\{ `chainId`: `string`; \}\>

***

### fromConfig()

> `static` **fromConfig**(`config`): `IExecNetworkModule`

Create an IExecNetworkModule instance using an IExecConfig instance

#### Parameters

##### config

[`IExecConfig`](IExecConfig.md)

#### Returns

`IExecNetworkModule`

#### Overrides

[`IExecModule`](IExecModule.md).[`fromConfig`](IExecModule.md#fromconfig)
