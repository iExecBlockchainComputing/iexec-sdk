[iexec](../README.md) / [Exports](../modules.md) / IExecStorageModule

# Class: IExecStorageModule

module exposing storage methods

## Hierarchy

- [`IExecModule`](IExecModule.md)

  ↳ **`IExecStorageModule`**

## Table of contents

### Constructors

- [constructor](IExecStorageModule.md#constructor)

### Properties

- [config](IExecStorageModule.md#config)

### Methods

- [checkStorageTokenExists](IExecStorageModule.md#checkstoragetokenexists)
- [defaultStorageLogin](IExecStorageModule.md#defaultstoragelogin)
- [pushStorageToken](IExecStorageModule.md#pushstoragetoken)
- [fromConfig](IExecStorageModule.md#fromconfig)

## Constructors

### constructor

• **new IExecStorageModule**(`configOrArgs`, `options?`)

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

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

#### Defined in

[src/lib/IExecModule.d.ts:20](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExecModule.d.ts#L20)

## Methods

### checkStorageTokenExists

▸ **checkStorageTokenExists**(`beneficiaryAddress`, `options?`): `Promise`<`boolean`\>

check if a storage token exists for the beneficiary in the Secret Management Service

_NB_: specify the storage provider with the option `provider` (supported values `'ipfs'`|`'dropbox'` default `'ipfs'`)

example:
```js
const isIpfsStorageInitialized = await checkStorageTokenExists(userAddress);
console.log('IPFS storage initialized:', isIpfsStorageInitialized);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `beneficiaryAddress` | `string` |
| `options?` | `Object` |
| `options.provider?` | `string` |

#### Returns

`Promise`<`boolean`\>

#### Defined in

[src/lib/IExecStorageModule.d.ts:19](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExecStorageModule.d.ts#L19)

___

### defaultStorageLogin

▸ **defaultStorageLogin**(): `Promise`<`string`\>

**ONLY BENEFICIARY**

get an authorization token from the default IPFS based remote storage

example:
```js
const token = await defaultStorageLogin();
const { isPushed } = await pushStorageToken(token);
console.log('default storage initialized:', isPushed);
```

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecStorageModule.d.ts:37](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExecStorageModule.d.ts#L37)

___

### pushStorageToken

▸ **pushStorageToken**(`token`, `options?`): `Promise`<{ `isPushed`: `boolean` ; `isUpdated`: `boolean`  }\>

**ONLY BENEFICIARY**

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

| Name | Type |
| :------ | :------ |
| `token` | `string` |
| `options?` | `Object` |
| `options.forceUpdate?` | `boolean` |
| `options.provider?` | `string` |

#### Returns

`Promise`<{ `isPushed`: `boolean` ; `isUpdated`: `boolean`  }\>

#### Defined in

[src/lib/IExecStorageModule.d.ts:60](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExecStorageModule.d.ts#L60)

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

[src/lib/IExecModule.d.ts:24](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/IExecModule.d.ts#L24)
