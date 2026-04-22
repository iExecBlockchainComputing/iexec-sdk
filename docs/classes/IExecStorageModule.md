[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecStorageModule

# Class: IExecStorageModule

module exposing storage methods

## Extends

- [`IExecModule`](IExecModule.md)

## Constructors

### Constructor

> **new IExecStorageModule**(`configOrArgs`, `options?`): `IExecStorageModule`

Create an IExecModule instance

#### Parameters

##### configOrArgs

[`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) | [`IExecConfig`](IExecConfig.md)

##### options?

[`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)

#### Returns

`IExecStorageModule`

#### Inherited from

[`IExecModule`](IExecModule.md).[`constructor`](IExecModule.md#constructor)

## Properties

### config

> **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[`IExecModule`](IExecModule.md).[`config`](IExecModule.md#config)

## Methods

### checkStorageTokenExists()

> **checkStorageTokenExists**(`beneficiaryAddress`, `storageProvider`): `Promise`\<`boolean`\>

check if a storage access token exists for the beneficiary in the Secret Management Service

_NB_: currently only 'dropbox' storage provider authentication is supported.

example:
```js
const isStorageInitialized = await checkStorageTokenExists(userAddress, 'dropbox');
console.log('Dropbox storage initialized:', isStorageInitialized);
```

#### Parameters

##### beneficiaryAddress

`string`

##### storageProvider

`string`

#### Returns

`Promise`\<`boolean`\>

***

### pushStorageToken()

> **pushStorageToken**(`token`, `storageProvider`, `options?`): `Promise`\<\{ `isPushed`: `boolean`; `isUpdated`: `boolean`; \}\>

**SIGNER REQUIRED, ONLY BENEFICIARY**

push a storage access token to the Secret Management Service to allow result archive upload
supported storage provider 'dropbox'.

_NB_:
- currently only 'dropbox' storage provider authentication is supported.
- this method will throw an error if a token already exists for the target storage provider in the Secret Management Service unless the option `forceUpdate: true` is used.

example:
- init Dropbox storage
```js
const { isPushed } = await pushStorageToken(dropboxApiToken, 'dropbox');
console.log('Dropbox storage initialized:', isPushed);
```

#### Parameters

##### token

`string`

##### storageProvider

`string`

##### options?

###### forceUpdate?

`boolean`

#### Returns

`Promise`\<\{ `isPushed`: `boolean`; `isUpdated`: `boolean`; \}\>

***

### fromConfig()

> `static` **fromConfig**(`config`): `IExecStorageModule`

Create an IExecStorageModule instance using an IExecConfig instance

#### Parameters

##### config

[`IExecConfig`](IExecConfig.md)

#### Returns

`IExecStorageModule`

#### Overrides

[`IExecModule`](IExecModule.md).[`fromConfig`](IExecModule.md#fromconfig)
