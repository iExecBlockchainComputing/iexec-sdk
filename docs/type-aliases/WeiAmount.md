[**iexec**](../README.md)

***

[iexec](../globals.md) / WeiAmount

# Type Alias: WeiAmount

> **WeiAmount** = `number` \| `string` \| [`BN`](../interfaces/BN.md)

wei amount (wei is the smallest sub-division of ether: 1 ether = 1,000,000,000,000,000,000 wei).

named units ('wei', 'kwei', 'mwei', 'gwei', 'szabo', 'finney', 'ether' or 'eth') can be used with the format `${amount} ${unit}`

examples:
```js
// number
const oneWei = 1;
const tenGigaWei = 1000000000;
// string (works for amounts above `Number.MAX_SAFE_INTEGER`)
const oneEth = '1000000000000000000';
// string with unit
const fiveGigaWei = '5 gwei';
const zeroPointOneEth = '0.1 ether';
// BN (from utils)
const tenWei = new BN(10);
```
