[iexec](../README.md) / [Exports](../modules.md) / utils

# Namespace: utils

## Table of contents

### Classes

- [BN](../classes/utils.BN.md)

### Variables

- [NULL\_ADDRESS](utils.md#null_address)
- [NULL\_BYTES32](utils.md#null_bytes32)

### Functions

- [decodeTag](utils.md#decodetag)
- [decryptResult](utils.md#decryptresult)
- [encodeTag](utils.md#encodetag)
- [formatEth](utils.md#formateth)
- [formatRLC](utils.md#formatrlc)
- [getSignerFromPrivateKey](utils.md#getsignerfromprivatekey)
- [parseEth](utils.md#parseeth)
- [parseRLC](utils.md#parserlc)
- [sumTags](utils.md#sumtags)

## Variables

### NULL\_ADDRESS

• `Const` **NULL\_ADDRESS**: `string`

ethereum null/zero address

#### Defined in

[src/lib/utils.d.ts:64](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/utils.d.ts#L64)

___

### NULL\_BYTES32

• `Const` **NULL\_BYTES32**: `string`

null bytes32

#### Defined in

[src/lib/utils.d.ts:68](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/utils.d.ts#L68)

## Functions

### decodeTag

▸ **decodeTag**(`tag`): `string`[]

decode a bytes32 tag in an array of human readable tags

example:
```js
console.log(decodeTag('0x0000000000000000000000000000000000000000000000000000000000000001'));
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `tag` | `string` |

#### Returns

`string`[]

#### Defined in

[src/lib/utils.d.ts:128](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/utils.d.ts#L128)

___

### decryptResult

▸ **decryptResult**(`encrypted`, `beneficiaryKey`): `Promise`<`Buffer`\>

decrypt an encrypted result file

example:
```js
// somehow load the beneficiary RSA private key
const beneficaryKey = await loadBeneficiaryKey();
const response = await iexec.task.fetchResults('0x5c959fd2e9ea2d5bdb965d7c2e7271c9cb91dd05b7bdcfa8204c34c52f8c8c19');
const encFileBuffer = await response.arrayBuffer();
const decryptedFileBuffer = await decryptResult(encFileBuffer, beneficaryKey);
const binary = new Blob([decryptedFileBuffer]);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `encrypted` | `string` \| `Buffer` \| `ArrayBuffer` \| `Uint8Array` |
| `beneficiaryKey` | `string` \| `Buffer` \| `ArrayBuffer` \| `Uint8Array` |

#### Returns

`Promise`<`Buffer`\>

#### Defined in

[src/lib/utils.d.ts:155](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/utils.d.ts#L155)

___

### encodeTag

▸ **encodeTag**(`tags`): `string`

encode an array of human readable tags in a bytes32 tag readable by iExec's smart contracts

example:
```js
console.log(encodeTag(['tee', 'gpu']));
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `tags` | `string`[] |

#### Returns

`string`

#### Defined in

[src/lib/utils.d.ts:119](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/utils.d.ts#L119)

___

### formatEth

▸ **formatEth**(`wei`): `string`

format a wei amount in Eth

example:
```js
console.log('500000000 wei =' + formatEth('500000000')) + 'ether');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `wei` | [`WeiAmount`](internal_.md#weiamount) |

#### Returns

`string`

#### Defined in

[src/lib/utils.d.ts:101](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/utils.d.ts#L101)

___

### formatRLC

▸ **formatRLC**(`nRLC`): `string`

format a nRLC amount in RLC

 * example:
```js
console.log('500000000 nRLC =' + formatRLC('500000000') + 'RLC');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `nRLC` | [`NRLCAmount`](internal_.md#nrlcamount) |

#### Returns

`string`

#### Defined in

[src/lib/utils.d.ts:110](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/utils.d.ts#L110)

___

### getSignerFromPrivateKey

▸ **getSignerFromPrivateKey**(`host`, `privateKey`, `options?`): [`EnhancedWallet`](../classes/internal_.EnhancedWallet.md)

create a signer connected to the specified blockchain host from a private key

example:
```js
const ethProvider = getSignerFromPrivateKey('http://localhost:8545', '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407');
const iexec = new IExec({ ethProvider });
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `host` | `string` | - |
| `privateKey` | `string` | - |
| `options?` | `Object` | - |
| `options.gasPrice?` | `string` | gas price override |
| `options.providers` | [`ProviderOptions`](../interfaces/internal_.ProviderOptions.md) | providers options |
| `options.getTransactionCount?` | (`blockTag?`: `BlockTag`) => `Promise`<`number`\> | - |

#### Returns

[`EnhancedWallet`](../classes/internal_.EnhancedWallet.md)

#### Defined in

[src/lib/utils.d.ts:22](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/utils.d.ts#L22)

___

### parseEth

▸ **parseEth**(`value`, `defaultUnit?`): `BN`

parse a string formatted Eht value in wei big number

supported units: 'wei', 'kwei', 'mwei', 'gwei', 'szabo', 'finney', 'ether' (or 'eth') default unit 'wei'

example:
```js
console.log('5 gwei =' + parseEth('5 gwei') + 'wei');
console.log('5 gwei =' + parseEth(5, 'gwei') + 'wei');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` |
| `defaultUnit?` | `string` |

#### Returns

`BN`

#### Defined in

[src/lib/utils.d.ts:80](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/utils.d.ts#L80)

___

### parseRLC

▸ **parseRLC**(`value`, `defaultUnit?`): `BN`

parse a string formatted RLC value in nRLC big number

supported units: 'nRLC', 'RLC' default unit 'nRLC'

example:
```js
console.log('5 RLC =' + parseEth('5 RLC') + 'nRLC');
console.log('5 RLC =' + parseEth(5, 'RLC') + 'nRLC');
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` |
| `defaultUnit?` | `string` |

#### Returns

`BN`

#### Defined in

[src/lib/utils.d.ts:92](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/utils.d.ts#L92)

___

### sumTags

▸ **sumTags**(`tags`): `string`

sum an array of bytes32 tags

example:
```js
const appTag = '0x0000000000000000000000000000000000000000000000000000000000000100';
const datasetTag = '0x0000000000000000000000000000000000000000000000000000000000000001';
const requestTag = '0x0000000000000000000000000000000000000000000000000000000000000000';
const workerpoolMinTag = sumTags([appTag, datasetTag, requestTag]);
console.log('workerpoolMinTag', workerpoolMinTag);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `tags` | `string`[] |

#### Returns

`string`

#### Defined in

[src/lib/utils.d.ts:141](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/utils.d.ts#L141)
