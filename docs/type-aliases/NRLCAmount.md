[**iexec**](../README.md)

***

[iexec](../globals.md) / NRLCAmount

# Type Alias: NRLCAmount

> **NRLCAmount** = `number` \| `string` \| [`BN`](../interfaces/BN.md)

nRLC amount (nRLC stands for nano RLC, the smallest sub-division of the RLC token: 1 RLC = 1,000,000,000 nRLC).

named units ('nRLC', 'RLC') can be used with the format `${amount} ${unit}`

examples:
```js
// number
const oneNRLC = 1;
const tenRLC = 1000000000;
// string (works for amounts above `Number.MAX_SAFE_INTEGER`)
const tenMillionRLC = '10000000000000000';
// string with unit
const fiveRLC = '5 RLC';
const zeroPointOneRLC = '0.1 RLC';
// BN (from utils)
const tenNRLC = new BN(10);
```
