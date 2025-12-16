[**iexec**](../../README.md)

***

[iexec](../../globals.md) / [\<internal\>](../README.md) / PaginableOrders

# Interface: PaginableOrders\<OT\>

## Type Parameters

### OT

`OT`

## Properties

### count

> **count**: `number`

total count

***

### more()?

> `optional` **more**: () => `Promise`\<`PaginableOrders`\<`OT`\>\>

when a partial result is returned, `more()` can be called to get the next page.

#### Returns

`Promise`\<`PaginableOrders`\<`OT`\>\>

***

### orders

> **orders**: `OT`[]

order page (this may be a partial result)
