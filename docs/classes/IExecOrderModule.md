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
- [hashApporder](IExecOrderModule.md#hashapporder)
- [hashDatasetorder](IExecOrderModule.md#hashdatasetorder)
- [hashRequestorder](IExecOrderModule.md#hashrequestorder)
- [hashWorkerpoolorder](IExecOrderModule.md#hashworkerpoolorder)
- [matchOrders](IExecOrderModule.md#matchorders)
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

• **new IExecOrderModule**(`configOrArgs`, `options?`)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/internal_.IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/internal_.IExecConfigOptions.md) |

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

▸ **cancelApporder**(`apporder`): `Promise`<{ `order`: [`ConsumableApporder`](../interfaces/internal_.ConsumableApporder.md) ; `txHash`: `string`  }\>

**ONLY APP OWNER**

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

`Promise`<{ `order`: [`ConsumableApporder`](../interfaces/internal_.ConsumableApporder.md) ; `txHash`: `string`  }\>

___

### cancelDatasetorder

▸ **cancelDatasetorder**(`datasetorder`): `Promise`<{ `order`: [`ConsumableDatasetorder`](../interfaces/internal_.ConsumableDatasetorder.md) ; `txHash`: `string`  }\>

**ONLY DATASET OWNER**

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

`Promise`<{ `order`: [`ConsumableDatasetorder`](../interfaces/internal_.ConsumableDatasetorder.md) ; `txHash`: `string`  }\>

___

### cancelRequestorder

▸ **cancelRequestorder**(`requestorder`): `Promise`<{ `order`: [`ConsumableRequestorder`](../interfaces/internal_.ConsumableRequestorder.md) ; `txHash`: `string`  }\>

**ONLY REQUESTER**

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

`Promise`<{ `order`: [`ConsumableRequestorder`](../interfaces/internal_.ConsumableRequestorder.md) ; `txHash`: `string`  }\>

___

### cancelWorkerpoolorder

▸ **cancelWorkerpoolorder**(`workerpoolorder`): `Promise`<{ `order`: [`ConsumableWorkerpoolorder`](../interfaces/internal_.ConsumableWorkerpoolorder.md) ; `txHash`: `string`  }\>

**ONLY WORKERPOOL OWNER**

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

`Promise`<{ `order`: [`ConsumableWorkerpoolorder`](../interfaces/internal_.ConsumableWorkerpoolorder.md) ; `txHash`: `string`  }\>

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
| `overrides.appprice?` | [`NRLCAmount`](../modules/internal_.md#nrlcamount) | price per task  default `0` |
| `overrides.datasetrestrict?` | `string` | restrict usage to a specific dataset  default no restrict |
| `overrides.requesterrestrict?` | `string` | restrict usage to a specific requester  default no restrict |
| `overrides.tag?` | [`Tag`](../modules/internal_.md#tag) \| `string`[] | restrict usage to runtimes with specified tags  default `[]` |
| `overrides.volume?` | [`BNish`](../modules/internal_.md#bnish) | volume of tasks executable with the order  default `1` |
| `overrides.workerpoolrestrict?` | `string` | restrict usage to a specific workerpool  default no restrict |

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
| `overrides.apprestrict?` | `string` | restrict usage to a specific app  default no restrict |
| `overrides.dataset` | `string` | - |
| `overrides.datasetprice?` | [`NRLCAmount`](../modules/internal_.md#nrlcamount) | price per task  default `0` |
| `overrides.requesterrestrict?` | `string` | restrict usage to a specific requester  default no restrict |
| `overrides.tag?` | [`Tag`](../modules/internal_.md#tag) \| `string`[] | restrict usage to runtimes with specified tags  default `[]` |
| `overrides.volume?` | [`BNish`](../modules/internal_.md#bnish) | volume of tasks executable with the order  default `1` |
| `overrides.workerpoolrestrict?` | `string` | restrict usage to a specific workerpool  default no restrict |

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
| `overrides.appmaxprice?` | [`NRLCAmount`](../modules/internal_.md#nrlcamount) | app max price per task  default `0` |
| `overrides.beneficiary?` | `string` | beneficiary  default connected wallet address |
| `overrides.category` | [`BNish`](../modules/internal_.md#bnish) | computation category |
| `overrides.dataset?` | `string` | dataset to use  default none |
| `overrides.datasetmaxprice?` | [`NRLCAmount`](../modules/internal_.md#nrlcamount) | dataset max price per task  default `0` |
| `overrides.params?` | `string` \| { `iexec_args?`: `string` ; `iexec_developer_logger?`: `boolean` ; `iexec_input_files?`: `string`[] ; `iexec_result_encryption?`: `boolean` ; `iexec_result_storage_provider?`: `string` ; `iexec_result_storage_proxy?`: `string`  } | execution parameters |
| `overrides.requester?` | `string` | requester  default connected wallet address |
| `overrides.tag?` | [`Tag`](../modules/internal_.md#tag) \| `string`[] | restrict usage to runtimes with specified tags  default `[]` |
| `overrides.trust?` | [`BNish`](../modules/internal_.md#bnish) | required trust  default `0` |
| `overrides.volume?` | [`BNish`](../modules/internal_.md#bnish) | volume of tasks executable with the order  default `1` |
| `overrides.workerpool?` | `string` | run one sprecified workerpool  default run on any workerpool |
| `overrides.workerpoolmaxprice?` | [`NRLCAmount`](../modules/internal_.md#nrlcamount) | workerpool max price per task  default `0` |

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
| `overrides.apprestrict?` | `string` | restrict usage to a specific app  default no restrict |
| `overrides.category` | [`BNish`](../modules/internal_.md#bnish) | computation category |
| `overrides.datasetrestrict?` | `string` | restrict usage to a specific dataset  default no restrict |
| `overrides.requesterrestrict?` | `string` | restrict usage to a specific requester  default no restrict |
| `overrides.tag?` | [`Tag`](../modules/internal_.md#tag) \| `string`[] | proposed tags  default `[]` |
| `overrides.trust?` | [`BNish`](../modules/internal_.md#bnish) | proposed trust  default `0` |
| `overrides.volume?` | [`BNish`](../modules/internal_.md#bnish) | volume of tasks executable with the order  default `1` |
| `overrides.workerpool` | `string` | - |
| `overrides.workerpoolprice?` | [`NRLCAmount`](../modules/internal_.md#nrlcamount) | price per task  default `0` |

#### Returns

`Promise`<[`WorkerpoolorderTemplate`](../interfaces/internal_.WorkerpoolorderTemplate.md)\>

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

▸ **matchOrders**(`orders`, `options?`): `Promise`<{ `dealid`: `string` ; `txHash`: `string` ; `volume`: `BN`  }\>

make a deal on-chain with compatible orders to trigger the off-chain computation.

_NB_: advanced checks are performed on the requestorder before signing (this helps detecting inconsistancies and prevent creating always failing tasks). these checks can be disabled by passing the option `checkRequest: false`

```js
const { dealid, txHash } = await matchOrders({
  apporder,
  workerpoolorder,
  requestorder,
});
console.log(`created deal ${dealid} in tx ${txHash}`);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `orders` | `Object` |
| `orders.apporder` | [`ConsumableApporder`](../interfaces/internal_.ConsumableApporder.md) |
| `orders.datasetorder?` | [`ConsumableDatasetorder`](../interfaces/internal_.ConsumableDatasetorder.md) |
| `orders.requestorder` | [`ConsumableRequestorder`](../interfaces/internal_.ConsumableRequestorder.md) |
| `orders.workerpoolorder` | [`ConsumableWorkerpoolorder`](../interfaces/internal_.ConsumableWorkerpoolorder.md) |
| `options?` | `Object` |
| `options.checkRequest?` | `boolean` |

#### Returns

`Promise`<{ `dealid`: `string` ; `txHash`: `string` ; `volume`: `BN`  }\>

___

### publishApporder

▸ **publishApporder**(`apporder`): `Promise`<`string`\>

**ONLY APP OWNER**

publish an apporder on the off-chain marketplace making it available for other users

example:
```js
const orderHash = await publishApporder(apporder);
console.log('published order hash:', orderHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `apporder` | [`ConsumableApporder`](../interfaces/internal_.ConsumableApporder.md) |

#### Returns

`Promise`<`string`\>

___

### publishDatasetorder

▸ **publishDatasetorder**(`datasetorder`): `Promise`<`string`\>

**ONLY DATASET OWNER**

publish a datasetorder on the off-chain marketplace making it available for other users

example:
```js
const orderHash = await publishDatasetorder(datasetorder);
console.log('published order hash:', orderHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `datasetorder` | [`ConsumableDatasetorder`](../interfaces/internal_.ConsumableDatasetorder.md) |

#### Returns

`Promise`<`string`\>

___

### publishRequestorder

▸ **publishRequestorder**(`requestorder`, `options?`): `Promise`<`string`\>

**ONLY REQUESTER**

publish a requestorder on the off-chain marketplace making it available for other users

_NB_: advanced checks are performed on the requestorder before signing (this helps detecting inconsistancies and prevent creating always failing tasks). these checks can be disabled by passing the option `checkRequest: false`

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
| `options.checkRequest?` | `boolean` |

#### Returns

`Promise`<`string`\>

___

### publishWorkerpoolorder

▸ **publishWorkerpoolorder**(`workerpoolorder`): `Promise`<`string`\>

**ONLY WORKERPOOL OWNER**

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

▸ **signApporder**(`apporderTemplate`): `Promise`<[`SignedApporder`](../interfaces/internal_.SignedApporder.md)\>

**ONLY APP OWNER**

sign an apporder template to create a valid order

example:
```js
const apporderTemplate = await createApporder({app: appAddress});
const apporder = await signApporder(apporderTemplate);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `apporderTemplate` | [`ApporderTemplate`](../interfaces/internal_.ApporderTemplate.md) |

#### Returns

`Promise`<[`SignedApporder`](../interfaces/internal_.SignedApporder.md)\>

___

### signDatasetorder

▸ **signDatasetorder**(`datasetorderTemplate`): `Promise`<[`SignedDatasetorder`](../interfaces/internal_.SignedDatasetorder.md)\>

**ONLY DATASET OWNER**

sign a datasetorder template to create a valid order

example:
```js
const datasetorderTemplate = await createDatasetorder({dataset: datasetAddress});
const datasetorder = await signDatasetorder(datasetorderTemplate);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `datasetorderTemplate` | [`DatasetorderTemplate`](../interfaces/internal_.DatasetorderTemplate.md) |

#### Returns

`Promise`<[`SignedDatasetorder`](../interfaces/internal_.SignedDatasetorder.md)\>

___

### signRequestorder

▸ **signRequestorder**(`requestorderTemplate`, `options?`): `Promise`<[`SignedRequestorder`](../interfaces/internal_.SignedRequestorder.md)\>

**ONLY REQUESTER**

sign a requestorder template to create a valid order

_NB_: advanced checks are performed on the requestorder before signing (this helps detecting inconsistancies and prevent creating always failing tasks). these checks can be disabled by passing the option `checkRequest: false`

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
| `requestorderTemplate` | [`RequestorderTemplate`](../interfaces/internal_.RequestorderTemplate.md) |
| `options?` | `Object` |
| `options.checkRequest?` | `boolean` |

#### Returns

`Promise`<[`SignedRequestorder`](../interfaces/internal_.SignedRequestorder.md)\>

___

### signWorkerpoolorder

▸ **signWorkerpoolorder**(`workerpoolorderTemplate`): `Promise`<[`SignedWorkerpoolorder`](../interfaces/internal_.SignedWorkerpoolorder.md)\>

**ONLY WORKERPOOL OWNER**

sign a workerpoolorder template to create a valid order

```js
const workerpoolorderTemplate = await createWorkerpoolorder({workerpool: workerpoolAddress, category: 0});
const workerpoolorder = await signWorkerpoolorder(workerpoolorderTemplate);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `workerpoolorderTemplate` | [`WorkerpoolorderTemplate`](../interfaces/internal_.WorkerpoolorderTemplate.md) |

#### Returns

`Promise`<[`SignedWorkerpoolorder`](../interfaces/internal_.SignedWorkerpoolorder.md)\>

___

### unpublishAllApporders

▸ **unpublishAllApporders**(`appAddress`): `Promise`<`string`[]\>

**ONLY APPORDER SIGNER**

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

**ONLY DATASETORDER SIGNER**

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

**ONLY REQUESTER**

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

**ONLY WORKERPOOLORDER SIGNER**

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

**ONLY APPORDER SIGNER**

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

**ONLY DATASETORDER SIGNER**

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

**ONLY APPORDER SIGNER**

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

**ONLY DATASETORDER SIGNER**

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

**ONLY REQUESTER**

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

**ONLY WORKERPOOLORDER SIGNER**

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

**ONLY REQUESTER**

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

**ONLY WORKERPOOLORDER SIGNER**

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

▸ `Static` **fromConfig**(`config`): [`IExecOrderModule`](IExecOrderModule.md)

Create an IExecOrderModule instance using an IExecConfig instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExecOrderModule`](IExecOrderModule.md)

#### Overrides

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)
