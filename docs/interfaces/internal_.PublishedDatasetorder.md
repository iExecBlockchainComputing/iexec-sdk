[iexec](../README.md) / [Exports](../modules.md) / [<internal\>](../modules/internal_.md) / PublishedDatasetorder

# Interface: PublishedDatasetorder

[<internal>](../modules/internal_.md).PublishedDatasetorder

published sell order for a dataset

## Table of contents

### Properties

- [bulk](internal_.PublishedDatasetorder.md#bulk)
- [chainId](internal_.PublishedDatasetorder.md#chainid)
- [order](internal_.PublishedDatasetorder.md#order)
- [orderHash](internal_.PublishedDatasetorder.md#orderhash)
- [publicationTimestamp](internal_.PublishedDatasetorder.md#publicationtimestamp)
- [remaining](internal_.PublishedDatasetorder.md#remaining)
- [signer](internal_.PublishedDatasetorder.md#signer)
- [status](internal_.PublishedDatasetorder.md#status)

## Properties

### bulk

• `Optional` **bulk**: `boolean`

true if the order allows bulk processing

___

### chainId

• **chainId**: `number`

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
| `tag` | `string` |
| `volume` | `number` |
| `workerpoolrestrict` | `string` |

___

### orderHash

• **orderHash**: `string`

___

### publicationTimestamp

• **publicationTimestamp**: `string`

___

### remaining

• **remaining**: `number`

___

### signer

• **signer**: `string`

___

### status

• **status**: `string`
