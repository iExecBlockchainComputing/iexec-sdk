[**iexec**](../../../../README.md)

***

[iexec](../../../../globals.md) / [utils](../README.md) / parseEth

# Variable: parseEth()

> `const` **parseEth**: (`value`, `defaultUnit?`) => [`BN`](../../../../interfaces/BN.md)

parse a string formatted Eht value in wei big number

supported units: 'wei', 'kwei', 'mwei', 'gwei', 'szabo', 'finney', 'ether' (or 'eth') default unit 'wei'

example:
```js
console.log('5 gwei =' + parseEth('5 gwei') + 'wei');
console.log('5 gwei =' + parseEth(5, 'gwei') + 'wei');
```

## Parameters

### value

`string`

### defaultUnit?

`string`

## Returns

[`BN`](../../../../interfaces/BN.md)
