[iexec](../README.md) / [Exports](../modules.md) / IExecOrderbookModule

# Class: IExecOrderbookModule

module exposing orderbook methods

## Hierarchy

- [`IExecModule`](IExecModule.md)

  ↳ **`IExecOrderbookModule`**

## Table of contents

### Constructors

- [constructor](IExecOrderbookModule.md#constructor)

### Properties

- [config](IExecOrderbookModule.md#config)

### Methods

- [fetchAppOrderbook](IExecOrderbookModule.md#fetchapporderbook)
- [fetchApporder](IExecOrderbookModule.md#fetchapporder)
- [fetchDatasetOrderbook](IExecOrderbookModule.md#fetchdatasetorderbook)
- [fetchDatasetorder](IExecOrderbookModule.md#fetchdatasetorder)
- [fetchRequestOrderbook](IExecOrderbookModule.md#fetchrequestorderbook)
- [fetchRequestorder](IExecOrderbookModule.md#fetchrequestorder)
- [fetchWorkerpoolOrderbook](IExecOrderbookModule.md#fetchworkerpoolorderbook)
- [fetchWorkerpoolorder](IExecOrderbookModule.md#fetchworkerpoolorder)
- [fromConfig](IExecOrderbookModule.md#fromconfig)

## Constructors

### constructor

• **new IExecOrderbookModule**(`configOrArgs`, `options?`): [`IExecOrderbookModule`](IExecOrderbookModule.md)

Create an IExecModule instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/IExecConfigOptions.md) |

#### Returns

[`IExecOrderbookModule`](IExecOrderbookModule.md)

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

## Methods

### fetchAppOrderbook

▸ **fetchAppOrderbook**(`appAddressOrOptions`, `options?`): `Promise`<[`PaginableOrders`](../interfaces/internal_.PaginableOrders.md)<[`PublishedApporder`](../interfaces/internal_.PublishedApporder.md)\>\>

find the cheapest orders for the specified app.

_NB_: use `options` to include restricted orders or filter results.

example:
```js
const { count, orders } = await fetchAppOrderbook(appAddress);
console.log('best order:', orders[0]?.order);
console.log('total orders:', count);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `appAddressOrOptions` | `string` \| { `app?`: `string` ; `appOwner?`: `string` ; `dataset?`: `string` ; `isDatasetStrict?`: `boolean` ; `isRequesterStrict?`: `boolean` ; `isWorkerpoolStrict?`: `boolean` ; `maxTag?`: [`Tag`](../modules.md#tag) \| `string`[] ; `minTag?`: [`Tag`](../modules.md#tag) \| `string`[] ; `minVolume?`: [`BNish`](../modules.md#bnish) ; `page?`: `number` ; `pageSize?`: `number` ; `requester?`: `string` ; `workerpool?`: `string`  } | - |
| `options?` | `Object` | **`Deprecated`** use first parameter instead migration: replace `fetchAppOrderbook(appAddress, options)` by `fetchAppOrderbook({ app: appAddress, ...options })` |
| `options.dataset?` | `string` | include orders restricted to specified dataset (use `'any'` to include any dataset) |
| `options.isDatasetStrict?` | `boolean` | filters out orders allowing “any” dataset (default: `false`) |
| `options.isRequesterStrict?` | `boolean` | filters out orders allowing “any” requester (default: `false`) |
| `options.isWorkerpoolStrict?` | `boolean` | filters out orders allowing “any” workerpool (default: `false`) |
| `options.maxTag?` | [`Tag`](../modules.md#tag) \| `string`[] | filter by maximum tag accepted |
| `options.minTag?` | [`Tag`](../modules.md#tag) \| `string`[] | filter by minimum tag required |
| `options.minVolume?` | [`BNish`](../modules.md#bnish) | filter by minimum volume remaining |
| `options.page?` | `number` | index of the page to fetch |
| `options.pageSize?` | `number` | size of the page to fetch |
| `options.requester?` | `string` | include orders restricted to specified requester (use `'any'` to include any requester) |
| `options.workerpool?` | `string` | include orders restricted to specified workerpool (use `'any'` to include any workerpool) |

#### Returns

`Promise`<[`PaginableOrders`](../interfaces/internal_.PaginableOrders.md)<[`PublishedApporder`](../interfaces/internal_.PublishedApporder.md)\>\>

___

### fetchApporder

▸ **fetchApporder**(`orderHash`): `Promise`<[`PublishedApporder`](../interfaces/internal_.PublishedApporder.md)\>

find a published apporder by orderHash.

example:
```js
const { order, remaining } = await fetchApporder(orderHash);
console.log('order:' order);
console.log('remaining volume:', remaining);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `orderHash` | `string` |

#### Returns

`Promise`<[`PublishedApporder`](../interfaces/internal_.PublishedApporder.md)\>

___

### fetchDatasetOrderbook

▸ **fetchDatasetOrderbook**(`datasetAddressOrOptions`, `options?`): `Promise`<[`PaginableOrders`](../interfaces/internal_.PaginableOrders.md)<[`PublishedDatasetorder`](../interfaces/internal_.PublishedDatasetorder.md)\>\>

find the cheapest orders for the specified dataset.

_NB_: use `options` to include restricted orders or filter results.

example:
```js
const { count, orders } = await fetchDatasetOrderbook(datasetAddress);
console.log('best order:', orders[0]?.order);
console.log('total orders:', count);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `datasetAddressOrOptions` | `string` \| { `app?`: `string` ; `bulkOnly?`: `boolean` ; `dataset?`: `string` ; `datasetOwner?`: `string` ; `isAppStrict?`: `boolean` ; `isRequesterStrict?`: `boolean` ; `isWorkerpoolStrict?`: `boolean` ; `maxTag?`: [`Tag`](../modules.md#tag) \| `string`[] ; `minTag?`: [`Tag`](../modules.md#tag) \| `string`[] ; `minVolume?`: [`BNish`](../modules.md#bnish) ; `page?`: `number` ; `pageSize?`: `number` ; `requester?`: `string` ; `workerpool?`: `string`  } | - |
| `options?` | `Object` | **`Deprecated`** use first parameter instead migration: replace `fetchDatasetOrderbook(datasetAddress, options)` by `fetchDatasetOrderbook({ dataset: datasetAddress, ...options })` |
| `options.app?` | `string` | include orders restricted to specified app (use `'any'` to include any app) |
| `options.bulkOnly?` | `boolean` | filters out orders that don't allow bulk processing (default: `false`) |
| `options.isAppStrict?` | `boolean` | filters out orders allowing “any” app (default: `false`) |
| `options.isRequesterStrict?` | `boolean` | filters out orders allowing “any” requester (default: `false`) |
| `options.isWorkerpoolStrict?` | `boolean` | filters out orders allowing “any” workerpool (default: `false`) |
| `options.maxTag?` | [`Tag`](../modules.md#tag) \| `string`[] | filter by maximum tag accepted |
| `options.minTag?` | [`Tag`](../modules.md#tag) \| `string`[] | filter by minimum tag required |
| `options.minVolume?` | [`BNish`](../modules.md#bnish) | filter by minimum volume remaining |
| `options.page?` | `number` | index of the page to fetch |
| `options.pageSize?` | `number` | size of the page to fetch |
| `options.requester?` | `string` | include orders restricted to specified requester (use `'any'` to include any requester) |
| `options.workerpool?` | `string` | include orders restricted to specified workerpool (use `'any'` to include any workerpool) |

#### Returns

`Promise`<[`PaginableOrders`](../interfaces/internal_.PaginableOrders.md)<[`PublishedDatasetorder`](../interfaces/internal_.PublishedDatasetorder.md)\>\>

___

### fetchDatasetorder

▸ **fetchDatasetorder**(`orderHash`): `Promise`<[`PublishedDatasetorder`](../interfaces/internal_.PublishedDatasetorder.md)\>

find a published datasetorder by orderHash.

example:
```js
const { order, remaining } = await fetchDatasetorder(orderHash);
console.log('order:' order);
console.log('remaining volume:', remaining);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `orderHash` | `string` |

#### Returns

`Promise`<[`PublishedDatasetorder`](../interfaces/internal_.PublishedDatasetorder.md)\>

___

### fetchRequestOrderbook

▸ **fetchRequestOrderbook**(`options?`): `Promise`<[`PaginableOrders`](../interfaces/internal_.PaginableOrders.md)<[`PublishedWorkerpoolorder`](../interfaces/internal_.PublishedWorkerpoolorder.md)\>\>

find the best paying request orders for computing resource.

_NB_: use `options` to include restricted orders or filter results.

example:
```js
const { count, orders } = await fetchRequestOrderbook();
console.log('best order:', orders[0]?.order);
console.log('total orders:', count);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options?` | `Object` | - |
| `options.app?` | `string` | filter by specified app |
| `options.category?` | [`BNish`](../modules.md#bnish) | filter by category |
| `options.dataset?` | `string` | filter by specified dataset |
| `options.isWorkerpoolStrict?` | `boolean` | filters out orders allowing “any” workerpool (default: `false`) |
| `options.maxTag?` | [`Tag`](../modules.md#tag) \| `string`[] | filter by maximum tag accepted |
| `options.maxTrust?` | [`BNish`](../modules.md#bnish) | filter by maximum trust required |
| `options.minTag?` | [`Tag`](../modules.md#tag) \| `string`[] | filter by minimum tag required |
| `options.minVolume?` | [`BNish`](../modules.md#bnish) | filter by minimum volume remaining |
| `options.page?` | `number` | index of the page to fetch |
| `options.pageSize?` | `number` | size of the page to fetch |
| `options.requester?` | `string` | filter by requester |
| `options.workerpool?` | `string` | include orders restricted to specified workerpool (use `'any'` to include any workerpool) |

#### Returns

`Promise`<[`PaginableOrders`](../interfaces/internal_.PaginableOrders.md)<[`PublishedWorkerpoolorder`](../interfaces/internal_.PublishedWorkerpoolorder.md)\>\>

___

### fetchRequestorder

▸ **fetchRequestorder**(`orderHash`): `Promise`<[`PublishedRequestorder`](../interfaces/internal_.PublishedRequestorder.md)\>

find a published requestorder by orderHash.

example:
```js
const { order, remaining } = await fetchRequestorder(orderHash);
console.log('order:' order);
console.log('remaining volume:', remaining);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `orderHash` | `string` |

#### Returns

`Promise`<[`PublishedRequestorder`](../interfaces/internal_.PublishedRequestorder.md)\>

___

### fetchWorkerpoolOrderbook

▸ **fetchWorkerpoolOrderbook**(`options?`): `Promise`<[`PaginableOrders`](../interfaces/internal_.PaginableOrders.md)<[`PublishedWorkerpoolorder`](../interfaces/internal_.PublishedWorkerpoolorder.md)\>\>

find the cheapest orders for the specified computing resource.

_NB_: use `options` to include restricted orders or filter results.

example:
```js
const { count, orders } = await fetchWorkerpoolOrderbook();
console.log('best order:', orders[0]?.order);
console.log('total orders:', count);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options?` | `Object` | - |
| `options.app?` | `string` | include orders restricted to specified app (use `'any'` to include any app) |
| `options.category?` | [`BNish`](../modules.md#bnish) | filter by category |
| `options.dataset?` | `string` | include orders restricted to specified dataset (use `'any'` to include any dataset) |
| `options.isAppStrict?` | `boolean` | filters out orders allowing “any” app (default: `false`) |
| `options.isDatasetStrict?` | `boolean` | filters out orders allowing “any” dataset (default: `false`) |
| `options.isRequesterStrict?` | `boolean` | filters out orders allowing “any” requester (default: `false`) |
| `options.maxTag?` | [`Tag`](../modules.md#tag) \| `string`[] | filter by maximum tag offered |
| `options.minTag?` | [`Tag`](../modules.md#tag) \| `string`[] | filter by minimum tag required |
| `options.minTrust?` | [`BNish`](../modules.md#bnish) | filter by minimum trust required |
| `options.minVolume?` | [`BNish`](../modules.md#bnish) | filter by minimum volume remaining |
| `options.page?` | `number` | index of the page to fetch |
| `options.pageSize?` | `number` | size of the page to fetch |
| `options.requester?` | `string` | include orders restricted to specified requester (use `'any'` to include any requester) |
| `options.workerpool?` | `string` | filter by workerpool |
| `options.workerpoolOwner?` | `string` | filter by workerpool owner |

#### Returns

`Promise`<[`PaginableOrders`](../interfaces/internal_.PaginableOrders.md)<[`PublishedWorkerpoolorder`](../interfaces/internal_.PublishedWorkerpoolorder.md)\>\>

___

### fetchWorkerpoolorder

▸ **fetchWorkerpoolorder**(`orderHash`): `Promise`<[`PublishedWorkerpoolorder`](../interfaces/internal_.PublishedWorkerpoolorder.md)\>

find a published workerpoolorder by orderHash.

example:
```js
const { order, remaining } = await fetchWorkerpoolorder(orderHash);
console.log('order:' order);
console.log('remaining volume:', remaining);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `orderHash` | `string` |

#### Returns

`Promise`<[`PublishedWorkerpoolorder`](../interfaces/internal_.PublishedWorkerpoolorder.md)\>

___

### fromConfig

▸ **fromConfig**(`config`): [`IExecOrderbookModule`](IExecOrderbookModule.md)

Create an IExecOrderbookModule instance using an IExecConfig instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExecOrderbookModule`](IExecOrderbookModule.md)

#### Overrides

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)
