[**iexec**](../../../../README.md)

***

[iexec](../../../../globals.md) / [utils](../README.md) / parseRLC

# Variable: parseRLC()

> `const` **parseRLC**: (`value`, `defaultUnit?`) => [`BN`](../../../../interfaces/BN.md)

parse a string formatted RLC value in nRLC big number

supported units: 'nRLC', 'RLC' default unit 'RLC'

example:
```js
console.log('5 RLC =' + parseRLC('5 RLC') + 'nRLC');
console.log('5 RLC =' + parseRLC(5, 'RLC') + 'nRLC');
```

## Parameters

### value

`string` | `number`

### defaultUnit?

`string`

## Returns

[`BN`](../../../../interfaces/BN.md)
