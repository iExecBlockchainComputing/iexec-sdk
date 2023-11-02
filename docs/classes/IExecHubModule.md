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

• **new IExecHubModule**(`configOrArgs`, `options?`): [`IExecHubModule`](IExecHubModule.md)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/internal_.IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/internal_.IExecConfigOptions.md) |

#### Returns

[`IExecHubModule`](IExecHubModule.md)

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

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

___

### createCategory

▸ **createCategory**(`category`): `Promise`<{ `catid`: `BN` ; `txHash`: `string`  }\>

**SIGNER REQUIRED, ONLY IEXEC OWNER**

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
| `category.workClockTimeRef` | [`BNish`](../modules.md#bnish) |

#### Returns

`Promise`<{ `catid`: `BN` ; `txHash`: `string`  }\>

___

### getTimeoutRatio

▸ **getTimeoutRatio**(): `Promise`<`BN`\>

get the current `TimeoutRatio`

`TimeoutRatio` is used with the category `workClockTimeRef` to determine the tasks duration (task max duration = TimeoutRatio * workClockTimeRef)

example:
```js
const timeoutRatio = await getTimeoutRatio();
console.log('timeoutRatio:', timeoutRatio);
```

#### Returns

`Promise`<`BN`\>

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
| `catid` | [`BNish`](../modules.md#bnish) |

#### Returns

`Promise`<[`Category`](../interfaces/internal_.Category.md)\>

___

### fromConfig

▸ **fromConfig**(`config`): [`IExecHubModule`](IExecHubModule.md)

Create an IExecHubModule instance using an IExecConfig instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExecHubModule`](IExecHubModule.md)

#### Overrides

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)
