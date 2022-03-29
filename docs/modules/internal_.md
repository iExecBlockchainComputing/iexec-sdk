[iexec](../README.md) / [Exports](../modules.md) / {internal}

# Namespace: {internal}

## Table of contents

### Classes

- [BrigdeObservable](../classes/internal_.BrigdeObservable.md)
- [DealObservable](../classes/internal_.DealObservable.md)
- [ENSConfigurationObservable](../classes/internal_.ENSConfigurationObservable.md)
- [EnhancedWallet](../classes/internal_.EnhancedWallet.md)
- [IExecContractsClient](../classes/internal_.IExecContractsClient.md)
- [Observable](../classes/internal_.Observable.md)
- [TaskObservable](../classes/internal_.TaskObservable.md)

### Interfaces

- [App](../interfaces/internal_.App.md)
- [ApporderTemplate](../interfaces/internal_.ApporderTemplate.md)
- [Category](../interfaces/internal_.Category.md)
- [ConsumableApporder](../interfaces/internal_.ConsumableApporder.md)
- [ConsumableDatasetorder](../interfaces/internal_.ConsumableDatasetorder.md)
- [ConsumableRequestorder](../interfaces/internal_.ConsumableRequestorder.md)
- [ConsumableWorkerpoolorder](../interfaces/internal_.ConsumableWorkerpoolorder.md)
- [Dataset](../interfaces/internal_.Dataset.md)
- [DatasetorderTemplate](../interfaces/internal_.DatasetorderTemplate.md)
- [HashableApporder](../interfaces/internal_.HashableApporder.md)
- [HashableDatasetorder](../interfaces/internal_.HashableDatasetorder.md)
- [HashableRequestorder](../interfaces/internal_.HashableRequestorder.md)
- [HashableWorkerpoolorder](../interfaces/internal_.HashableWorkerpoolorder.md)
- [IExecConfigArgs](../interfaces/internal_.IExecConfigArgs.md)
- [IExecConfigOptions](../interfaces/internal_.IExecConfigOptions.md)
- [PaginableDeals](../interfaces/internal_.PaginableDeals.md)
- [PaginableOrders](../interfaces/internal_.PaginableOrders.md)
- [ProviderOptions](../interfaces/internal_.ProviderOptions.md)
- [PublishedApporder](../interfaces/internal_.PublishedApporder.md)
- [PublishedDatasetorder](../interfaces/internal_.PublishedDatasetorder.md)
- [PublishedRequestorder](../interfaces/internal_.PublishedRequestorder.md)
- [PublishedWorkerpoolorder](../interfaces/internal_.PublishedWorkerpoolorder.md)
- [RequestorderTemplate](../interfaces/internal_.RequestorderTemplate.md)
- [SignedApporder](../interfaces/internal_.SignedApporder.md)
- [SignedDatasetorder](../interfaces/internal_.SignedDatasetorder.md)
- [SignedRequestorder](../interfaces/internal_.SignedRequestorder.md)
- [SignedWorkerpoolorder](../interfaces/internal_.SignedWorkerpoolorder.md)
- [Workerpool](../interfaces/internal_.Workerpool.md)
- [WorkerpoolorderTemplate](../interfaces/internal_.WorkerpoolorderTemplate.md)

### Type aliases

- [BNish](internal_.md#bnish)
- [Bytes32](internal_.md#bytes32)
- [HumanSingleTag](internal_.md#humansingletag)
- [Multiaddress](internal_.md#multiaddress)
- [NRLCAmount](internal_.md#nrlcamount)
- [Tag](internal_.md#tag)
- [WeiAmount](internal_.md#weiamount)

## Type aliases

### BNish

Ƭ **BNish**: `BN` \| `string` \| `number`

big number like

#### Defined in

[src/lib/types.d.ts:6](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/types.d.ts#L6)

___

### Bytes32

Ƭ **Bytes32**: `string`

bytes 32 hex string

example:
```js
const bytes32 = '0x800e8dca929fd7b6ced10b5f84487c49f7be79b2eed662827eccba258ef883c6';
```

#### Defined in

[src/lib/types.d.ts:46](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/types.d.ts#L46)

___

### HumanSingleTag

Ƭ **HumanSingleTag**: `string`

human redable task tag

example:
```js
const teeTag = 'tee';
```

#### Defined in

[src/lib/types.d.ts:115](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/types.d.ts#L115)

___

### Multiaddress

Ƭ **Multiaddress**: `string` \| `Buffer`

multiaddress

example:
```js
const url = 'https://example.com/foo.bar'
const ipfs = '/ipfs/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ'
```

#### Defined in

[src/lib/types.d.ts:135](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/types.d.ts#L135)

___

### NRLCAmount

Ƭ **NRLCAmount**: `number` \| `string` \| `BN`

nRLC amount (nRLC stands for nano RLC, the smallest sub-division of the RLC token: 1 RLC = 1,000,000,000 RLC).

named units ('nRLC', 'RLC') can be used with the format `${amount} ${unit}`

examples:
```js
// number
const oneNRLC = 1;
const tenRLC = 1000000000;
// string (works for amounts above `Number.MAX_SAFE_INTEGER`)
const tenMillionRLC = '10000000000000000';
// string with unit
const fiveRLC = '5 RLC';
const zeroPointOneRLC = '0.1 RLC';
// BN (from utils)
const tenNRLC = new BN(10);
```

#### Defined in

[src/lib/types.d.ts:106](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/types.d.ts#L106)

___

### Tag

Ƭ **Tag**: [`Bytes32`](internal_.md#bytes32) \| [`HumanSingleTag`](internal_.md#humansingletag)[]

task tag used to specify the runtime

example:
```js
const onlyTeeTag = ['tee'];
const teePlusGpuTags = ['tee','gpu'];
```

#### Defined in

[src/lib/types.d.ts:125](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/types.d.ts#L125)

___

### WeiAmount

Ƭ **WeiAmount**: `number` \| `string` \| `BN`

wei amount (wei is the smallest sub-division of ether: 1 ether = 1,000,000,000,000,000,000 wei).

named units ('wei', 'kwei', 'mwei', 'gwei', 'szabo', 'finney', 'ether' or 'eth') can be used with the format `${amount} ${unit}`

examples:
```js
// number
const oneWei = 1;
const tenGigaWei = 1000000000;
// string (works for amounts above `Number.MAX_SAFE_INTEGER`)
const oneEth = '1000000000000000000';
// string with unit
const fiveGigaWei = '5 gwei';
const zeroPointOneEth = '0.1 ether';
// BN (from utils)
const tenWei = new BN(10);
```

#### Defined in

[src/lib/types.d.ts:86](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/73dc692/src/lib/types.d.ts#L86)
