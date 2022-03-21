[iexec](../README.md) / [Exports](../modules.md) / [{internal}](../modules/internal_.md) / PublishedApporder

# Interface: PublishedApporder

[{internal}](../modules/internal_.md).PublishedApporder

published sell order for an app

## Table of contents

### Properties

- [chainId](internal_.PublishedApporder.md#chainid)
- [order](internal_.PublishedApporder.md#order)
- [orderHash](internal_.PublishedApporder.md#orderhash)
- [publicationTimestamp](internal_.PublishedApporder.md#publicationtimestamp)
- [remaining](internal_.PublishedApporder.md#remaining)
- [signer](internal_.PublishedApporder.md#signer)
- [status](internal_.PublishedApporder.md#status)

## Properties

### chainId

• **chainId**: `number`

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:18](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/29964cf/src/lib/IExecOrderbookModule.d.ts#L18)

___

### order

• **order**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `app` | `string` |
| `appprice` | `number` |
| `datasetrestrict` | `string` |
| `requesterrestrict` | `string` |
| `salt` | `string` |
| `sign` | `string` |
| `tag` | [`Tag`](../modules/internal_.md#tag) |
| `volume` | `number` |
| `workerpoolrestrict` | `string` |

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:23](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/29964cf/src/lib/IExecOrderbookModule.d.ts#L23)

___

### orderHash

• **orderHash**: `string`

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:17](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/29964cf/src/lib/IExecOrderbookModule.d.ts#L17)

___

### publicationTimestamp

• **publicationTimestamp**: `string`

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:22](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/29964cf/src/lib/IExecOrderbookModule.d.ts#L22)

___

### remaining

• **remaining**: `number`

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:19](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/29964cf/src/lib/IExecOrderbookModule.d.ts#L19)

___

### signer

• **signer**: `string`

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:21](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/29964cf/src/lib/IExecOrderbookModule.d.ts#L21)

___

### status

• **status**: `string`

#### Defined in

[src/lib/IExecOrderbookModule.d.ts:20](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/29964cf/src/lib/IExecOrderbookModule.d.ts#L20)
