[**iexec**](../../README.md)

***

[iexec](../../globals.md) / [\<internal\>](../README.md) / IExecContractsClient

# Class: IExecContractsClient

## Constructors

### Constructor

> **new IExecContractsClient**(`args`): `IExecContractsClient`

Create a client for IExec contracts

#### Parameters

##### args

###### chainId

`string` \| `number`

id of the chain

###### confirms?

`number`

number of block to wait for transactions confirmation (default 1)

###### hubAddress

`string`

IExec contract address

###### isNative?

`boolean`

true if IExec contract use the chain native token

###### provider

`Provider`

ethers Provider

###### signer?

`Signer`

ethers Signer, required to sign transactions and messages

###### useGas?

`boolean`

if false set the gasPrice to 0 (default true)

#### Returns

`IExecContractsClient`

## Properties

### chainId

> **chainId**: `string`

current chainId

***

### confirms

> **confirms**: `number`

number of block to wait for transactions confirmation

***

### hubAddress

> **hubAddress**: `string`

current IExec contract address

***

### isNative

> **isNative**: `string`

true if current instance use native token

***

### pocoVersion

> **pocoVersion**: `string`

IExec PoCo ABI version

***

### provider

> **provider**: `Provider`

current Provider

***

### signer?

> `optional` **signer**: `Signer`

current Signer

***

### txOptions

> **txOptions**: `object`

transaction options

#### gasPrice?

> `optional` **gasPrice**: `bigint`

gasPrice override

## Methods

### fetchRegistryAddress()

> **fetchRegistryAddress**(`resourceName`): `Promise`\<`string`\>

fetch the IExec registry contract address of specified resource

#### Parameters

##### resourceName

`string`

#### Returns

`Promise`\<`string`\>

***

### fetchRegistryContract()

> **fetchRegistryContract**(`resourceName`): `Promise`\<`Contract`\>

fetch the IExec registry Contract instance of specified resource

#### Parameters

##### resourceName

`string`

#### Returns

`Promise`\<`Contract`\>

***

### fetchTokenAddress()

> **fetchTokenAddress**(`resourceName`): `Promise`\<`string`\>

fetch the IExec token contract address, not available when isNative is true

#### Parameters

##### resourceName

`string`

#### Returns

`Promise`\<`string`\>

***

### fetchTokenContract()?

> `optional` **fetchTokenContract**(`resourceName`): `Promise`\<`Contract`\>

fetch the IExec token Contract instance, not available when isNative is true

#### Parameters

##### resourceName

`string`

#### Returns

`Promise`\<`Contract`\>

***

### getContract()

> **getContract**(`name`, `address`): `Contract`

get a known Contract instance at specified address

#### Parameters

##### name

`string`

##### address

`string`

#### Returns

`Contract`

***

### getIExecContract()

> **getIExecContract**(): `Contract`

get the IExec Contract instance

#### Returns

`Contract`

***

### setSigner()

> **setSigner**(`signer`): `void`

set the signer

#### Parameters

##### signer

`Signer`

#### Returns

`void`
