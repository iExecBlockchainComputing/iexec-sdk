[iexec](../README.md) / [Exports](../modules.md) / [<internal\>](../modules/internal_.md) / IExecContractsClient

# Class: IExecContractsClient

[<internal>](../modules/internal_.md).IExecContractsClient

## Table of contents

### Constructors

- [constructor](internal_.IExecContractsClient.md#constructor)

### Properties

- [chainId](internal_.IExecContractsClient.md#chainid)
- [confirms](internal_.IExecContractsClient.md#confirms)
- [hubAddress](internal_.IExecContractsClient.md#hubaddress)
- [isNative](internal_.IExecContractsClient.md#isnative)
- [pocoVersion](internal_.IExecContractsClient.md#pocoversion)
- [provider](internal_.IExecContractsClient.md#provider)
- [signer](internal_.IExecContractsClient.md#signer)
- [txOptions](internal_.IExecContractsClient.md#txoptions)

### Methods

- [fetchRegistryAddress](internal_.IExecContractsClient.md#fetchregistryaddress)
- [fetchRegistryContract](internal_.IExecContractsClient.md#fetchregistrycontract)
- [fetchTokenAddress](internal_.IExecContractsClient.md#fetchtokenaddress)
- [fetchTokenContract](internal_.IExecContractsClient.md#fetchtokencontract)
- [getContract](internal_.IExecContractsClient.md#getcontract)
- [getIExecContract](internal_.IExecContractsClient.md#getiexeccontract)
- [setSigner](internal_.IExecContractsClient.md#setsigner)

## Constructors

### constructor

• **new IExecContractsClient**(`args`): [`IExecContractsClient`](internal_.IExecContractsClient.md)

Create a client for IExec contracts

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.chainId` | `string` \| `number` | id of the chain |
| `args.confirms?` | `number` | number of block to wait for transactions confirmation (default 1) |
| `args.hubAddress` | `string` | IExec contract address |
| `args.isNative?` | `boolean` | true if IExec contract use the chain native token |
| `args.provider` | `Provider` | ethers Provider |
| `args.signer?` | `Signer` | ethers Signer, required to sign transactions and messages |
| `args.useGas?` | `boolean` | if false set the gasPrice to 0 (default true) |

#### Returns

[`IExecContractsClient`](internal_.IExecContractsClient.md)

## Properties

### chainId

• **chainId**: `string`

current chainId

___

### confirms

• **confirms**: `number`

number of block to wait for transactions confirmation

___

### hubAddress

• **hubAddress**: `string`

current IExec contract address

___

### isNative

• **isNative**: `string`

true if current instance use native token

___

### pocoVersion

• **pocoVersion**: `string`

IExec PoCo ABI version

___

### provider

• **provider**: `Provider`

current Provider

___

### signer

• `Optional` **signer**: `Signer`

current Signer

___

### txOptions

• **txOptions**: `Object`

transaction options

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `gasPrice?` | `bigint` | gasPrice override |

## Methods

### fetchRegistryAddress

▸ **fetchRegistryAddress**(`resourceName`): `Promise`<`string`\>

fetch the IExec registry contract address of specified resource

#### Parameters

| Name | Type |
| :------ | :------ |
| `resourceName` | `string` |

#### Returns

`Promise`<`string`\>

___

### fetchRegistryContract

▸ **fetchRegistryContract**(`resourceName`): `Promise`<`Contract`\>

fetch the IExec registry Contract instance of specified resource

#### Parameters

| Name | Type |
| :------ | :------ |
| `resourceName` | `string` |

#### Returns

`Promise`<`Contract`\>

___

### fetchTokenAddress

▸ **fetchTokenAddress**(`resourceName`): `Promise`<`string`\>

fetch the IExec token contract address, not available when isNative is true

#### Parameters

| Name | Type |
| :------ | :------ |
| `resourceName` | `string` |

#### Returns

`Promise`<`string`\>

___

### fetchTokenContract

▸ **fetchTokenContract**(`resourceName`): `Promise`<`Contract`\>

fetch the IExec token Contract instance, not available when isNative is true

#### Parameters

| Name | Type |
| :------ | :------ |
| `resourceName` | `string` |

#### Returns

`Promise`<`Contract`\>

___

### getContract

▸ **getContract**(`name`, `address`): `Contract`

get a known Contract instance at specified address

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |
| `address` | `string` |

#### Returns

`Contract`

___

### getIExecContract

▸ **getIExecContract**(): `Contract`

get the IExec Contract instance

#### Returns

`Contract`

___

### setSigner

▸ **setSigner**(`signer`): `void`

set the signer

#### Parameters

| Name | Type |
| :------ | :------ |
| `signer` | `Signer` |

#### Returns

`void`
