[iexec](../README.md) / [Exports](../modules.md) / IExecWorkerpoolModule

# Class: IExecWorkerpoolModule

module exposing workerpool methods

## Hierarchy

- [`IExecModule`](IExecModule.md)

  ↳ **`IExecWorkerpoolModule`**

## Table of contents

### Constructors

- [constructor](IExecWorkerpoolModule.md#constructor)

### Properties

- [config](IExecWorkerpoolModule.md#config)

### Methods

- [checkDeployedWorkerpool](IExecWorkerpoolModule.md#checkdeployedworkerpool)
- [countUserWorkerpools](IExecWorkerpoolModule.md#countuserworkerpools)
- [deployWorkerpool](IExecWorkerpoolModule.md#deployworkerpool)
- [getWorkerpoolApiUrl](IExecWorkerpoolModule.md#getworkerpoolapiurl)
- [predictWorkerpoolAddress](IExecWorkerpoolModule.md#predictworkerpooladdress)
- [setWorkerpoolApiUrl](IExecWorkerpoolModule.md#setworkerpoolapiurl)
- [showUserWorkerpool](IExecWorkerpoolModule.md#showuserworkerpool)
- [showWorkerpool](IExecWorkerpoolModule.md#showworkerpool)
- [transferWorkerpool](IExecWorkerpoolModule.md#transferworkerpool)
- [fromConfig](IExecWorkerpoolModule.md#fromconfig)

## Constructors

### constructor

• **new IExecWorkerpoolModule**(`configOrArgs`, `options?`): [`IExecWorkerpoolModule`](IExecWorkerpoolModule.md)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/IExecConfigOptions.md) |

#### Returns

[`IExecWorkerpoolModule`](IExecWorkerpoolModule.md)

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

## Methods

### checkDeployedWorkerpool

▸ **checkDeployedWorkerpool**(`workerpoolAddress`): `Promise`<`Boolean`\>

check if an workerpool is deployed at a given address

example:
```js
const isDeployed = await checkDeployedWorkerpool(address);
console.log('workerpool deployed', isDeployed);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `workerpoolAddress` | `string` |

#### Returns

`Promise`<`Boolean`\>

___

### countUserWorkerpools

▸ **countUserWorkerpools**(`userAddress`): `Promise`<[`BN`](utils.BN.md)\>

count the workerpools owned by an address.

example:
```js
const count = await countUserWorkerpools(userAddress);
console.log('workerpool count:', count);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `userAddress` | `string` |

#### Returns

`Promise`<[`BN`](utils.BN.md)\>

___

### deployWorkerpool

▸ **deployWorkerpool**(`workerpool`): `Promise`<{ `address`: `string` ; `txHash`: `string`  }\>

**SIGNER REQUIRED**

deploy a workerpool contract on the blockchain

example:
```js
const { address } = await deployWorkerpool({
 owner: address,
 description: 'My workerpool',
});
console.log('deployed at', address);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `workerpool` | [`WorkerpoolDeploymentArgs`](../interfaces/internal_.WorkerpoolDeploymentArgs.md) |

#### Returns

`Promise`<{ `address`: `string` ; `txHash`: `string`  }\>

___

### getWorkerpoolApiUrl

▸ **getWorkerpoolApiUrl**(`workerpoolAddress`, `url`): `Promise`<`string`\>

read the workerpool API url on the blockchain

_NB_: resolve to `undefined` if the workerpool API url was not declared.

example:
```js
const url = await getWorkerpoolApiUrl('my-workerpool.eth', 'my-workerpool.com');
console.log('workerpool API url:', url);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `workerpoolAddress` | `string` |
| `url` | `string` |

#### Returns

`Promise`<`string`\>

___

### predictWorkerpoolAddress

▸ **predictWorkerpoolAddress**(`workerpool`): `Promise`<`string`\>

predict the workerpool contract address given the workerpool deployment arguments

example:
```js
const address = await predictWorkerpoolAddress({
 owner: address,
 description: 'My workerpool',
});
console.log('address', address);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `workerpool` | [`WorkerpoolDeploymentArgs`](../interfaces/internal_.WorkerpoolDeploymentArgs.md) |

#### Returns

`Promise`<`string`\>

___

### setWorkerpoolApiUrl

▸ **setWorkerpoolApiUrl**(`workerpoolAddress`, `url`): `Promise`<`string`\>

**ONLY WORKERPOOL ENS NAME OWNER**

declare the workerpool API url on the blockchain

_NB_: declaring the workerpool API url require an ENS name with a configured reverse resolution on the workerpool address (see: IExecENSModule obsConfigureResolution/configureResolution)

example:
```js
const txHash = await setWorkerpoolApiUrl('my-workerpool.eth', 'my-workerpool.com');
console.log('txHash:', txHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `workerpoolAddress` | `string` |
| `url` | `string` |

#### Returns

`Promise`<`string`\>

___

### showUserWorkerpool

▸ **showUserWorkerpool**(`index`, `address`): `Promise`<{ `objAddress`: `string` ; `workerpool`: [`Workerpool`](../interfaces/internal_.Workerpool.md)  }\>

show deployed workerpool details by index for specified user user

example:
```js
const { workerpool } = await showUserWorkerpool(0, userAddress);
console.log('workerpool:', workerpool);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `index` | [`BNish`](../modules.md#bnish) |
| `address` | `string` |

#### Returns

`Promise`<{ `objAddress`: `string` ; `workerpool`: [`Workerpool`](../interfaces/internal_.Workerpool.md)  }\>

___

### showWorkerpool

▸ **showWorkerpool**(`workerpoolAddress`): `Promise`<{ `objAddress`: `string` ; `workerpool`: [`Workerpool`](../interfaces/internal_.Workerpool.md)  }\>

show a deployed workerpool details

example:
```js
const { workerpool } = await showWorkerpool('0x86F2102532d9d01DA8084c96c1D1Bdb90e12Bf07');
console.log('workerpool:', workerpool);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `workerpoolAddress` | `string` |

#### Returns

`Promise`<{ `objAddress`: `string` ; `workerpool`: [`Workerpool`](../interfaces/internal_.Workerpool.md)  }\>

___

### transferWorkerpool

▸ **transferWorkerpool**(`workerpoolAddress`, `to`): `Promise`<{ `address`: `string` ; `to`: `string` ; `txHash`: `string`  }\>

**ONLY WORKERPOOL OWNER**

transfer the ownership of a workerpool to the specified address

_NB_: when transferring the ownership to a contract, the receiver contract must implement the ERC721 token receiver interface

example:
```js
const { address, to, txHash } = await transferWorkerpool(workerpoolAddress, receiverAddress);
console.log(`workerpool ${address} ownership transferred to ${address} in tx ${txHash}`);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `workerpoolAddress` | `string` |
| `to` | `string` |

#### Returns

`Promise`<{ `address`: `string` ; `to`: `string` ; `txHash`: `string`  }\>

___

### fromConfig

▸ **fromConfig**(`config`): [`IExecWorkerpoolModule`](IExecWorkerpoolModule.md)

Create an IExecWorkerpoolModule instance using an IExecConfig instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExecWorkerpoolModule`](IExecWorkerpoolModule.md)

#### Overrides

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)
