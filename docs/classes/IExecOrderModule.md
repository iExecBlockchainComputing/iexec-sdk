[iexec](../README.md) / [Exports](../modules.md) / IExecOrderModule

# Class: IExecOrderModule

module exposing order methods

## Hierarchy

- [`IExecModule`](IExecModule.md)

  ↳ **`IExecOrderModule`**

## Table of contents

### Constructors

- [constructor](IExecOrderModule.md#constructor)

### Properties

- [config](IExecOrderModule.md#config)

### Methods

- [cancelApporder](IExecOrderModule.md#cancelapporder)
- [cancelDatasetorder](IExecOrderModule.md#canceldatasetorder)
- [cancelRequestorder](IExecOrderModule.md#cancelrequestorder)
- [cancelWorkerpoolorder](IExecOrderModule.md#cancelworkerpoolorder)
- [createApporder](IExecOrderModule.md#createapporder)
- [createDatasetorder](IExecOrderModule.md#createdatasetorder)
- [createRequestorder](IExecOrderModule.md#createrequestorder)
- [createWorkerpoolorder](IExecOrderModule.md#createworkerpoolorder)
- [estimateMatchOrders](IExecOrderModule.md#estimatematchorders)
- [hashApporder](IExecOrderModule.md#hashapporder)
- [hashDatasetorder](IExecOrderModule.md#hashdatasetorder)
- [hashRequestorder](IExecOrderModule.md#hashrequestorder)
- [hashWorkerpoolorder](IExecOrderModule.md#hashworkerpoolorder)
- [matchOrders](IExecOrderModule.md#matchorders)
- [prepareDatasetBulk](IExecOrderModule.md#preparedatasetbulk)
- [publishApporder](IExecOrderModule.md#publishapporder)
- [publishDatasetorder](IExecOrderModule.md#publishdatasetorder)
- [publishRequestorder](IExecOrderModule.md#publishrequestorder)
- [publishWorkerpoolorder](IExecOrderModule.md#publishworkerpoolorder)
- [signApporder](IExecOrderModule.md#signapporder)
- [signDatasetorder](IExecOrderModule.md#signdatasetorder)
- [signRequestorder](IExecOrderModule.md#signrequestorder)
- [signWorkerpoolorder](IExecOrderModule.md#signworkerpoolorder)
- [unpublishAllApporders](IExecOrderModule.md#unpublishallapporders)
- [unpublishAllDatasetorders](IExecOrderModule.md#unpublishalldatasetorders)
- [unpublishAllRequestorders](IExecOrderModule.md#unpublishallrequestorders)
- [unpublishAllWorkerpoolorders](IExecOrderModule.md#unpublishallworkerpoolorders)
- [unpublishApporder](IExecOrderModule.md#unpublishapporder)
- [unpublishDatasetorder](IExecOrderModule.md#unpublishdatasetorder)
- [unpublishLastApporder](IExecOrderModule.md#unpublishlastapporder)
- [unpublishLastDatasetorder](IExecOrderModule.md#unpublishlastdatasetorder)
- [unpublishLastRequestorder](IExecOrderModule.md#unpublishlastrequestorder)
- [unpublishLastWorkerpoolorder](IExecOrderModule.md#unpublishlastworkerpoolorder)
- [unpublishRequestorder](IExecOrderModule.md#unpublishrequestorder)
- [unpublishWorkerpoolorder](IExecOrderModule.md#unpublishworkerpoolorder)
- [fromConfig](IExecOrderModule.md#fromconfig)

## Constructors

### constructor

• **new IExecOrderModule**(`configOrArgs`, `options?`): [`IExecOrderModule`](IExecOrderModule.md)

Create an IExecModule instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/IExecConfigOptions.md) |

#### Returns

[`IExecOrderModule`](IExecOrderModule.md)

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

## Methods

### cancelApporder

▸ **cancelApporder**(`apporder`): `Promise`<{ `order`: [`SignedApporder`](../interfaces/internal_.SignedApporder.md) ; `txHash`: `string`  }\>

**SIGNER REQUIRED, ONLY APP OWNER**

cancel an apporder on the blockchain making it invalid

example:
```js
const { txHash } = await cancelApporder(apporder);
console.log('cancel tx:', txHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `apporder` | [`ConsumableApporder`](../interfaces/internal_.ConsumableApporder.md) |

#### Returns

`Promise`<{ `order`: [`SignedApporder`](../interfaces/internal_.SignedApporder.md) ; `txHash`: `string`  }\>

___

### cancelDatasetorder

▸ **cancelDatasetorder**(`datasetorder`): `Promise`<{ `order`: [`SignedDatasetorder`](../interfaces/internal_.SignedDatasetorder.md) ; `txHash`: `string`  }\>

**SIGNER REQUIRED, ONLY DATASET OWNER**

cancel a datasetorder on the blockchain making it invalid

example:
```js
const { txHash } = await cancelDatasetorder(datasetorder);
console.log('cancel tx:', txHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `datasetorder` | [`ConsumableDatasetorder`](../interfaces/internal_.ConsumableDatasetorder.md) |

#### Returns

`Promise`<{ `order`: [`SignedDatasetorder`](../interfaces/internal_.SignedDatasetorder.md) ; `txHash`: `string`  }\>

___

### cancelRequestorder

▸ **cancelRequestorder**(`requestorder`): `Promise`<{ `order`: [`SignedRequestorder`](../interfaces/internal_.SignedRequestorder.md) ; `txHash`: `string`  }\>

**SIGNER REQUIRED, ONLY REQUESTER**

cancel a requestorder on the blockchain making it invalid

example:
```js
const { txHash } = await cancelRequestorder(requestorder);
console.log('cancel tx:', txHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestorder` | [`ConsumableRequestorder`](../interfaces/internal_.ConsumableRequestorder.md) |

#### Returns

`Promise`<{ `order`: [`SignedRequestorder`](../interfaces/internal_.SignedRequestorder.md) ; `txHash`: `string`  }\>

___

### cancelWorkerpoolorder

▸ **cancelWorkerpoolorder**(`workerpoolorder`): `Promise`<{ `order`: [`SignedWorkerpoolorder`](../interfaces/internal_.SignedWorkerpoolorder.md) ; `txHash`: `string`  }\>

**SIGNER REQUIRED, ONLY WORKERPOOL OWNER**

cancel a workerpoolorder on the blockchain making it invalid

example:
```js
const { txHash } = await cancelWorkerpoolorder(workerpoolorder);
console.log('cancel tx:', txHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `workerpoolorder` | [`ConsumableWorkerpoolorder`](../interfaces/internal_.ConsumableWorkerpoolorder.md) |

#### Returns

`Promise`<{ `order`: [`SignedWorkerpoolorder`](../interfaces/internal_.SignedWorkerpoolorder.md) ; `txHash`: `string`  }\>

___

### createApporder

▸ **createApporder**(`overrides`): `Promise`<[`ApporderTemplate`](../interfaces/internal_.ApporderTemplate.md)\>

create an apporder template with specified parameters

example:
```js
const apporderTemplate = await createApporder({app: appAddress});
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `overrides` | `Object` | - |
| `overrides.app` | `string` | - |
| `overrides.appprice?` | [`NRLCAmount`](../modules.md#nrlcamount) | price per task default `0` |
| `overrides.datasetrestrict?` | `string` | restrict usage to a specific dataset default no restrict |
| `overrides.requesterrestrict?` | `string` | restrict usage to a specific requester default no restrict |
| `overrides.tag?` | [`Tag`](../modules.md#tag) \| `string`[] | restrict usage to runtime with specified tags default `[]` |
| `overrides.volume?` | [`BNish`](../modules.md#bnish) | volume of tasks executable with the order default `1` |
| `overrides.workerpoolrestrict?` | `string` | restrict usage to a specific workerpool default no restrict |

#### Returns

`Promise`<[`ApporderTemplate`](../interfaces/internal_.ApporderTemplate.md)\>

___

### createDatasetorder

▸ **createDatasetorder**(`overrides`): `Promise`<[`DatasetorderTemplate`](../interfaces/internal_.DatasetorderTemplate.md)\>

create a datasetorder template with specified parameters

example:
```js
const datasetorderTemplate = await createDatasetorder({dataset: datasetAddress});
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `overrides` | `Object` | - |
| `overrides.apprestrict?` | `string` | restrict usage to a specific app default no restrict |
| `overrides.dataset` | `string` | - |
| `overrides.datasetprice?` | [`NRLCAmount`](../modules.md#nrlcamount) | price per task default `0` |
| `overrides.requesterrestrict?` | `string` | restrict usage to a specific requester default no restrict |
| `overrides.tag?` | [`Tag`](../modules.md#tag) \| `string`[] | restrict usage to runtime with specified tags default `[]` |
| `overrides.volume?` | [`BNish`](../modules.md#bnish) | volume of tasks executable with the order default `1` |
| `overrides.workerpoolrestrict?` | `string` | restrict usage to a specific workerpool default no restrict |

#### Returns

`Promise`<[`DatasetorderTemplate`](../interfaces/internal_.DatasetorderTemplate.md)\>

___

### createRequestorder

▸ **createRequestorder**(`overrides`): `Promise`<[`RequestorderTemplate`](../interfaces/internal_.RequestorderTemplate.md)\>

create a requestorder template with specified parameters

example:
```js
const requestorderTemplate = await createRequestorder({
  app: appAddress,
  category: 0,
  params: { iexec_args: 'hello world'}
 });
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `overrides` | `Object` | - |
| `overrides.app` | `string` | app to run |
| `overrides.appmaxprice?` | [`NRLCAmount`](../modules.md#nrlcamount) | app max price per task default `0` |
| `overrides.beneficiary?` | `string` | beneficiary default connected wallet address |
| `overrides.callback?` | `string` | address of the smart contract for on-chain callback with the execution result |
| `overrides.category` | [`BNish`](../modules.md#bnish) | computation category |
| `overrides.dataset?` | `string` | dataset to use default none |
| `overrides.datasetmaxprice?` | [`NRLCAmount`](../modules.md#nrlcamount) | dataset max price per task default `0` |
| `overrides.params?` | `string` \| [`RequestorderParams`](../interfaces/internal_.RequestorderParams.md) | execution parameters |
| `overrides.requester?` | `string` | requester default connected wallet address |
| `overrides.tag?` | [`Tag`](../modules.md#tag) \| `string`[] | restrict usage to runtime with specified tags default `[]` |
| `overrides.trust?` | [`BNish`](../modules.md#bnish) | required trust default `0` |
| `overrides.volume?` | [`BNish`](../modules.md#bnish) | volume of tasks executable with the order default `1` |
| `overrides.workerpool?` | `string` | run one specified workerpool default run on any workerpool |
| `overrides.workerpoolmaxprice?` | [`NRLCAmount`](../modules.md#nrlcamount) | workerpool max price per task default `0` |

#### Returns

`Promise`<[`RequestorderTemplate`](../interfaces/internal_.RequestorderTemplate.md)\>

___

### createWorkerpoolorder

▸ **createWorkerpoolorder**(`overrides`): `Promise`<[`WorkerpoolorderTemplate`](../interfaces/internal_.WorkerpoolorderTemplate.md)\>

create a workerpoolorder template with specified parameters

example:
```js
const workerpoolorderTemplate = await createWorkerpoolorder({workerpool: workerpoolAddress, category: 0});
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `overrides` | `Object` | - |
| `overrides.apprestrict?` | `string` | restrict usage to a specific app default no restrict |
| `overrides.category` | [`BNish`](../modules.md#bnish) | computation category |
| `overrides.datasetrestrict?` | `string` | restrict usage to a specific dataset default no restrict |
| `overrides.requesterrestrict?` | `string` | restrict usage to a specific requester default no restrict |
| `overrides.tag?` | [`Tag`](../modules.md#tag) \| `string`[] | proposed tags default `[]` |
| `overrides.trust?` | [`BNish`](../modules.md#bnish) | proposed trust default `0` |
| `overrides.volume?` | [`BNish`](../modules.md#bnish) | volume of tasks executable with the order default `1` |
| `overrides.workerpool` | `string` | - |
| `overrides.workerpoolprice?` | [`NRLCAmount`](../modules.md#nrlcamount) | price per task default `0` |

#### Returns

`Promise`<[`WorkerpoolorderTemplate`](../interfaces/internal_.WorkerpoolorderTemplate.md)\>

___

### estimateMatchOrders

▸ **estimateMatchOrders**(`orders`, `options?`): `Promise`<{ `sponsored`: [`BN`](utils.BN.md) ; `total`: [`BN`](utils.BN.md) ; `volume`: [`BN`](utils.BN.md)  }\>

estimates the cost of matching the provided orders

example:
```js
const orders = {
  apporder,
  datasetorder
  workerpoolorder,
  requestorder,
};
const result = await estimateMatchOrders(orders, {useVoucher: true});
console.log(`executable volume: ${result.volume} tasks`);
console.log(`total cost for matching orders: ${result.total} nRLC`);
console.log(`sponsored cost covered by voucher: ${result.sponsored} nRLC`);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `orders` | `Object` | - |
| `orders.apporder` | [`ConsumableApporder`](../interfaces/internal_.ConsumableApporder.md) | - |
| `orders.datasetorder?` | [`ConsumableDatasetorder`](../interfaces/internal_.ConsumableDatasetorder.md) | - |
| `orders.requestorder` | [`ConsumableRequestorder`](../interfaces/internal_.ConsumableRequestorder.md) | - |
| `orders.workerpoolorder` | [`ConsumableWorkerpoolorder`](../interfaces/internal_.ConsumableWorkerpoolorder.md) | - |
| `options?` | `Object` | - |
| `options.useVoucher?` | `boolean` | use a voucher contract to sponsor the deal |
| `options.voucherAddress?` | `string` | override the voucher contract to use, must be combined with `useVoucher: true` the user must be authorized by the voucher's owner to use it |

#### Returns

`Promise`<{ `sponsored`: [`BN`](utils.BN.md) ; `total`: [`BN`](utils.BN.md) ; `volume`: [`BN`](utils.BN.md)  }\>

___

### hashApporder

▸ **hashApporder**(`apporder`): `Promise`<`string`\>

compute the hash of an apporder

example:
```js
const orderHash = await hashApporder(apporder);
console.log('order hash:', orderHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `apporder` | [`HashableApporder`](../interfaces/internal_.HashableApporder.md) |

#### Returns

`Promise`<`string`\>

___

### hashDatasetorder

▸ **hashDatasetorder**(`datasetorder`): `Promise`<`string`\>

compute the hash of a datasetorder

example:
```js
const orderHash = await hashDatasetorder(datasetorder);
console.log('order hash:', orderHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `datasetorder` | [`HashableDatasetorder`](../interfaces/internal_.HashableDatasetorder.md) |

#### Returns

`Promise`<`string`\>

___

### hashRequestorder

▸ **hashRequestorder**(`requestorder`): `Promise`<`string`\>

compute the hash of a requestorder

example:
```js
const orderHash = await hashRequestorder(requestorder);
console.log('order hash:', orderHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestorder` | [`HashableRequestorder`](../interfaces/internal_.HashableRequestorder.md) |

#### Returns

`Promise`<`string`\>

___

### hashWorkerpoolorder

▸ **hashWorkerpoolorder**(`workerpoolorder`): `Promise`<`string`\>

compute the hash of a workerpoolorder

example:
```js
const orderHash = await hashWorkerpoolorder(workerpoolorder);
console.log('order hash:', orderHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `workerpoolorder` | [`HashableWorkerpoolorder`](../interfaces/internal_.HashableWorkerpoolorder.md) |

#### Returns

`Promise`<`string`\>

___

### matchOrders

▸ **matchOrders**(`orders`, `options?`): `Promise`<{ `dealid`: `string` ; `txHash`: `string` ; `volume`: [`BN`](utils.BN.md)  }\>

**SIGNER REQUIRED**

make a deal on-chain with compatible orders to trigger the off-chain computation.

_NB_: preflight checks are performed on the orders before signing (this helps detecting inconsistencies and prevent creating always failing tasks). these checks can be disabled by passing the option `preflightCheck: false`

```js
const { dealid, txHash } = await matchOrders({
  apporder,
  workerpoolorder,
  requestorder,
});
console.log(`created deal ${dealid} in tx ${txHash}`);
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `orders` | `Object` | - |
| `orders.apporder` | [`ConsumableApporder`](../interfaces/internal_.ConsumableApporder.md) | - |
| `orders.datasetorder?` | [`ConsumableDatasetorder`](../interfaces/internal_.ConsumableDatasetorder.md) | - |
| `orders.requestorder` | [`ConsumableRequestorder`](../interfaces/internal_.ConsumableRequestorder.md) | - |
| `orders.workerpoolorder` | [`ConsumableWorkerpoolorder`](../interfaces/internal_.ConsumableWorkerpoolorder.md) | - |
| `options?` | `Object` | - |
| `options.preflightCheck?` | `boolean` | - |
| `options.useVoucher?` | `boolean` | use a voucher contract to sponsor the deal |
| `options.voucherAddress?` | `string` | override the voucher contract to use, must be combined with `useVoucher: true` the user must be authorized by the voucher's owner to use it |

#### Returns

`Promise`<{ `dealid`: `string` ; `txHash`: `string` ; `volume`: [`BN`](utils.BN.md)  }\>

___

### prepareDatasetBulk

▸ **prepareDatasetBulk**(`datasetorders`, `options?`): `Promise`<{ `cid`: `string` ; `volume`: `number`  }\>

Prepare a bulk from datasetorders to process multiple datasets with a single requestorder

NB:
- datasetorders used must authorize the requester to use the dataset in for free with an infinite volume (`utils.DATASET_INFINITE_VOLUME`)
- depending on the number of datasetorders provided and the `maxDatasetPerTask` option, the bulk might require be splitted into multiple tasks to respect the max dataset per task limit, the returned `volume` is the number of tasks required to process the bulk

example:
```js
const { bulkCid, volume } = await prepareDatasetBulk(datasetorders, { maxDatasetPerTask: 5 });
console.log(`bulk_cid: ${bulkCid}, volume: ${volume}`);

const requestorderTemplate = await createRequestorder({
  app: appAddress,
  category: 0,
  volume: volume, // set the volume
  params: { bulk_cid: bulkCid } // set the bulk cid in the requestorder params
});
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `datasetorders` | [`ConsumableDatasetorder`](../interfaces/internal_.ConsumableDatasetorder.md)[] | - |
| `options?` | `Object` | - |
| `options.maxDatasetPerTask?` | `number` | Maximum number of datasets to include in a single task **`Default`** ```ts 100 ``` |

#### Returns

`Promise`<{ `cid`: `string` ; `volume`: `number`  }\>

___

### publishApporder

▸ **publishApporder**(`apporder`, `options?`): `Promise`<`string`\>

**SIGNER REQUIRED, ONLY APP OWNER**

publish an apporder on the off-chain marketplace making it available for other users

_NB_: preflight checks are performed on the order before signing (this helps detecting inconsistencies and prevent creating always failing tasks). these checks can be disabled by passing the option `preflightCheck: false`

example:
```js
const orderHash = await publishApporder(apporder);
console.log('published order hash:', orderHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `apporder` | [`ConsumableApporder`](../interfaces/internal_.ConsumableApporder.md) |
| `options?` | `Object` |
| `options.preflightCheck?` | `boolean` |

#### Returns

`Promise`<`string`\>

___

### publishDatasetorder

▸ **publishDatasetorder**(`datasetorder`, `options?`): `Promise`<`string`\>

**SIGNER REQUIRED, ONLY DATASET OWNER**

publish a datasetorder on the off-chain marketplace making it available for other users

_NB_: preflight checks are performed on the order before signing (this helps detecting inconsistencies and prevent creating always failing tasks). these checks can be disabled by passing the option `preflightCheck: false`

example:
```js
const orderHash = await publishDatasetorder(datasetorder);
console.log('published order hash:', orderHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `datasetorder` | [`ConsumableDatasetorder`](../interfaces/internal_.ConsumableDatasetorder.md) |
| `options?` | `Object` |
| `options.preflightCheck?` | `boolean` |

#### Returns

`Promise`<`string`\>

___

### publishRequestorder

▸ **publishRequestorder**(`requestorder`, `options?`): `Promise`<`string`\>

**SIGNER REQUIRED, ONLY REQUESTER**

publish a requestorder on the off-chain marketplace making it available for other users

_NB_: preflight checks are performed on the order before signing (this helps detecting inconsistencies and prevent creating always failing tasks). these checks can be disabled by passing the option `preflightCheck: false`

example:
```js
const orderHash = await publishRequestorder(requestorder);
console.log('published order hash:', orderHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestorder` | [`ConsumableRequestorder`](../interfaces/internal_.ConsumableRequestorder.md) |
| `options?` | `Object` |
| `options.preflightCheck?` | `boolean` |

#### Returns

`Promise`<`string`\>

___

### publishWorkerpoolorder

▸ **publishWorkerpoolorder**(`workerpoolorder`): `Promise`<`string`\>

**SIGNER REQUIRED, ONLY WORKERPOOL OWNER**

publish a workerpoolorder on the off-chain marketplace making it available for other users

example:
```js
const orderHash = await publishWorkerpoolorder(workerpoolorder);
console.log('published order hash:', orderHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `workerpoolorder` | [`ConsumableWorkerpoolorder`](../interfaces/internal_.ConsumableWorkerpoolorder.md) |

#### Returns

`Promise`<`string`\>

___

### signApporder

▸ **signApporder**(`apporder`, `options?`): `Promise`<[`SignedApporder`](../interfaces/internal_.SignedApporder.md)\>

**ONLY APP OWNER**

sign an apporder template to create a valid order

_NB_: preflight checks are performed on the order before signing (this helps detecting inconsistencies and prevent creating always failing tasks). these checks can be disabled by passing the option `preflightCheck: false`

example:
```js
const apporderTemplate = await createApporder({app: appAddress});
const apporder = await signApporder(apporderTemplate);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `apporder` | [`SignableApporder`](../interfaces/internal_.SignableApporder.md) |
| `options?` | `Object` |
| `options.preflightCheck?` | `boolean` |

#### Returns

`Promise`<[`SignedApporder`](../interfaces/internal_.SignedApporder.md)\>

___

### signDatasetorder

▸ **signDatasetorder**(`datasetorder`, `options?`): `Promise`<[`SignedDatasetorder`](../interfaces/internal_.SignedDatasetorder.md)\>

**SIGNER REQUIRED, ONLY DATASET OWNER**

sign a datasetorder template to create a valid order

_NB_: preflight checks are performed on the order before signing (this helps detecting inconsistencies and prevent creating always failing tasks). these checks can be disabled by passing the option `preflightCheck: false`

example:
```js
const datasetorderTemplate = await createDatasetorder({dataset: datasetAddress});
const datasetorder = await signDatasetorder(datasetorderTemplate);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `datasetorder` | [`SignableDatasetorder`](../interfaces/internal_.SignableDatasetorder.md) |
| `options?` | `Object` |
| `options.preflightCheck?` | `boolean` |

#### Returns

`Promise`<[`SignedDatasetorder`](../interfaces/internal_.SignedDatasetorder.md)\>

___

### signRequestorder

▸ **signRequestorder**(`requestorder`, `options?`): `Promise`<[`SignedRequestorder`](../interfaces/internal_.SignedRequestorder.md)\>

**SIGNER REQUIRED, ONLY REQUESTER**

sign a requestorder template to create a valid order

_NB_: preflight checks are performed on the order before signing (this helps detecting inconsistencies and prevent creating always failing tasks). these checks can be disabled by passing the option `preflightCheck: false`

example:
```js
const requestorderTemplate = await createRequestorder({
  app: appAddress,
  category: 0,
  params: { iexec_args: 'hello world'}
 });
const requestorder = await signRequestorder(requestorderTemplate);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestorder` | [`SignableRequestorder`](../interfaces/internal_.SignableRequestorder.md) |
| `options?` | `Object` |
| `options.preflightCheck?` | `boolean` |

#### Returns

`Promise`<[`SignedRequestorder`](../interfaces/internal_.SignedRequestorder.md)\>

___

### signWorkerpoolorder

▸ **signWorkerpoolorder**(`workerpoolorder`): `Promise`<[`SignedWorkerpoolorder`](../interfaces/internal_.SignedWorkerpoolorder.md)\>

**SIGNER REQUIRED, ONLY WORKERPOOL OWNER**

sign a workerpoolorder template to create a valid order

```js
const workerpoolorderTemplate = await createWorkerpoolorder({workerpool: workerpoolAddress, category: 0});
const workerpoolorder = await signWorkerpoolorder(workerpoolorderTemplate);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `workerpoolorder` | [`SignableWorkerpoolorder`](../interfaces/internal_.SignableWorkerpoolorder.md) |

#### Returns

`Promise`<[`SignedWorkerpoolorder`](../interfaces/internal_.SignedWorkerpoolorder.md)\>

___

### unpublishAllApporders

▸ **unpublishAllApporders**(`appAddress`): `Promise`<`string`[]\>

**SIGNER REQUIRED, ONLY APPORDER SIGNER**

unpublish all the published app's apporders from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHashes = await unpublishAllApporders(appAddress);
console.log('published orders count:', orderHashes.length);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `appAddress` | `string` |

#### Returns

`Promise`<`string`[]\>

___

### unpublishAllDatasetorders

▸ **unpublishAllDatasetorders**(`datasetAddress`): `Promise`<`string`[]\>

**SIGNER REQUIRED, ONLY DATASETORDER SIGNER**

unpublish all the published dataset's datasetorders from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHashes = await unpublishAllDatasetorders(datasetAddress);
console.log('unpublished orders count:', orderHashes.length);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `datasetAddress` | `string` |

#### Returns

`Promise`<`string`[]\>

___

### unpublishAllRequestorders

▸ **unpublishAllRequestorders**(): `Promise`<`string`[]\>

**SIGNER REQUIRED, ONLY REQUESTER**

unpublish all the published requester's requestorders from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHashes = await unpublishAllRequestorders();
console.log('unpublished orders count:', orderHashes.length);
```

#### Returns

`Promise`<`string`[]\>

___

### unpublishAllWorkerpoolorders

▸ **unpublishAllWorkerpoolorders**(`workerpoolAddress`): `Promise`<`string`[]\>

**SIGNER REQUIRED, ONLY WORKERPOOLORDER SIGNER**

unpublish all the published workerpool's workerpoolorders from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHashes = await unpublishAllWorkerpoolorders(workerpoolAddress);
console.log('unpublished orders count:', orderHashes.length);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `workerpoolAddress` | `string` |

#### Returns

`Promise`<`string`[]\>

___

### unpublishApporder

▸ **unpublishApporder**(`apporderHash`): `Promise`<`string`\>

**SIGNER REQUIRED, ONLY APPORDER SIGNER**

unpublish an apporder from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHash = await unpublishApporder(apporderHash);
console.log(unpublished order hash:', orderHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `apporderHash` | `string` |

#### Returns

`Promise`<`string`\>

___

### unpublishDatasetorder

▸ **unpublishDatasetorder**(`datasetorderHash`): `Promise`<`string`\>

**SIGNER REQUIRED, ONLY DATASETORDER SIGNER**

unpublish a datasetorder from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHash = await unpublishDatasetorder(datasetorderHash);
console.log('unpublished order hash:', orderHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `datasetorderHash` | `string` |

#### Returns

`Promise`<`string`\>

___

### unpublishLastApporder

▸ **unpublishLastApporder**(`appAddress`): `Promise`<`string`\>

**SIGNER REQUIRED, ONLY APPORDER SIGNER**

unpublish the last published app's apporder from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHash = await unpublishLastApporder(appAddress);
console.log('published order hash:', orderHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `appAddress` | `string` |

#### Returns

`Promise`<`string`\>

___

### unpublishLastDatasetorder

▸ **unpublishLastDatasetorder**(`datasetAddress`): `Promise`<`string`\>

**SIGNER REQUIRED, ONLY DATASETORDER SIGNER**

unpublish the last published dataset's datasetorder from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHash = await unpublishLastDatasetorder(datasetAddress);
console.log('unpublished order hash:', orderHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `datasetAddress` | `string` |

#### Returns

`Promise`<`string`\>

___

### unpublishLastRequestorder

▸ **unpublishLastRequestorder**(): `Promise`<`string`\>

**SIGNER REQUIRED, ONLY REQUESTER**

unpublish the last published requester's requestorder from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHash = await unpublishLastRequestorder();
console.log('unpublished order hash:', orderHash);
```

#### Returns

`Promise`<`string`\>

___

### unpublishLastWorkerpoolorder

▸ **unpublishLastWorkerpoolorder**(`workerpoolAddress`): `Promise`<`string`\>

****SIGNER REQUIRED, ONLY WORKERPOOLORDER SIGNER**

unpublish the last published workerpool's workerpoolorder from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHash = await unpublishLastWorkerpoolorder(workerpoolAddress);
console.log('unpublished order hash:', orderHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `workerpoolAddress` | `string` |

#### Returns

`Promise`<`string`\>

___

### unpublishRequestorder

▸ **unpublishRequestorder**(`requestorderHash`): `Promise`<`string`\>

**SIGNER REQUIRED, ONLY REQUESTER**

unpublish a requestorder from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHash = await unpublishRequestorder(requestorderHash);
console.log('unpublished order hash:', orderHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `requestorderHash` | `string` |

#### Returns

`Promise`<`string`\>

___

### unpublishWorkerpoolorder

▸ **unpublishWorkerpoolorder**(`workerpoolorderHash`): `Promise`<`string`\>

**SIGNER REQUIRED, ONLY WORKERPOOLORDER SIGNER**

unpublish a workerpoolorder from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHash = await unpublishWorkerpoolorder(workerpoolorderHash);
console.log('unpublished order hash:', orderHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `workerpoolorderHash` | `string` |

#### Returns

`Promise`<`string`\>

___

### fromConfig

▸ **fromConfig**(`config`): [`IExecOrderModule`](IExecOrderModule.md)

Create an IExecOrderModule instance using an IExecConfig instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExecOrderModule`](IExecOrderModule.md)

#### Overrides

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)
