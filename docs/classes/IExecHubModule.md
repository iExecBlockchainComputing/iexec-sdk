[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecHubModule

# Class: IExecHubModule

module exposing hub methods

## Extends

- [`IExecModule`](IExecModule.md)

## Constructors

### Constructor

> **new IExecHubModule**(`configOrArgs`, `options?`): `IExecHubModule`

Create an IExecModule instance

#### Parameters

##### configOrArgs

[`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) | [`IExecConfig`](IExecConfig.md)

##### options?

[`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)

#### Returns

`IExecHubModule`

#### Inherited from

[`IExecModule`](IExecModule.md).[`constructor`](IExecModule.md#constructor)

## Properties

### config

> **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[`IExecModule`](IExecModule.md).[`config`](IExecModule.md#config)

## Methods

### countCategory()

> **countCategory**(): `Promise`\<[`BN`](../interfaces/BN.md)\>

count the created categories.

example:
```js
const count = await countCategory();
console.log('category count:', count);
```

#### Returns

`Promise`\<[`BN`](../interfaces/BN.md)\>

***

### createCategory()

> **createCategory**(`category`): `Promise`\<\{ `catid`: [`BN`](../interfaces/BN.md); `txHash`: `string`; \}\>

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

##### category

###### description

`string`

###### name

`string`

###### workClockTimeRef

[`BNish`](../type-aliases/BNish.md)

#### Returns

`Promise`\<\{ `catid`: [`BN`](../interfaces/BN.md); `txHash`: `string`; \}\>

***

### getTimeoutRatio()

> **getTimeoutRatio**(): `Promise`\<[`BN`](../interfaces/BN.md)\>

get the current `TimeoutRatio`

`TimeoutRatio` is used with the category `workClockTimeRef` to determine the tasks duration (task max duration = TimeoutRatio * workClockTimeRef)

example:
```js
const timeoutRatio = await getTimeoutRatio();
console.log('timeoutRatio:', timeoutRatio);
```

#### Returns

`Promise`\<[`BN`](../interfaces/BN.md)\>

***

### showCategory()

> **showCategory**(`catid`): `Promise`\<[`Category`](../-internal-/interfaces/Category.md)\>

show category with specified catid.

example:
```js
const category = await showCategory(0);
console.log('category:', category);
```

#### Parameters

##### catid

[`BNish`](../type-aliases/BNish.md)

#### Returns

`Promise`\<[`Category`](../-internal-/interfaces/Category.md)\>

***

### fromConfig()

> `static` **fromConfig**(`config`): `IExecHubModule`

Create an IExecHubModule instance using an IExecConfig instance

#### Parameters

##### config

[`IExecConfig`](IExecConfig.md)

#### Returns

`IExecHubModule`

#### Overrides

[`IExecModule`](IExecModule.md).[`fromConfig`](IExecModule.md#fromconfig)
