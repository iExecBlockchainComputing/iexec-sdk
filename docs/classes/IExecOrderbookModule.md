[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecOrderbookModule

# Class: IExecOrderbookModule

module exposing orderbook methods

## Extends

- [`IExecModule`](IExecModule.md)

## Constructors

### Constructor

> **new IExecOrderbookModule**(`configOrArgs`, `options?`): `IExecOrderbookModule`

Create an IExecModule instance

#### Parameters

##### configOrArgs

[`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) | [`IExecConfig`](IExecConfig.md)

##### options?

[`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)

#### Returns

`IExecOrderbookModule`

#### Inherited from

[`IExecModule`](IExecModule.md).[`constructor`](IExecModule.md#constructor)

## Properties

### config

> **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[`IExecModule`](IExecModule.md).[`config`](IExecModule.md#config)

## Methods

### fetchApporder()

> **fetchApporder**(`orderHash`): `Promise`\<[`PublishedApporder`](../-internal-/interfaces/PublishedApporder.md)\>

find a published apporder by orderHash.

example:
```js
const { order, remaining } = await fetchApporder(orderHash);
console.log('order:' order);
console.log('remaining volume:', remaining);
```

#### Parameters

##### orderHash

`string`

#### Returns

`Promise`\<[`PublishedApporder`](../-internal-/interfaces/PublishedApporder.md)\>

***

### fetchAppOrderbook()

> **fetchAppOrderbook**(`appAddressOrOptions`, `options?`): `Promise`\<[`PaginableOrders`](../-internal-/interfaces/PaginableOrders.md)\<[`PublishedApporder`](../-internal-/interfaces/PublishedApporder.md)\>\>

find the cheapest orders for the specified app.

_NB_: use `options` to include restricted orders or filter results.

example:
```js
const { count, orders } = await fetchAppOrderbook(appAddress);
console.log('best order:', orders[0]?.order);
console.log('total orders:', count);
```

#### Parameters

##### appAddressOrOptions

`string` |

\{ `app?`: `string`; `appOwner?`: `string`; `dataset?`: `string`; `isDatasetStrict?`: `boolean`; `isRequesterStrict?`: `boolean`; `isWorkerpoolStrict?`: `boolean`; `maxTag?`: [`Tag`](../type-aliases/Tag.md) \| `string`[]; `minTag?`: [`Tag`](../type-aliases/Tag.md) \| `string`[]; `minVolume?`: [`BNish`](../type-aliases/BNish.md); `page?`: `number`; `pageSize?`: `number`; `requester?`: `string`; `workerpool?`: `string`; \}

###### app?

`string`

filter by app

###### appOwner?

`string`

filter by app owner

###### dataset?

`string`

include orders restricted to specified dataset (use `'any'` to include any dataset)

###### isDatasetStrict?

`boolean`

filters out orders allowing “any” dataset (default: `false`)

###### isRequesterStrict?

`boolean`

filters out orders allowing “any” requester (default: `false`)

###### isWorkerpoolStrict?

`boolean`

filters out orders allowing “any” workerpool (default: `false`)

###### maxTag?

[`Tag`](../type-aliases/Tag.md) \| `string`[]

filter by maximum tag accepted

###### minTag?

[`Tag`](../type-aliases/Tag.md) \| `string`[]

filter by minimum tag required

###### minVolume?

[`BNish`](../type-aliases/BNish.md)

filter by minimum volume remaining

###### page?

`number`

index of the page to fetch

###### pageSize?

`number`

size of the page to fetch

###### requester?

`string`

include orders restricted to specified requester (use `'any'` to include any requester)

###### workerpool?

`string`

include orders restricted to specified workerpool (use `'any'` to include any workerpool)

##### options?

**Deprecated**

use first parameter instead

migration:

replace `fetchAppOrderbook(appAddress, options)` by `fetchAppOrderbook({ app: appAddress, ...options })`

###### dataset?

`string`

include orders restricted to specified dataset (use `'any'` to include any dataset)

###### isDatasetStrict?

`boolean`

filters out orders allowing “any” dataset (default: `false`)

###### isRequesterStrict?

`boolean`

filters out orders allowing “any” requester (default: `false`)

###### isWorkerpoolStrict?

`boolean`

filters out orders allowing “any” workerpool (default: `false`)

###### maxTag?

[`Tag`](../type-aliases/Tag.md) \| `string`[]

filter by maximum tag accepted

###### minTag?

[`Tag`](../type-aliases/Tag.md) \| `string`[]

filter by minimum tag required

###### minVolume?

[`BNish`](../type-aliases/BNish.md)

filter by minimum volume remaining

###### page?

`number`

index of the page to fetch

###### pageSize?

`number`

size of the page to fetch

###### requester?

`string`

include orders restricted to specified requester (use `'any'` to include any requester)

###### workerpool?

`string`

include orders restricted to specified workerpool (use `'any'` to include any workerpool)

#### Returns

`Promise`\<[`PaginableOrders`](../-internal-/interfaces/PaginableOrders.md)\<[`PublishedApporder`](../-internal-/interfaces/PublishedApporder.md)\>\>

***

### fetchDatasetorder()

> **fetchDatasetorder**(`orderHash`): `Promise`\<[`PublishedDatasetorder`](../-internal-/interfaces/PublishedDatasetorder.md)\>

find a published datasetorder by orderHash.

example:
```js
const { order, remaining } = await fetchDatasetorder(orderHash);
console.log('order:' order);
console.log('remaining volume:', remaining);
```

#### Parameters

##### orderHash

`string`

#### Returns

`Promise`\<[`PublishedDatasetorder`](../-internal-/interfaces/PublishedDatasetorder.md)\>

***

### fetchDatasetOrderbook()

> **fetchDatasetOrderbook**(`datasetAddressOrOptions`, `options?`): `Promise`\<[`PaginableOrders`](../-internal-/interfaces/PaginableOrders.md)\<[`PublishedDatasetorder`](../-internal-/interfaces/PublishedDatasetorder.md)\>\>

find the cheapest orders for the specified dataset.

_NB_: use `options` to include restricted orders or filter results.

example:
```js
const { count, orders } = await fetchDatasetOrderbook(datasetAddress);
console.log('best order:', orders[0]?.order);
console.log('total orders:', count);
```

#### Parameters

##### datasetAddressOrOptions

`string` |

\{ `app?`: `string`; `bulkOnly?`: `boolean`; `dataset?`: `string`; `datasetOwner?`: `string`; `isAppStrict?`: `boolean`; `isRequesterStrict?`: `boolean`; `isWorkerpoolStrict?`: `boolean`; `maxTag?`: [`Tag`](../type-aliases/Tag.md) \| `string`[]; `minTag?`: [`Tag`](../type-aliases/Tag.md) \| `string`[]; `minVolume?`: [`BNish`](../type-aliases/BNish.md); `page?`: `number`; `pageSize?`: `number`; `requester?`: `string`; `workerpool?`: `string`; \}

###### app?

`string`

include orders restricted to specified app (use `'any'` to include any app)

###### bulkOnly?

`boolean`

filters out orders that don't allow bulk processing (default: `false`)

###### dataset?

`string`

filter by dataset

###### datasetOwner?

`string`

filter by dataset owner

###### isAppStrict?

`boolean`

filters out orders allowing “any” app (default: `false`)

###### isRequesterStrict?

`boolean`

filters out orders allowing “any” requester (default: `false`)

###### isWorkerpoolStrict?

`boolean`

filters out orders allowing “any” workerpool (default: `false`)

###### maxTag?

[`Tag`](../type-aliases/Tag.md) \| `string`[]

filter by maximum tag accepted

###### minTag?

[`Tag`](../type-aliases/Tag.md) \| `string`[]

filter by minimum tag required

###### minVolume?

[`BNish`](../type-aliases/BNish.md)

filter by minimum volume remaining

###### page?

`number`

index of the page to fetch

###### pageSize?

`number`

size of the page to fetch

###### requester?

`string`

include orders restricted to specified requester (use `'any'` to include any requester)

###### workerpool?

`string`

include orders restricted to specified workerpool (use `'any'` to include any workerpool)

##### options?

**Deprecated**

use first parameter instead

migration:

replace `fetchDatasetOrderbook(datasetAddress, options)` by `fetchDatasetOrderbook({ dataset: datasetAddress, ...options })`

###### app?

`string`

include orders restricted to specified app (use `'any'` to include any app)

###### bulkOnly?

`boolean`

filters out orders that don't allow bulk processing (default: `false`)

###### isAppStrict?

`boolean`

filters out orders allowing “any” app (default: `false`)

###### isRequesterStrict?

`boolean`

filters out orders allowing “any” requester (default: `false`)

###### isWorkerpoolStrict?

`boolean`

filters out orders allowing “any” workerpool (default: `false`)

###### maxTag?

[`Tag`](../type-aliases/Tag.md) \| `string`[]

filter by maximum tag accepted

###### minTag?

[`Tag`](../type-aliases/Tag.md) \| `string`[]

filter by minimum tag required

###### minVolume?

[`BNish`](../type-aliases/BNish.md)

filter by minimum volume remaining

###### page?

`number`

index of the page to fetch

###### pageSize?

`number`

size of the page to fetch

###### requester?

`string`

include orders restricted to specified requester (use `'any'` to include any requester)

###### workerpool?

`string`

include orders restricted to specified workerpool (use `'any'` to include any workerpool)

#### Returns

`Promise`\<[`PaginableOrders`](../-internal-/interfaces/PaginableOrders.md)\<[`PublishedDatasetorder`](../-internal-/interfaces/PublishedDatasetorder.md)\>\>

***

### fetchRequestorder()

> **fetchRequestorder**(`orderHash`): `Promise`\<[`PublishedRequestorder`](../-internal-/interfaces/PublishedRequestorder.md)\>

find a published requestorder by orderHash.

example:
```js
const { order, remaining } = await fetchRequestorder(orderHash);
console.log('order:' order);
console.log('remaining volume:', remaining);
```

#### Parameters

##### orderHash

`string`

#### Returns

`Promise`\<[`PublishedRequestorder`](../-internal-/interfaces/PublishedRequestorder.md)\>

***

### fetchRequestOrderbook()

> **fetchRequestOrderbook**(`options?`): `Promise`\<[`PaginableOrders`](../-internal-/interfaces/PaginableOrders.md)\<[`PublishedWorkerpoolorder`](../-internal-/interfaces/PublishedWorkerpoolorder.md)\>\>

find the best paying request orders for computing resource.

_NB_: use `options` to include restricted orders or filter results.

example:
```js
const { count, orders } = await fetchRequestOrderbook();
console.log('best order:', orders[0]?.order);
console.log('total orders:', count);
```

#### Parameters

##### options?

###### app?

`string`

filter by specified app

###### category?

[`BNish`](../type-aliases/BNish.md)

filter by category

###### dataset?

`string`

filter by specified dataset

###### isWorkerpoolStrict?

`boolean`

filters out orders allowing “any” workerpool (default: `false`)

###### maxTag?

[`Tag`](../type-aliases/Tag.md) \| `string`[]

filter by maximum tag accepted

###### maxTrust?

[`BNish`](../type-aliases/BNish.md)

filter by maximum trust required

###### minTag?

[`Tag`](../type-aliases/Tag.md) \| `string`[]

filter by minimum tag required

###### minVolume?

[`BNish`](../type-aliases/BNish.md)

filter by minimum volume remaining

###### page?

`number`

index of the page to fetch

###### pageSize?

`number`

size of the page to fetch

###### requester?

`string`

filter by requester

###### workerpool?

`string`

include orders restricted to specified workerpool (use `'any'` to include any workerpool)

#### Returns

`Promise`\<[`PaginableOrders`](../-internal-/interfaces/PaginableOrders.md)\<[`PublishedWorkerpoolorder`](../-internal-/interfaces/PublishedWorkerpoolorder.md)\>\>

***

### fetchWorkerpoolorder()

> **fetchWorkerpoolorder**(`orderHash`): `Promise`\<[`PublishedWorkerpoolorder`](../-internal-/interfaces/PublishedWorkerpoolorder.md)\>

find a published workerpoolorder by orderHash.

example:
```js
const { order, remaining } = await fetchWorkerpoolorder(orderHash);
console.log('order:' order);
console.log('remaining volume:', remaining);
```

#### Parameters

##### orderHash

`string`

#### Returns

`Promise`\<[`PublishedWorkerpoolorder`](../-internal-/interfaces/PublishedWorkerpoolorder.md)\>

***

### fetchWorkerpoolOrderbook()

> **fetchWorkerpoolOrderbook**(`options?`): `Promise`\<[`PaginableOrders`](../-internal-/interfaces/PaginableOrders.md)\<[`PublishedWorkerpoolorder`](../-internal-/interfaces/PublishedWorkerpoolorder.md)\>\>

find the cheapest orders for the specified computing resource.

_NB_: use `options` to include restricted orders or filter results.

example:
```js
const { count, orders } = await fetchWorkerpoolOrderbook();
console.log('best order:', orders[0]?.order);
console.log('total orders:', count);
```

#### Parameters

##### options?

###### app?

`string`

include orders restricted to specified app (use `'any'` to include any app)

###### category?

[`BNish`](../type-aliases/BNish.md)

filter by category

###### dataset?

`string`

include orders restricted to specified dataset (use `'any'` to include any dataset)

###### isAppStrict?

`boolean`

filters out orders allowing “any” app (default: `false`)

###### isDatasetStrict?

`boolean`

filters out orders allowing “any” dataset (default: `false`)

###### isRequesterStrict?

`boolean`

filters out orders allowing “any” requester (default: `false`)

###### maxTag?

[`Tag`](../type-aliases/Tag.md) \| `string`[]

filter by maximum tag offered

###### minTag?

[`Tag`](../type-aliases/Tag.md) \| `string`[]

filter by minimum tag required

###### minTrust?

[`BNish`](../type-aliases/BNish.md)

filter by minimum trust required

###### minVolume?

[`BNish`](../type-aliases/BNish.md)

filter by minimum volume remaining

###### page?

`number`

index of the page to fetch

###### pageSize?

`number`

size of the page to fetch

###### requester?

`string`

include orders restricted to specified requester (use `'any'` to include any requester)

###### workerpool?

`string`

filter by workerpool

###### workerpoolOwner?

`string`

filter by workerpool owner

#### Returns

`Promise`\<[`PaginableOrders`](../-internal-/interfaces/PaginableOrders.md)\<[`PublishedWorkerpoolorder`](../-internal-/interfaces/PublishedWorkerpoolorder.md)\>\>

***

### fromConfig()

> `static` **fromConfig**(`config`): `IExecOrderbookModule`

Create an IExecOrderbookModule instance using an IExecConfig instance

#### Parameters

##### config

[`IExecConfig`](IExecConfig.md)

#### Returns

`IExecOrderbookModule`

#### Overrides

[`IExecModule`](IExecModule.md).[`fromConfig`](IExecModule.md#fromconfig)
