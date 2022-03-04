[iexec](../README.md) / [Exports](../modules.md) / [{internal}](../modules/internal_.md) / PublishedDatasetorder

# Interface: PublishedDatasetorder

[{internal}](../modules/internal_.md).PublishedDatasetorder

published sell order for a dataset

## Table of contents

### Properties

- [chainId](internal_.PublishedDatasetorder.md#chainid)
- [order](internal_.PublishedDatasetorder.md#order)
- [orderHash](internal_.PublishedDatasetorder.md#orderhash)
- [publicationTimestamp](internal_.PublishedDatasetorder.md#publicationtimestamp)
- [remaining](internal_.PublishedDatasetorder.md#remaining)
- [signer](internal_.PublishedDatasetorder.md#signer)
- [status](internal_.PublishedDatasetorder.md#status)

## Properties

### chainId

• **chainId**: `number`

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:41](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/92c9bf6/src/lib/IExecOrderbookModule.d.ts#L41)

___

### order

• **order**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `apprestrict` | `string` |
| `dataset` | `string` |
| `datasetprice` | `number` |
| `requesterrestrict` | `string` |
| `salt` | `string` |
| `sign` | `string` |
| `tag` | [`Tag`](../modules/internal_.md#tag) |
| `volume` | `number` |
| `workerpoolrestrict` | `string` |

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:46](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/92c9bf6/src/lib/IExecOrderbookModule.d.ts#L46)

___

### orderHash

• **orderHash**: `string`

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:40](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/92c9bf6/src/lib/IExecOrderbookModule.d.ts#L40)

___

### publicationTimestamp

• **publicationTimestamp**: `string`

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:45](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/92c9bf6/src/lib/IExecOrderbookModule.d.ts#L45)

___

### remaining

• **remaining**: `number`

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:42](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/92c9bf6/src/lib/IExecOrderbookModule.d.ts#L42)

___

### signer

• **signer**: `string`

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:44](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/92c9bf6/src/lib/IExecOrderbookModule.d.ts#L44)

___

### status

• **status**: `string`

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:43](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/92c9bf6/src/lib/IExecOrderbookModule.d.ts#L43)
