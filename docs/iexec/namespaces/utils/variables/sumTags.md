[**iexec**](../../../../README.md)

***

[iexec](../../../../globals.md) / [utils](../README.md) / sumTags

# Variable: sumTags()

> `const` **sumTags**: (`tags`) => [`Bytes32`](../../../../type-aliases/Bytes32.md)

sum an array of bytes32 tags

example:
```js
const appTag = '0x0000000000000000000000000000000000000000000000000000000000000100';
const datasetTag = '0x0000000000000000000000000000000000000000000000000000000000000001';
const requestTag = '0x0000000000000000000000000000000000000000000000000000000000000000';
const workerpoolMinTag = sumTags([appTag, datasetTag, requestTag]);
console.log('workerpoolMinTag', workerpoolMinTag);
```

## Parameters

### tags

[`Bytes32`](../../../../type-aliases/Bytes32.md)[]

## Returns

[`Bytes32`](../../../../type-aliases/Bytes32.md)
