[iexec](../README.md) / [Exports](../modules.md) / IExecAppModule

# Class: IExecAppModule

module exposing app methods

## Hierarchy

- [`IExecModule`](IExecModule.md)

  ↳ **`IExecAppModule`**

## Table of contents

### Constructors

- [constructor](IExecAppModule.md#constructor)

### Properties

- [config](IExecAppModule.md#config)

### Methods

- [checkAppSecretExists](IExecAppModule.md#checkappsecretexists)
- [checkDeployedApp](IExecAppModule.md#checkdeployedapp)
- [countUserApps](IExecAppModule.md#countuserapps)
- [deployApp](IExecAppModule.md#deployapp)
- [predictAppAddress](IExecAppModule.md#predictappaddress)
- [pushAppSecret](IExecAppModule.md#pushappsecret)
- [showApp](IExecAppModule.md#showapp)
- [showUserApp](IExecAppModule.md#showuserapp)
- [fromConfig](IExecAppModule.md#fromconfig)

## Constructors

### constructor

• **new IExecAppModule**(`configOrArgs`, `options?`)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfigArgs`](../interfaces/internal_.IExecConfigArgs.md) \| [`IExecConfig`](IExecConfig.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/internal_.IExecConfigOptions.md) |

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

## Methods

### checkAppSecretExists

▸ **checkAppSecretExists**(`appAddress`): `Promise`<`boolean`\>

check if a secret exists for the app in the Secret Management Service

example:
```js
const isSecretSet = await checkAppSecretExists(appAddress);
console.log('app secret set:', isSecretSet);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `appAddress` | `string` |

#### Returns

`Promise`<`boolean`\>

___

### checkDeployedApp

▸ **checkDeployedApp**(`appAddress`): `Promise`<`Boolean`\>

check if an app is deployed at a given address

example:
```js
const isDeployed = await checkDeployedApp(address);
console.log('app deployed', isDeployed);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `appAddress` | `string` |

#### Returns

`Promise`<`Boolean`\>

___

### countUserApps

▸ **countUserApps**(`userAddress`): `Promise`<`BN`\>

count the apps owned by an address.

example:
```js
const count = await countUserApps(userAddress);
console.log('app count:', count);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `userAddress` | `string` |

#### Returns

`Promise`<`BN`\>

___

### deployApp

▸ **deployApp**(`app`): `Promise`<{ `address`: `string` ; `txHash`: `string`  }\>

**SIGNER REQUIRED**

deploy an app contract on the blockchain

example:
```js
const { address } = await deployApp({
 owner: address,
 name: 'My app',
 type: 'DOCKER',
 multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
 checksum: '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
});
console.log('deployed at', address);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `app` | [`AppDeploymentArgs`](../interfaces/internal_.AppDeploymentArgs.md) |

#### Returns

`Promise`<{ `address`: `string` ; `txHash`: `string`  }\>

___

### predictAppAddress

▸ **predictAppAddress**(`app`): `Promise`<`string`\>

predict the app contract address given the app deployment arguments

example:
```js
const address = await predictAppAddress({
 owner: address,
 name: 'My app',
 type: 'DOCKER',
 multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
 checksum: '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
});
console.log('address', address);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `app` | [`AppDeploymentArgs`](../interfaces/internal_.AppDeploymentArgs.md) |

#### Returns

`Promise`<`string`\>

___

### pushAppSecret

▸ **pushAppSecret**(`appAddress`, `secretValue`): `Promise`<`boolean`\>

**SIGNER REQUIRED, ONLY APP OWNER**

push an application secret to the Secret Management Service

_NB_:
- pushed secret will be available for the app in `tee` tasks.
- once pushed a secret can not be updated

example:
```js
const isPushed = await pushAppSecret(appAddress, "passw0rd");
console.log('pushed App secret:', isPushed);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `appAddress` | `string` |
| `secretValue` | `String` |

#### Returns

`Promise`<`boolean`\>

___

### showApp

▸ **showApp**(`appAddress`): `Promise`<{ `app`: [`App`](../interfaces/internal_.App.md) ; `objAddress`: `string`  }\>

show a deployed app details

example:
```js
const { app } = await showApp('0xb9b56f1c78f39504263835342e7affe96536d1ea');
console.log('app:', app);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `appAddress` | `string` |

#### Returns

`Promise`<{ `app`: [`App`](../interfaces/internal_.App.md) ; `objAddress`: `string`  }\>

___

### showUserApp

▸ **showUserApp**(`index`, `address`): `Promise`<{ `app`: [`App`](../interfaces/internal_.App.md) ; `objAddress`: `string`  }\>

show deployed app details by index for specified user user

example:
```js
const { app } = await showUserApp(0, userAddress);
console.log('app:', app);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `index` | [`BNish`](../modules/internal_.md#bnish) |
| `address` | `string` |

#### Returns

`Promise`<{ `app`: [`App`](../interfaces/internal_.App.md) ; `objAddress`: `string`  }\>

___

### fromConfig

▸ `Static` **fromConfig**(`config`): [`IExecAppModule`](IExecAppModule.md)

Create an IExecAppModule instance using an IExecConfig instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExecAppModule`](IExecAppModule.md)

#### Overrides

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)
