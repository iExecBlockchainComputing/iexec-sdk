[iexec](../README.md) / [Exports](../modules.md) / IExecDealModule

# Class: IExecDealModule

module exposing deal methods

## Hierarchy

- [`IExecModule`](IExecModule.md)

  ↳ **`IExecDealModule`**

## Table of contents

### Constructors

- [constructor](IExecDealModule.md#constructor)

### Properties

- [config](IExecDealModule.md#config)

### Methods

- [claim](IExecDealModule.md#claim)
- [computeTaskId](IExecDealModule.md#computetaskid)
- [fetchDealsByApporder](IExecDealModule.md#fetchdealsbyapporder)
- [fetchDealsByDatasetorder](IExecDealModule.md#fetchdealsbydatasetorder)
- [fetchDealsByRequestorder](IExecDealModule.md#fetchdealsbyrequestorder)
- [fetchDealsByWorkerpoolorder](IExecDealModule.md#fetchdealsbyworkerpoolorder)
- [fetchRequesterDeals](IExecDealModule.md#fetchrequesterdeals)
- [obsDeal](IExecDealModule.md#obsdeal)
- [show](IExecDealModule.md#show)
- [fromConfig](IExecDealModule.md#fromconfig)

## Constructors

### constructor

• **new IExecDealModule**(`configOrArgs`, `options?`)

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

### claim

▸ **claim**(`dealid`): `Promise`<{ `claimed`: `Record`<`number`, `string`\> ; `transactions`: { `txHash`: `string` ; `type`: `string`  }[]  }\>

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

| Name | Type |
| :------ | :------ |
| `dealid` | `string` |

#### Returns

`Promise`<{ `claimed`: `Record`<`number`, `string`\> ; `transactions`: { `txHash`: `string` ; `type`: `string`  }[]  }\>

___

### computeTaskId

▸ **computeTaskId**(`dealid`, `taskIdx`): `Promise`<`string`\>

compute the taskid of the task at specified index of specified deal.

example:
```js
const taskid = await computeTaskId('0x4246d0ddf4c4c728cedd850890ee9a6781a88e5d3c46098c0774af3b7963879b', 0);
console.log('taskid:', taskid)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `dealid` | `string` |
| `taskIdx` | [`BNish`](../modules/internal_.md#bnish) |

#### Returns

`Promise`<`string`\>

___

### fetchDealsByApporder

▸ **fetchDealsByApporder**(`apporderHash`): `Promise`<[`PaginableDeals`](../interfaces/internal_.PaginableDeals.md)\>

fetch the latest deals sealed with a specified apporder.

_NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.

example:
```js
const { deals, count } = await fetchDealsByApporder('0x7fbbbf7ab1c4571111db8d4e3f7ba3fe29c1eb916453f9fbdce4b426e05cbbfb');
console.log('deals count:', count);
console.log('last deal:', deals[0]);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `apporderHash` | `string` |

#### Returns

`Promise`<[`PaginableDeals`](../interfaces/internal_.PaginableDeals.md)\>

___

### fetchDealsByDatasetorder

▸ **fetchDealsByDatasetorder**(`datasetorderHash`): `Promise`<[`PaginableDeals`](../interfaces/internal_.PaginableDeals.md)\>

fetch the latest deals sealed with a specified datasetorder.

_NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.

example:
```js
const { deals, count } = await fetchDealsByDatasetorder('0x60a810f4876fc9173bac74f7cff3c4cdc86f4aff66a72c2011f6e33e0dc8d3d0');
console.log('deals count:', count);
console.log('last deal:', deals[0]);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `datasetorderHash` | `string` |

#### Returns

`Promise`<[`PaginableDeals`](../interfaces/internal_.PaginableDeals.md)\>

___

### fetchDealsByRequestorder

▸ **fetchDealsByRequestorder**(`requestorderHash`): `Promise`<[`PaginableDeals`](../interfaces/internal_.PaginableDeals.md)\>

fetch the latest deals sealed with a specified requestorder.

_NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.

example:
```js
const { deals, count } = await fetchDealsByRequestorder('0x5de0bc9e5604685e96e4031e3815dac55648254fd7b033b59b78c49de8b384b0');
console.log('deals count:', count);
console.log('last deal:', deals[0]);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestorderHash` | `string` |

#### Returns

`Promise`<[`PaginableDeals`](../interfaces/internal_.PaginableDeals.md)\>

___

### fetchDealsByWorkerpoolorder

▸ **fetchDealsByWorkerpoolorder**(`workerpoolorderHash`): `Promise`<[`PaginableDeals`](../interfaces/internal_.PaginableDeals.md)\>

fetch the latest deals sealed with a specified workerpoolorder.

_NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.

example:
```js
const { deals, count } = await fetchDealsByWorkerpoolorder('0x2887965ec57500471593852e10e97e9e99ea81a9a0402be68a24683d6cd2b697');
console.log('deals count:', count);
console.log('last deal:', deals[0]);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `workerpoolorderHash` | `string` |

#### Returns

`Promise`<[`PaginableDeals`](../interfaces/internal_.PaginableDeals.md)\>

___

### fetchRequesterDeals

▸ **fetchRequesterDeals**(`requesterAddress`, `filters?`): `Promise`<[`PaginableDeals`](../interfaces/internal_.PaginableDeals.md)\>

fetch the latest deals of the requester optionaly filtered by specified filters.

_NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.

example:
```js
const { deals, count } = await fetchRequesterDeals(userAddress);
console.log('deals count:', count);
console.log('last deal:', deals[0]);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requesterAddress` | `string` |
| `filters?` | `Object` |
| `filters.appAddress?` | `string` |
| `filters.datasetAddress?` | `string` |
| `filters.workerpoolAddress?` | `string` |

#### Returns

`Promise`<[`PaginableDeals`](../interfaces/internal_.PaginableDeals.md)\>

___

### obsDeal

▸ **obsDeal**(`dealid`): `Promise`<[`DealObservable`](internal_.DealObservable.md)\>

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

| Name | Type |
| :------ | :------ |
| `dealid` | `string` |

#### Returns

`Promise`<[`DealObservable`](internal_.DealObservable.md)\>

___

### show

▸ **show**(`dealid`): `Promise`<{ `app`: { `owner`: `string` ; `pointer`: `string` ; `price`: `BN`  } ; `beneficiary`: `string` ; `botFirst`: `BN` ; `botSize`: `BN` ; `callback`: `string` ; `category`: `BN` ; `dataset`: { `owner`: `string` ; `pointer`: `string` ; `price`: `BN`  } ; `deadlineReached`: `boolean` ; `dealid`: `string` ; `finalTime`: `BN` ; `params`: `string` ; `requester`: `string` ; `schedulerRewardRatio`: `BN` ; `startTime`: `BN` ; `tag`: `string` ; `tasks`: `Record`<`number`, `string`\> ; `trust`: `BN` ; `workerStake`: `BN` ; `workerpool`: { `owner`: `string` ; `pointer`: `string` ; `price`: `BN`  }  }\>

show the details of a deal.

example:
```js
const deal = await show(
 '0x4246d0ddf4c4c728cedd850890ee9a6781a88e5d3c46098c0774af3b7963879b',
);
console.log('deal:', deal);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `dealid` | `string` |

#### Returns

`Promise`<{ `app`: { `owner`: `string` ; `pointer`: `string` ; `price`: `BN`  } ; `beneficiary`: `string` ; `botFirst`: `BN` ; `botSize`: `BN` ; `callback`: `string` ; `category`: `BN` ; `dataset`: { `owner`: `string` ; `pointer`: `string` ; `price`: `BN`  } ; `deadlineReached`: `boolean` ; `dealid`: `string` ; `finalTime`: `BN` ; `params`: `string` ; `requester`: `string` ; `schedulerRewardRatio`: `BN` ; `startTime`: `BN` ; `tag`: `string` ; `tasks`: `Record`<`number`, `string`\> ; `trust`: `BN` ; `workerStake`: `BN` ; `workerpool`: { `owner`: `string` ; `pointer`: `string` ; `price`: `BN`  }  }\>

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
