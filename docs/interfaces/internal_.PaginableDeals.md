[iexec](../README.md) / [Exports](../modules.md) / [{internal}](../modules/internal_.md) / PaginableDeals

# Interface: PaginableDeals

[{internal}](../modules/internal_.md).PaginableDeals

## Table of contents

### Properties

- [count](internal_.PaginableDeals.md#count)
- [deals](internal_.PaginableDeals.md#deals)

### Methods

- [more](internal_.PaginableDeals.md#more)

## Properties

### count

• **count**: `number`

total count

___

### deals

• **deals**: { `app`: { `owner`: `string` ; `pointer`: `string` ; `price`: `number`  } ; `appHash`: `string` ; `beneficiary`: `string` ; `botFirst`: `number` ; `botSize`: `number` ; `callback`: `string` ; `category`: `number` ; `dataset`: { `owner`: `string` ; `pointer`: `string` ; `price`: `number`  } ; `datasetHash`: `string` ; `dealid`: `string` ; `params`: `string` ; `requestHash`: `string` ; `requester`: `string` ; `schedulerRewardRatio`: `number` ; `startTime`: `number` ; `tag`: `string` ; `trust`: `number` ; `workerStake`: `number` ; `workerpool`: { `owner`: `string` ; `pointer`: `string` ; `price`: `number`  } ; `workerpoolHash`: `string`  }[]

deal page (this may be a partial result)

## Methods

### more

▸ `Optional` **more**(): `Promise`<[`PaginableDeals`](internal_.PaginableDeals.md)\>

when a partial result is returned, `more()` can be called to get the next page.

#### Returns

`Promise`<[`PaginableDeals`](internal_.PaginableDeals.md)\>
