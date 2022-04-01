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

• **new IExecOrderbookModule**(`configOrArgs`, `options?`)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/internal_.IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/internal_.IExecConfigOptions.md) |

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

#### Defined in

[src/lib/IExecModule.d.ts:13](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/lib/IExecModule.d.ts#L13)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

#### Defined in

[src/lib/IExecModule.d.ts:20](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/lib/IExecModule.d.ts#L20)

## Methods

### fetchAppOrderbook

▸ **fetchAppOrderbook**(`appAddress`, `options?`): `Promise`<[`PaginableOrders`](../interfaces/internal_.PaginableOrders.md)<[`PublishedApporder`](../interfaces/internal_.PublishedApporder.md)\>\>

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
| `appAddress` | `string` | - |
| `options?` | `Object` | - |
| `options.dataset?` | `string` | include orders restricted to specified dataset |
| `options.maxTag` | [`Tag`](../modules/internal_.md#tag) \| `string`[] | filter by maximun tag accepted |
| `options.minTag` | [`Tag`](../modules/internal_.md#tag) \| `string`[] | filter by minimum tag required |
| `options.minVolume?` | [`BNish`](../modules/internal_.md#bnish) | filter by minimum volume remaining |
| `options.requester?` | `string` | include orders restricted to specified requester |
| `options.workerpool?` | `string` | include orders restricted to specified workerpool |

#### Returns

`Promise`<[`PaginableOrders`](../interfaces/internal_.PaginableOrders.md)<[`PublishedApporder`](../interfaces/internal_.PublishedApporder.md)\>\>

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:144](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/lib/IExecOrderbookModule.d.ts#L144)

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

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:324](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/lib/IExecOrderbookModule.d.ts#L324)

___

### fetchDatasetOrderbook

▸ **fetchDatasetOrderbook**(`datasetAddress`, `options?`): `Promise`<[`PaginableOrders`](../interfaces/internal_.PaginableOrders.md)<[`PublishedDatasetorder`](../interfaces/internal_.PublishedDatasetorder.md)\>\>

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
| `datasetAddress` | `string` | - |
| `options?` | `Object` | - |
| `options.app?` | `string` | include orders restricted to specified app |
| `options.maxTag` | [`Tag`](../modules/internal_.md#tag) \| `string`[] | filter by maximun tag accepted |
| `options.minTag` | [`Tag`](../modules/internal_.md#tag) \| `string`[] | filter by minimum tag required |
| `options.minVolume?` | [`BNish`](../modules/internal_.md#bnish) | filter by minimum volume remaining |
| `options.requester?` | `string` | include orders restricted to specified requester |
| `options.workerpool?` | `string` | include orders restricted to specified workerpool |

#### Returns

`Promise`<[`PaginableOrders`](../interfaces/internal_.PaginableOrders.md)<[`PublishedDatasetorder`](../interfaces/internal_.PublishedDatasetorder.md)\>\>

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:185](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/lib/IExecOrderbookModule.d.ts#L185)

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

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:335](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/lib/IExecOrderbookModule.d.ts#L335)

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
| `options.app` | `string` | include orders restricted to specified app |
| `options.category?` | [`BNish`](../modules/internal_.md#bnish) | filter by category |
| `options.dataset?` | `string` | include orders restricted to specified dataset |
| `options.maxTag` | [`Tag`](../modules/internal_.md#tag) \| `string`[] | filter by maximun tag accepted |
| `options.maxTrust` | [`BNish`](../modules/internal_.md#bnish) | filter by maximum trust required |
| `options.minTag` | [`Tag`](../modules/internal_.md#tag) \| `string`[] | filter by minimum tag required |
| `options.minVolume?` | [`BNish`](../modules/internal_.md#bnish) | filter by minimum volume remaining |
| `options.requester?` | `string` | filter by requester |
| `options.workerpool?` | `string` | include orders restricted to specified workerpool |

#### Returns

`Promise`<[`PaginableOrders`](../interfaces/internal_.PaginableOrders.md)<[`PublishedWorkerpoolorder`](../interfaces/internal_.PublishedWorkerpoolorder.md)\>\>

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:276](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/lib/IExecOrderbookModule.d.ts#L276)

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

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:357](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/lib/IExecOrderbookModule.d.ts#L357)

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
| `options.app` | `string` | include orders restricted to specified app |
| `options.category?` | [`BNish`](../modules/internal_.md#bnish) | filter by category |
| `options.dataset?` | `string` | include orders restricted to specified dataset |
| `options.maxTag` | [`Tag`](../modules/internal_.md#tag) \| `string`[] | filter by maximun tag offered |
| `options.minTag` | [`Tag`](../modules/internal_.md#tag) \| `string`[] | filter by minimum tag required |
| `options.minTrust` | [`BNish`](../modules/internal_.md#bnish) | filter by minimum trust required |
| `options.minVolume?` | [`BNish`](../modules/internal_.md#bnish) | filter by minimum volume remaining |
| `options.requester?` | `string` | include orders restricted to specified requester |
| `options.workerpool?` | `string` | filter by workerpool |

#### Returns

`Promise`<[`PaginableOrders`](../interfaces/internal_.PaginableOrders.md)<[`PublishedWorkerpoolorder`](../interfaces/internal_.PublishedWorkerpoolorder.md)\>\>

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:226](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/lib/IExecOrderbookModule.d.ts#L226)

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

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:346](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/lib/IExecOrderbookModule.d.ts#L346)

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

[src/lib/IExecModule.d.ts:24](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/lib/IExecModule.d.ts#L24)
