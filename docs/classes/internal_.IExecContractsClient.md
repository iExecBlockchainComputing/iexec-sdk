[iexec](../README.md) / [Exports](../modules.md) / [{internal}](../modules/internal_.md) / IExecContractsClient

# Class: IExecContractsClient

[{internal}](../modules/internal_.md).IExecContractsClient

## Table of contents

### Constructors

- [constructor](internal_.IExecContractsClient.md#constructor)

### Properties

- [chainId](internal_.IExecContractsClient.md#chainid)
- [confirms](internal_.IExecContractsClient.md#confirms)
- [flavour](internal_.IExecContractsClient.md#flavour)
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

• **new IExecContractsClient**(`args`)

Create a client for IExec contracts

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.chainId` | `string` \| `number` | id of the chain to use (used to resolve IExec contract address) |
| `args.confirms?` | `number` | number of block to wait for transactions confirmation (default 1) |
| `args.flavour?` | `string` | flavour to use (default standard) |
| `args.hubAddress?` | `string` | override the IExec contract address to target a custom instance |
| `args.isNative?` | `boolean` | true if IExec contract use the chain native token |
| `args.provider` | `Provider` | ethers Provider |
| `args.signer?` | `Signer` | ethers Signer, required to sign transactions and messages |
| `args.useGas?` | `boolean` | if false set the gasPrice to 0 (default true) |

#### Defined in

[src/common/utils/IExecContractsClient.d.ts:9](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/common/utils/IExecContractsClient.d.ts#L9)

## Properties

### chainId

• **chainId**: `string`

current chainId

#### Defined in

[src/common/utils/IExecContractsClient.d.ts:54](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/common/utils/IExecContractsClient.d.ts#L54)

___

### confirms

• **confirms**: `number`

number of block to wait for transactions confirmation

#### Defined in

[src/common/utils/IExecContractsClient.d.ts:83](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/common/utils/IExecContractsClient.d.ts#L83)

___

### flavour

• **flavour**: `string`

current IExec flavour

#### Defined in

[src/common/utils/IExecContractsClient.d.ts:62](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/common/utils/IExecContractsClient.d.ts#L62)

___

### hubAddress

• **hubAddress**: `string`

current IExec contract address

#### Defined in

[src/common/utils/IExecContractsClient.d.ts:66](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/common/utils/IExecContractsClient.d.ts#L66)

___

### isNative

• **isNative**: `string`

true if current instance use native token

#### Defined in

[src/common/utils/IExecContractsClient.d.ts:58](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/common/utils/IExecContractsClient.d.ts#L58)

___

### pocoVersion

• **pocoVersion**: `string`

IExec PoCo ABI version

#### Defined in

[src/common/utils/IExecContractsClient.d.ts:70](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/common/utils/IExecContractsClient.d.ts#L70)

___

### provider

• **provider**: `Provider`

current Provider

#### Defined in

[src/common/utils/IExecContractsClient.d.ts:46](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/common/utils/IExecContractsClient.d.ts#L46)

___

### signer

• `Optional` **signer**: `Signer`

current Signer

#### Defined in

[src/common/utils/IExecContractsClient.d.ts:50](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/common/utils/IExecContractsClient.d.ts#L50)

___

### txOptions

• **txOptions**: `Object`

transaction options

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `gasPrice?` | `string` | gasPrice override |

#### Defined in

[src/common/utils/IExecContractsClient.d.ts:74](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/common/utils/IExecContractsClient.d.ts#L74)

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

#### Defined in

[src/common/utils/IExecContractsClient.d.ts:103](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/common/utils/IExecContractsClient.d.ts#L103)

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

#### Defined in

[src/common/utils/IExecContractsClient.d.ts:99](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/common/utils/IExecContractsClient.d.ts#L99)

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

#### Defined in

[src/common/utils/IExecContractsClient.d.ts:111](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/common/utils/IExecContractsClient.d.ts#L111)

___

### fetchTokenContract

▸ `Optional` **fetchTokenContract**(`resourceName`): `Promise`<`Contract`\>

fetch the IExec token Contract instance, not available when isNative is true

#### Parameters

| Name | Type |
| :------ | :------ |
| `resourceName` | `string` |

#### Returns

`Promise`<`Contract`\>

#### Defined in

[src/common/utils/IExecContractsClient.d.ts:107](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/common/utils/IExecContractsClient.d.ts#L107)

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

#### Defined in

[src/common/utils/IExecContractsClient.d.ts:91](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/common/utils/IExecContractsClient.d.ts#L91)

___

### getIExecContract

▸ **getIExecContract**(): `Contract`

get the IExec Contract instance

#### Returns

`Contract`

#### Defined in

[src/common/utils/IExecContractsClient.d.ts:95](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/common/utils/IExecContractsClient.d.ts#L95)

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

#### Defined in

[src/common/utils/IExecContractsClient.d.ts:87](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/25e3cbc/src/common/utils/IExecContractsClient.d.ts#L87)
