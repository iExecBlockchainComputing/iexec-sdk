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

• **new IExecDealModule**(`configOrArgs`, `options?`): [`IExecDealModule`](IExecDealModule.md)

Create an IExecModule instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/IExecConfigOptions.md) |

#### Returns

[`IExecDealModule`](IExecDealModule.md)

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
| `taskIdx` | [`BNish`](../modules.md#bnish) |

#### Returns

`Promise`<`string`\>

___

### fetchDealsByApporder

▸ **fetchDealsByApporder**(`apporderHash`, `options?`): `Promise`<[`PaginableDeals`](../interfaces/internal_.PaginableDeals.md)\>

fetch the latest deals sealed with a specified apporder.

_NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.

example:
```js
const { deals, count } = await fetchDealsByApporder('0x7fbbbf7ab1c4571111db8d4e3f7ba3fe29c1eb916453f9fbdce4b426e05cbbfb');
console.log('deals count:', count);
console.log('last deal:', deals[0]);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `apporderHash` | `string` | - |
| `options?` | `Object` | - |
| `options.page?` | `number` | index of the page to fetch |
| `options.pageSize?` | `number` | size of the page to fetch |

#### Returns

`Promise`<[`PaginableDeals`](../interfaces/internal_.PaginableDeals.md)\>

___

### fetchDealsByDatasetorder

▸ **fetchDealsByDatasetorder**(`datasetorderHash`, `options?`): `Promise`<[`PaginableDeals`](../interfaces/internal_.PaginableDeals.md)\>

fetch the latest deals sealed with a specified datasetorder.

_NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.

example:
```js
const { deals, count } = await fetchDealsByDatasetorder('0x60a810f4876fc9173bac74f7cff3c4cdc86f4aff66a72c2011f6e33e0dc8d3d0');
console.log('deals count:', count);
console.log('last deal:', deals[0]);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `datasetorderHash` | `string` | - |
| `options?` | `Object` | - |
| `options.page?` | `number` | index of the page to fetch |
| `options.pageSize?` | `number` | size of the page to fetch |

#### Returns

`Promise`<[`PaginableDeals`](../interfaces/internal_.PaginableDeals.md)\>

___

### fetchDealsByRequestorder

▸ **fetchDealsByRequestorder**(`requestorderHash`, `options?`): `Promise`<[`PaginableDeals`](../interfaces/internal_.PaginableDeals.md)\>

fetch the latest deals sealed with a specified requestorder.

_NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.

example:
```js
const { deals, count } = await fetchDealsByRequestorder('0x5de0bc9e5604685e96e4031e3815dac55648254fd7b033b59b78c49de8b384b0');
console.log('deals count:', count);
console.log('last deal:', deals[0]);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requestorderHash` | `string` | - |
| `options?` | `Object` | - |
| `options.page?` | `number` | index of the page to fetch |
| `options.pageSize?` | `number` | size of the page to fetch |

#### Returns

`Promise`<[`PaginableDeals`](../interfaces/internal_.PaginableDeals.md)\>

___

### fetchDealsByWorkerpoolorder

▸ **fetchDealsByWorkerpoolorder**(`workerpoolorderHash`, `options?`): `Promise`<[`PaginableDeals`](../interfaces/internal_.PaginableDeals.md)\>

fetch the latest deals sealed with a specified workerpoolorder.

_NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.

example:
```js
const { deals, count } = await fetchDealsByWorkerpoolorder('0x2887965ec57500471593852e10e97e9e99ea81a9a0402be68a24683d6cd2b697');
console.log('deals count:', count);
console.log('last deal:', deals[0]);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `workerpoolorderHash` | `string` | - |
| `options?` | `Object` | - |
| `options.page?` | `number` | index of the page to fetch |
| `options.pageSize?` | `number` | size of the page to fetch |

#### Returns

`Promise`<[`PaginableDeals`](../interfaces/internal_.PaginableDeals.md)\>

___

### fetchRequesterDeals

▸ **fetchRequesterDeals**(`requesterAddress`, `options?`): `Promise`<[`PaginableDeals`](../interfaces/internal_.PaginableDeals.md)\>

fetch the latest deals of the requester optionally filtered by specified filters.

_NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.

example:
```js
const { deals, count } = await fetchRequesterDeals(userAddress);
console.log('deals count:', count);
console.log('last deal:', deals[0]);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `requesterAddress` | `string` | - |
| `options?` | `Object` | - |
| `options.appAddress?` | `string` | filter by app |
| `options.datasetAddress?` | `string` | filter by dataset |
| `options.page?` | `number` | index of the page to fetch |
| `options.pageSize?` | `number` | size of the page to fetch |
| `options.workerpoolAddress?` | `string` | filter by workerpool |

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

▸ **show**(`dealid`): `Promise`<{ `app`: { `owner`: `string` ; `pointer`: `string` ; `price`: [`BN`](utils.BN.md)  } ; `beneficiary`: `string` ; `botFirst`: [`BN`](utils.BN.md) ; `botSize`: [`BN`](utils.BN.md) ; `callback`: `string` ; `category`: [`BN`](utils.BN.md) ; `dataset`: { `owner`: `string` ; `pointer`: `string` ; `price`: [`BN`](utils.BN.md)  } ; `deadlineReached`: `boolean` ; `dealid`: `string` ; `finalTime`: [`BN`](utils.BN.md) ; `params`: `string` ; `requester`: `string` ; `schedulerRewardRatio`: [`BN`](utils.BN.md) ; `startTime`: [`BN`](utils.BN.md) ; `tag`: `string` ; `tasks`: `Record`<`number`, `string`\> ; `trust`: [`BN`](utils.BN.md) ; `workerStake`: [`BN`](utils.BN.md) ; `workerpool`: { `owner`: `string` ; `pointer`: `string` ; `price`: [`BN`](utils.BN.md)  }  }\>

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

`Promise`<{ `app`: { `owner`: `string` ; `pointer`: `string` ; `price`: [`BN`](utils.BN.md)  } ; `beneficiary`: `string` ; `botFirst`: [`BN`](utils.BN.md) ; `botSize`: [`BN`](utils.BN.md) ; `callback`: `string` ; `category`: [`BN`](utils.BN.md) ; `dataset`: { `owner`: `string` ; `pointer`: `string` ; `price`: [`BN`](utils.BN.md)  } ; `deadlineReached`: `boolean` ; `dealid`: `string` ; `finalTime`: [`BN`](utils.BN.md) ; `params`: `string` ; `requester`: `string` ; `schedulerRewardRatio`: [`BN`](utils.BN.md) ; `startTime`: [`BN`](utils.BN.md) ; `tag`: `string` ; `tasks`: `Record`<`number`, `string`\> ; `trust`: [`BN`](utils.BN.md) ; `workerStake`: [`BN`](utils.BN.md) ; `workerpool`: { `owner`: `string` ; `pointer`: `string` ; `price`: [`BN`](utils.BN.md)  }  }\>

___

### fromConfig

▸ **fromConfig**(`config`): [`IExecDealModule`](IExecDealModule.md)

Create an IExecDealModule instance using an IExecConfig instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExecDealModule`](IExecDealModule.md)

#### Overrides

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)
