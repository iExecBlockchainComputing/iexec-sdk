[**iexec**](../../README.md)

***

[iexec](../../globals.md) / [\<internal\>](../README.md) / PaginableDeals

# Interface: PaginableDeals

## Properties

### count

> **count**: `number`

total count

***

### deals

> **deals**: `object`[]

deal page (this may be a partial result)

#### app

> **app**: `object`

##### app.owner

> **owner**: `string`

##### app.pointer

> **pointer**: `string`

##### app.price

> **price**: `number`

#### appHash

> **appHash**: `string`

#### beneficiary

> **beneficiary**: `string`

#### botFirst

> **botFirst**: `number`

#### botSize

> **botSize**: `number`

#### callback

> **callback**: `string`

#### category

> **category**: `number`

#### dataset

> **dataset**: `object`

##### dataset.owner

> **owner**: `string`

##### dataset.pointer

> **pointer**: `string`

##### dataset.price

> **price**: `number`

#### datasetHash

> **datasetHash**: `string`

#### dealid

> **dealid**: `string`

#### params

> **params**: `string`

#### requester

> **requester**: `string`

#### requestHash

> **requestHash**: `string`

#### schedulerRewardRatio

> **schedulerRewardRatio**: `number`

#### startTime

> **startTime**: `number`

#### tag

> **tag**: `string`

#### trust

> **trust**: `number`

#### workerpool

> **workerpool**: `object`

##### workerpool.owner

> **owner**: `string`

##### workerpool.pointer

> **pointer**: `string`

##### workerpool.price

> **price**: `number`

#### workerpoolHash

> **workerpoolHash**: `string`

#### workerStake

> **workerStake**: `number`

***

### more()?

> `optional` **more**: () => `Promise`\<`PaginableDeals`\>

when a partial result is returned, `more()` can be called to get the next page.

#### Returns

`Promise`\<`PaginableDeals`\>
