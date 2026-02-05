[iexec](../README.md) / [Exports](../modules.md) / [utils](../modules/utils.md) / BN

# Class: BN

[utils](../modules/utils.md).BN

class used for big numbers manipulation

example:
```js
const one = new BN(1);
const two = new BN('2');

// work above Number.MAX_SAFE_INTEGER limit
const maxSafeInteger = new BN(Number.MAX_SAFE_INTEGER);
const maxSafeIntegerPlusOne = maxSafeInteger.add(one);
```

## Hierarchy

- `BN`

  ↳ **`BN`**

## Table of contents

### Constructors

- [constructor](utils.BN.md#constructor)

## Constructors

### constructor

• **new BN**(`number`, `base?`, `endian?`): [`BN`](utils.BN.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `number` | `string` \| `number` \| `Buffer` \| `Uint8Array` \| `BN` \| `number`[] |
| `base?` | `number` \| ``"hex"`` |
| `endian?` | `Endianness` |

#### Returns

[`BN`](utils.BN.md)

#### Inherited from

BNJS.constructor

• **new BN**(`number`, `endian?`): [`BN`](utils.BN.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `number` | `string` \| `number` \| `Buffer` \| `Uint8Array` \| `BN` \| `number`[] |
| `endian?` | `Endianness` |

#### Returns

[`BN`](utils.BN.md)

#### Inherited from

BNJS.constructor
