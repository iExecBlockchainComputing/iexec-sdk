[**iexec**](../README.md)

***

[iexec](../globals.md) / BN

# Interface: BN

class used for big numbers manipulation

example:
```js
const one = new BN(1);
const two = new BN('2');

// work above Number.MAX_SAFE_INTEGER limit
const maxSafeInteger = new BN(Number.MAX_SAFE_INTEGER);
const maxSafeIntegerPlusOne = maxSafeInteger.add(one);
```

## Extends

- `BN`
