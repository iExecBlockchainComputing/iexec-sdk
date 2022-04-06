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

- [countUserWorkerpools](IExecWorkerpoolModule.md#countuserworkerpools)
- [deployWorkerpool](IExecWorkerpoolModule.md#deployworkerpool)
- [showUserWorkerpool](IExecWorkerpoolModule.md#showuserworkerpool)
- [showWorkerpool](IExecWorkerpoolModule.md#showworkerpool)
- [fromConfig](IExecWorkerpoolModule.md#fromconfig)

## Constructors

### constructor

• **new IExecWorkerpoolModule**(`configOrArgs`, `options?`)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/internal_.IExecConfigArgs.md) |
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

### countUserWorkerpools

▸ **countUserWorkerpools**(`userAddress`): `Promise`<`BN`\>

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

`Promise`<`BN`\>

___

### deployWorkerpool

▸ **deployWorkerpool**(`workerpool`): `Promise`<{ `address`: `string` ; `txHash`: `string`  }\>

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

| Name | Type | Description |
| :------ | :------ | :------ |
| `workerpool` | `Object` | - |
| `workerpool.description` | `string` | a description for the workerpool |
| `workerpool.owner` | `string` | the workerpool owner |

#### Returns

`Promise`<{ `address`: `string` ; `txHash`: `string`  }\>

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
| `index` | [`BNish`](../modules/internal_.md#bnish) |
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
