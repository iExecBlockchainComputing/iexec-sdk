[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecAppModule

# Class: IExecAppModule

module exposing app methods

## Extends

- [`IExecModule`](IExecModule.md)

## Constructors

### Constructor

> **new IExecAppModule**(`configOrArgs`, `options?`): `IExecAppModule`

Create an IExecModule instance

#### Parameters

##### configOrArgs

[`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) | [`IExecConfig`](IExecConfig.md)

##### options?

[`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)

#### Returns

`IExecAppModule`

#### Inherited from

[`IExecModule`](IExecModule.md).[`constructor`](IExecModule.md#constructor)

## Properties

### config

> **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[`IExecModule`](IExecModule.md).[`config`](IExecModule.md#config)

## Methods

### checkAppSecretExists()

> **checkAppSecretExists**(`appAddress`): `Promise`\<`boolean`\>

check if a secret exists for the app in the Secret Management Service

example:
```js
const isSecretSet = await checkAppSecretExists(appAddress);
console.log('app secret set:', isSecretSet);
```
_NB_:
- each TEE framework comes with a distinct Secret Management Service, if not specified the TEE framework is inferred from the app

#### Parameters

##### appAddress

`string`

#### Returns

`Promise`\<`boolean`\>

***

### checkDeployedApp()

> **checkDeployedApp**(`appAddress`): `Promise`\<`Boolean`\>

check if an app is deployed at a given address

example:
```js
const isDeployed = await checkDeployedApp(address);
console.log('app deployed', isDeployed);
```

#### Parameters

##### appAddress

`string`

#### Returns

`Promise`\<`Boolean`\>

***

### countUserApps()

> **countUserApps**(`userAddress`): `Promise`\<[`BN`](../interfaces/BN.md)\>

count the apps owned by an address.

example:
```js
const count = await countUserApps(userAddress);
console.log('app count:', count);
```

#### Parameters

##### userAddress

`string`

#### Returns

`Promise`\<[`BN`](../interfaces/BN.md)\>

***

### deployApp()

> **deployApp**(`app`): `Promise`\<\{ `address`: `string`; `txHash`: `string`; \}\>

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

##### app

[`AppDeploymentArgs`](../-internal-/interfaces/AppDeploymentArgs.md)

#### Returns

`Promise`\<\{ `address`: `string`; `txHash`: `string`; \}\>

***

### predictAppAddress()

> **predictAppAddress**(`app`): `Promise`\<`string`\>

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

##### app

[`AppDeploymentArgs`](../-internal-/interfaces/AppDeploymentArgs.md)

#### Returns

`Promise`\<`string`\>

***

### pushAppSecret()

> **pushAppSecret**(`appAddress`, `secretValue`): `Promise`\<`boolean`\>

**SIGNER REQUIRED, ONLY APP OWNER**

push an application secret to the Secret Management Service

_NB_:
- pushed secret will be available for the app in `tee` tasks.
- once pushed a secret can not be updated
- each TEE framework comes with a distinct Secret Management Service, if not specified the TEE framework is inferred from the app

example:
```js
const isPushed = await pushAppSecret(appAddress, "passw0rd");
console.log('pushed App secret:', isPushed);
```

#### Parameters

##### appAddress

`string`

##### secretValue

`String`

#### Returns

`Promise`\<`boolean`\>

***

### showApp()

> **showApp**(`appAddress`): `Promise`\<\{ `app`: [`App`](../-internal-/interfaces/App.md); `objAddress`: `string`; \}\>

show a deployed app details

example:
```js
const { app } = await showApp('0xb9b56f1c78f39504263835342e7affe96536d1ea');
console.log('app:', app);
```

#### Parameters

##### appAddress

`string`

#### Returns

`Promise`\<\{ `app`: [`App`](../-internal-/interfaces/App.md); `objAddress`: `string`; \}\>

***

### showUserApp()

> **showUserApp**(`index`, `address`): `Promise`\<\{ `app`: [`App`](../-internal-/interfaces/App.md); `objAddress`: `string`; \}\>

show deployed app details by index for specified user user

example:
```js
const { app } = await showUserApp(0, userAddress);
console.log('app:', app);
```

#### Parameters

##### index

[`BNish`](../type-aliases/BNish.md)

##### address

`string`

#### Returns

`Promise`\<\{ `app`: [`App`](../-internal-/interfaces/App.md); `objAddress`: `string`; \}\>

***

### transferApp()

> **transferApp**(`appAddress`, `to`): `Promise`\<\{ `address`: `string`; `to`: `string`; `txHash`: `string`; \}\>

**ONLY APP OWNER**

transfer the ownership of an app to the specified address

_NB_: when transferring the ownership to a contract, the receiver contract must implement the ERC721 token receiver interface

example:
```js
const { address, to, txHash } = await transferApp(appAddress, receiverAddress);
console.log(`app ${address} ownership transferred to ${address} in tx ${txHash}`);
```

#### Parameters

##### appAddress

`string`

##### to

`string`

#### Returns

`Promise`\<\{ `address`: `string`; `to`: `string`; `txHash`: `string`; \}\>

***

### fromConfig()

> `static` **fromConfig**(`config`): `IExecAppModule`

Create an IExecAppModule instance using an IExecConfig instance

#### Parameters

##### config

[`IExecConfig`](IExecConfig.md)

#### Returns

`IExecAppModule`

#### Overrides

[`IExecModule`](IExecModule.md).[`fromConfig`](IExecModule.md#fromconfig)
