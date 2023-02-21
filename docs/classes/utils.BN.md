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

• **new BN**(`number`, `base?`, `endian?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `number` | `string` \| `number` \| `BN` \| `Buffer` \| `Uint8Array` \| `number`[] |
| `base?` | `number` \| ``"hex"`` |
| `endian?` | `Endianness` |

#### Inherited from

BNJS.constructor

• **new BN**(`number`, `endian?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `number` | `string` \| `number` \| `BN` \| `Buffer` \| `Uint8Array` \| `number`[] |
| `endian?` | `Endianness` |

#### Inherited from

BNJS.constructor
