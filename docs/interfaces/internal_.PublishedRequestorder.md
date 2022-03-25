[iexec](../README.md) / [Exports](../modules.md) / [{internal}](../modules/internal_.md) / PublishedRequestorder

# Interface: PublishedRequestorder

[{internal}](../modules/internal_.md).PublishedRequestorder

published buy order for computing tasks

## Table of contents

### Properties

- [chainId](internal_.PublishedRequestorder.md#chainid)
- [order](internal_.PublishedRequestorder.md#order)
- [orderHash](internal_.PublishedRequestorder.md#orderhash)
- [publicationTimestamp](internal_.PublishedRequestorder.md#publicationtimestamp)
- [remaining](internal_.PublishedRequestorder.md#remaining)
- [signer](internal_.PublishedRequestorder.md#signer)
- [status](internal_.PublishedRequestorder.md#status)

## Properties

### chainId

• **chainId**: `number`

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:89](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/500b144/src/lib/IExecOrderbookModule.d.ts#L89)

___

### order

• **order**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `app` | `string` |
| `appmaxprice` | `number` |
| `beneficiary` | `string` |
| `callback` | `string` |
| `category` | `number` |
| `dataset` | `string` |
| `datasetmaxprice` | `number` |
| `params` | `string` |
| `salt` | `string` |
| `sign` | `string` |
| `tag` | [`Tag`](../modules/internal_.md#tag) |
| `trust` | `number` |
| `volume` | `number` |
| `workerpool` | `string` |
| `workerpoolmaxprice` | `number` |

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:94](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/500b144/src/lib/IExecOrderbookModule.d.ts#L94)

___

### orderHash

• **orderHash**: `string`

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:88](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/500b144/src/lib/IExecOrderbookModule.d.ts#L88)

___

### publicationTimestamp

• **publicationTimestamp**: `string`

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:93](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/500b144/src/lib/IExecOrderbookModule.d.ts#L93)

___

### remaining

• **remaining**: `number`

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:90](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/500b144/src/lib/IExecOrderbookModule.d.ts#L90)

___

### signer

• **signer**: `string`

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:92](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/500b144/src/lib/IExecOrderbookModule.d.ts#L92)

___

### status

• **status**: `string`

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:91](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/500b144/src/lib/IExecOrderbookModule.d.ts#L91)
