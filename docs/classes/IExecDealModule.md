[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecDealModule

# Class: IExecDealModule

module exposing deal methods

## Extends

- [`IExecModule`](IExecModule.md)

## Constructors

### Constructor

> **new IExecDealModule**(`configOrArgs`, `options?`): `IExecDealModule`

Create an IExecModule instance

#### Parameters

##### configOrArgs

[`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) | [`IExecConfig`](IExecConfig.md)

##### options?

[`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)

#### Returns

`IExecDealModule`

#### Inherited from

[`IExecModule`](IExecModule.md).[`constructor`](IExecModule.md#constructor)

## Properties

### config

> **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[`IExecModule`](IExecModule.md).[`config`](IExecModule.md#config)

## Methods

### claim()

> **claim**(`dealid`): `Promise`\<\{ `claimed`: `Record`\<[`TaskIndex`](../type-aliases/TaskIndex.md), [`Taskid`](../type-aliases/Taskid.md)\>; `transactions`: `object`[]; \}\>

**SIGNER REQUIRED**

claim all the failed task from a deal

depending the number and the status of task to claim, this may involve several transactions in order to fit in the blockchain gasLimit per block. (for example a 10_000_000 gas block size allows to claim 180 initialized task or 40 non-initialized tasks in one block)

example:
```js
const { claimed, transactions } = await claim(dealid);
console.log(`transaction count ${transactions.length}`);
Object.entries(claimed).forEach(([idx, taskid]) => {
 console.log(`claimed task: idx ${idx} taskid ${taskid}`);
});
```

#### Parameters

##### dealid

`string`

#### Returns

`Promise`\<\{ `claimed`: `Record`\<[`TaskIndex`](../type-aliases/TaskIndex.md), [`Taskid`](../type-aliases/Taskid.md)\>; `transactions`: `object`[]; \}\>

***

### computeTaskId()

> **computeTaskId**(`dealid`, `taskIdx`): `Promise`\<`string`\>

compute the taskid of the task at specified index of specified deal.

example:
```js
const taskid = await computeTaskId('0x4246d0ddf4c4c728cedd850890ee9a6781a88e5d3c46098c0774af3b7963879b', 0);
console.log('taskid:', taskid)
```

#### Parameters

##### dealid

`string`

##### taskIdx

[`BNish`](../type-aliases/BNish.md)

#### Returns

`Promise`\<`string`\>

***

### fetchDealsByApporder()

> **fetchDealsByApporder**(`apporderHash`, `options?`): `Promise`\<[`PaginableDeals`](../-internal-/interfaces/PaginableDeals.md)\>

fetch the latest deals sealed with a specified apporder.

_NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.

example:
```js
const { deals, count } = await fetchDealsByApporder('0x7fbbbf7ab1c4571111db8d4e3f7ba3fe29c1eb916453f9fbdce4b426e05cbbfb');
console.log('deals count:', count);
console.log('last deal:', deals[0]);
```

#### Parameters

##### apporderHash

`string`

##### options?

###### page?

`number`

index of the page to fetch

###### pageSize?

`number`

size of the page to fetch

#### Returns

`Promise`\<[`PaginableDeals`](../-internal-/interfaces/PaginableDeals.md)\>

***

### fetchDealsByDatasetorder()

> **fetchDealsByDatasetorder**(`datasetorderHash`, `options?`): `Promise`\<[`PaginableDeals`](../-internal-/interfaces/PaginableDeals.md)\>

fetch the latest deals sealed with a specified datasetorder.

_NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.

example:
```js
const { deals, count } = await fetchDealsByDatasetorder('0x60a810f4876fc9173bac74f7cff3c4cdc86f4aff66a72c2011f6e33e0dc8d3d0');
console.log('deals count:', count);
console.log('last deal:', deals[0]);
```

#### Parameters

##### datasetorderHash

`string`

##### options?

###### page?

`number`

index of the page to fetch

###### pageSize?

`number`

size of the page to fetch

#### Returns

`Promise`\<[`PaginableDeals`](../-internal-/interfaces/PaginableDeals.md)\>

***

### fetchDealsByRequestorder()

> **fetchDealsByRequestorder**(`requestorderHash`, `options?`): `Promise`\<[`PaginableDeals`](../-internal-/interfaces/PaginableDeals.md)\>

fetch the latest deals sealed with a specified requestorder.

_NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.

example:
```js
const { deals, count } = await fetchDealsByRequestorder('0x5de0bc9e5604685e96e4031e3815dac55648254fd7b033b59b78c49de8b384b0');
console.log('deals count:', count);
console.log('last deal:', deals[0]);
```

#### Parameters

##### requestorderHash

`string`

##### options?

###### page?

`number`

index of the page to fetch

###### pageSize?

`number`

size of the page to fetch

#### Returns

`Promise`\<[`PaginableDeals`](../-internal-/interfaces/PaginableDeals.md)\>

***

### fetchDealsByWorkerpoolorder()

> **fetchDealsByWorkerpoolorder**(`workerpoolorderHash`, `options?`): `Promise`\<[`PaginableDeals`](../-internal-/interfaces/PaginableDeals.md)\>

fetch the latest deals sealed with a specified workerpoolorder.

_NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.

example:
```js
const { deals, count } = await fetchDealsByWorkerpoolorder('0x2887965ec57500471593852e10e97e9e99ea81a9a0402be68a24683d6cd2b697');
console.log('deals count:', count);
console.log('last deal:', deals[0]);
```

#### Parameters

##### workerpoolorderHash

`string`

##### options?

###### page?

`number`

index of the page to fetch

###### pageSize?

`number`

size of the page to fetch

#### Returns

`Promise`\<[`PaginableDeals`](../-internal-/interfaces/PaginableDeals.md)\>

***

### fetchRequesterDeals()

> **fetchRequesterDeals**(`requesterAddress`, `options?`): `Promise`\<[`PaginableDeals`](../-internal-/interfaces/PaginableDeals.md)\>

fetch the latest deals of the requester optionally filtered by specified filters.

_NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.

example:
```js
const { deals, count } = await fetchRequesterDeals(userAddress);
console.log('deals count:', count);
console.log('last deal:', deals[0]);
```

#### Parameters

##### requesterAddress

`string`

##### options?

###### appAddress?

`string`

filter by app

###### datasetAddress?

`string`

filter by dataset

###### page?

`number`

index of the page to fetch

###### pageSize?

`number`

size of the page to fetch

###### workerpoolAddress?

`string`

filter by workerpool

#### Returns

`Promise`\<[`PaginableDeals`](../-internal-/interfaces/PaginableDeals.md)\>

***

### obsDeal()

> **obsDeal**(`dealid`): `Promise`\<[`DealObservable`](../-internal-/classes/DealObservable.md)\>

return an Observable with a `subscribe` method to monitor the deal status changes.

example:
```js
const dealObservable = await obsDeal('0x4246d0ddf4c4c728cedd850890ee9a6781a88e5d3c46098c0774af3b7963879b');
const unsubscribe = dealObservable.subscribe({
 next: (data) =>
   console.log(
     data.message,
     `completed tasks ${data.completedTasksCount}/${data.tasksCount}`,
   ),
 error: (e) => console.error(e),
 complete: () => console.log('final state reached'),
});
// call unsubscribe() to unsubscribe from dealObservable
```

#### Parameters

##### dealid

`string`

#### Returns

`Promise`\<[`DealObservable`](../-internal-/classes/DealObservable.md)\>

***

### show()

> **show**(`dealid`): `Promise`\<\{ `app`: \{ `owner`: `string`; `pointer`: `string`; `price`: [`BN`](../interfaces/BN.md); \}; `beneficiary`: `string`; `botFirst`: [`BN`](../interfaces/BN.md); `botSize`: [`BN`](../interfaces/BN.md); `callback`: `string`; `category`: [`BN`](../interfaces/BN.md); `dataset`: \{ `owner`: `string`; `pointer`: `string`; `price`: [`BN`](../interfaces/BN.md); \}; `deadlineReached`: `boolean`; `dealid`: `string`; `finalTime`: [`BN`](../interfaces/BN.md); `params`: `string`; `requester`: `string`; `schedulerRewardRatio`: [`BN`](../interfaces/BN.md); `startTime`: [`BN`](../interfaces/BN.md); `tag`: `string`; `tasks`: `Record`\<[`TaskIndex`](../type-aliases/TaskIndex.md), [`Taskid`](../type-aliases/Taskid.md)\>; `trust`: [`BN`](../interfaces/BN.md); `workerpool`: \{ `owner`: `string`; `pointer`: `string`; `price`: [`BN`](../interfaces/BN.md); \}; `workerStake`: [`BN`](../interfaces/BN.md); \}\>

show the details of a deal.

example:
```js
const deal = await show(
 '0x4246d0ddf4c4c728cedd850890ee9a6781a88e5d3c46098c0774af3b7963879b',
);
console.log('deal:', deal);
```

#### Parameters

##### dealid

`string`

#### Returns

`Promise`\<\{ `app`: \{ `owner`: `string`; `pointer`: `string`; `price`: [`BN`](../interfaces/BN.md); \}; `beneficiary`: `string`; `botFirst`: [`BN`](../interfaces/BN.md); `botSize`: [`BN`](../interfaces/BN.md); `callback`: `string`; `category`: [`BN`](../interfaces/BN.md); `dataset`: \{ `owner`: `string`; `pointer`: `string`; `price`: [`BN`](../interfaces/BN.md); \}; `deadlineReached`: `boolean`; `dealid`: `string`; `finalTime`: [`BN`](../interfaces/BN.md); `params`: `string`; `requester`: `string`; `schedulerRewardRatio`: [`BN`](../interfaces/BN.md); `startTime`: [`BN`](../interfaces/BN.md); `tag`: `string`; `tasks`: `Record`\<[`TaskIndex`](../type-aliases/TaskIndex.md), [`Taskid`](../type-aliases/Taskid.md)\>; `trust`: [`BN`](../interfaces/BN.md); `workerpool`: \{ `owner`: `string`; `pointer`: `string`; `price`: [`BN`](../interfaces/BN.md); \}; `workerStake`: [`BN`](../interfaces/BN.md); \}\>

***

### fromConfig()

> `static` **fromConfig**(`config`): `IExecDealModule`

Create an IExecDealModule instance using an IExecConfig instance

#### Parameters

##### config

[`IExecConfig`](IExecConfig.md)

#### Returns

`IExecDealModule`

#### Overrides

[`IExecModule`](IExecModule.md).[`fromConfig`](IExecModule.md#fromconfig)
