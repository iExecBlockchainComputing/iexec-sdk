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

> **checkStorageTokenExists**(`beneficiaryAddress`, `options?`): `Promise`\<`boolean`\>

check if a storage token exists for the beneficiary in the Secret Management Service

_NB_: specify the storage provider with the option `provider` (supported values `'ipfs'`|`'dropbox'` default `'ipfs'`)

example:
```js
const isIpfsStorageInitialized = await checkStorageTokenExists(userAddress);
console.log('IPFS storage initialized:', isIpfsStorageInitialized);
```

#### Parameters

##### beneficiaryAddress

`string`

##### options?

###### provider?

`string`

###### teeFramework?

[`TeeFramework`](../type-aliases/TeeFramework.md)

#### Returns

`Promise`\<`boolean`\>

***

### defaultStorageLogin()

> **defaultStorageLogin**(): `Promise`\<`string`\>

**SIGNER REQUIRED, ONLY BENEFICIARY**

get an authorization token from the default IPFS based remote storage

example:
```js
const token = await defaultStorageLogin();
const { isPushed } = await pushStorageToken(token);
console.log('default storage initialized:', isPushed);
```

#### Returns

`Promise`\<`string`\>

***

### pushStorageToken()

> **pushStorageToken**(`token`, `options?`): `Promise`\<\{ `isPushed`: `boolean`; `isUpdated`: `boolean`; \}\>

**SIGNER REQUIRED, ONLY BENEFICIARY**

push a personal storage token to the Secret Management Service to allow result archive upload

_NB_:
- specify the storage provider with the option `provider` (supported values `'ipfs'`|`'dropbox'` default `'ipfs'`)
- this method will throw an error if a token already exists for the target storage provider in the Secret Management Service unless the option `forceUpdate: true` is used.

example:
- init default storage
```js
const token = await defaultStorageLogin();
const { isPushed } = await pushStorageToken(token);
console.log('default storage initialized:', isPushed);
```
- init dropbox storage
```js
const { isPushed } = await pushStorageToken(dropboxApiToken, {provider: 'dropbox'});
console.log('dropbox storage initialized:', isPushed);
```

#### Parameters

##### token

`string`

##### options?

###### forceUpdate?

`boolean`

###### provider?

`string`

###### teeFramework?

[`TeeFramework`](../type-aliases/TeeFramework.md)

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
