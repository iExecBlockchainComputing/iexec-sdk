[iexec](../README.md) / [Exports](../modules.md) / [<internal\>](../modules/internal_.md) / PaginableOrders

# Interface: PaginableOrders<OT\>

[<internal>](../modules/internal_.md).PaginableOrders

## Type parameters

| Name |
| :------ |
| `OT` |

## Table of contents

### Properties

- [count](internal_.PaginableOrders.md#count)
- [more](internal_.PaginableOrders.md#more)
- [orders](internal_.PaginableOrders.md#orders)

## Properties

### count

• **count**: `number`

total count

___

### more

• `Optional` **more**: () => `Promise`<[`PaginableOrders`](internal_.PaginableOrders.md)<`OT`\>\>

#### Type declaration

▸ (): `Promise`<[`PaginableOrders`](internal_.PaginableOrders.md)<`OT`\>\>

when a partial result is returned, `more()` can be called to get the next page.

##### Returns

`Promise`<[`PaginableOrders`](internal_.PaginableOrders.md)<`OT`\>\>

___

### orders

• **orders**: `OT`[]

order page (this may be a partial result)
