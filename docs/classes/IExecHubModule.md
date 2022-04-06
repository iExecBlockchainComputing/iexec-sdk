[iexec](../README.md) / [Exports](../modules.md) / IExecHubModule

# Class: IExecHubModule

module exposing hub methods

## Hierarchy

- [`IExecModule`](IExecModule.md)

  ↳ **`IExecHubModule`**

## Table of contents

### Constructors

- [constructor](IExecHubModule.md#constructor)

### Properties

- [config](IExecHubModule.md#config)

### Methods

- [countCategory](IExecHubModule.md#countcategory)
- [createCategory](IExecHubModule.md#createcategory)
- [getTimeoutRatio](IExecHubModule.md#gettimeoutratio)
- [showCategory](IExecHubModule.md#showcategory)
- [fromConfig](IExecHubModule.md#fromconfig)

## Constructors

### constructor

• **new IExecHubModule**(`configOrArgs`, `options?`)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/internal_.IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/internal_.IExecConfigOptions.md) |

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

#### Defined in

[src/lib/IExecModule.d.ts:13](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/4161173/src/lib/IExecModule.d.ts#L13)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

#### Defined in

[src/lib/IExecModule.d.ts:20](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/4161173/src/lib/IExecModule.d.ts#L20)

## Methods

### countCategory

▸ **countCategory**(): `Promise`<`BN`\>

count the created categories.

example:
```js
const count = await countCategory();
console.log('category count:', count);
```

#### Returns

`Promise`<`BN`\>

#### Defined in

[src/lib/IExecHubModule.d.ts:65](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/4161173/src/lib/IExecHubModule.d.ts#L65)

___

### createCategory

▸ **createCategory**(`category`): `Promise`<{ `catid`: `BN` ; `txHash`: `string`  }\>

**ONLY IEXEC OWNER**

create a computation category on the iExec contract

example:
```js
const { catid } = await createCategory({
 name: 'Small',
 description: '5 min',
 workClockTimeRef: 300,
});
console.log('deployed with catid', catid);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `category` | `Object` |
| `category.description` | `string` |
| `category.name` | `string` |
| `category.workClockTimeRef` | [`BNish`](../modules/internal_.md#bnish) |

#### Returns

`Promise`<{ `catid`: `BN` ; `txHash`: `string`  }\>

#### Defined in

[src/lib/IExecHubModule.d.ts:41](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/4161173/src/lib/IExecHubModule.d.ts#L41)

___

### getTimeoutRatio

▸ **getTimeoutRatio**(): `Promise`<`BN`\>

get the current `TimoutRatio`

`TimoutRatio` is used with the category `workClockTimeRef` to determine the tasks duration (task max duration = TimoutRatio * workClockTimeRef)

example:
```js
const timoutRatio = await getTimeoutRatio();
console.log('timoutRatio:', timoutRatio);
```

#### Returns

`Promise`<`BN`\>

#### Defined in

[src/lib/IExecHubModule.d.ts:77](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/4161173/src/lib/IExecHubModule.d.ts#L77)

___

### showCategory

▸ **showCategory**(`catid`): `Promise`<[`Category`](../interfaces/internal_.Category.md)\>

show category with specified catid.

example:
```js
const category = await showCategory(0);
console.log('category:', category);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `catid` | [`BNish`](../modules/internal_.md#bnish) |

#### Returns

`Promise`<[`Category`](../interfaces/internal_.Category.md)\>

#### Defined in

[src/lib/IExecHubModule.d.ts:55](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/4161173/src/lib/IExecHubModule.d.ts#L55)

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

[src/lib/IExecModule.d.ts:24](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/4161173/src/lib/IExecModule.d.ts#L24)
