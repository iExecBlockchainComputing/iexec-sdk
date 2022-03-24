[iexec](../README.md) / [Exports](../modules.md) / [{internal}](../modules/internal_.md) / PaginableOrders

# Interface: PaginableOrders<OT\>

[{internal}](../modules/internal_.md).PaginableOrders

## Type parameters

| Name |
| :------ |
| `OT` |

## Table of contents

### Properties

- [count](internal_.PaginableOrders.md#count)
- [orders](internal_.PaginableOrders.md#orders)

### Methods

- [more](internal_.PaginableOrders.md#more)

## Properties

### count

• **count**: `number`

total count

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:121](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/79135f9/src/lib/IExecOrderbookModule.d.ts#L121)

___

### orders

• **orders**: `OT`[]

order page (this may be a partial result)

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:117](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/79135f9/src/lib/IExecOrderbookModule.d.ts#L117)

## Methods

### more

▸ `Optional` **more**(): `Promise`<[`PaginableOrders`](internal_.PaginableOrders.md)<`OT`\>\>

when a partial result is returned, `more()` can be called to get the next page.

#### Returns

`Promise`<[`PaginableOrders`](internal_.PaginableOrders.md)<`OT`\>\>

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:125](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/79135f9/src/lib/IExecOrderbookModule.d.ts#L125)
