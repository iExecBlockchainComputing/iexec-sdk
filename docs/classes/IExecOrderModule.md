[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecOrderModule

# Class: IExecOrderModule

module exposing order methods

## Extends

- [`IExecModule`](IExecModule.md)

## Constructors

### Constructor

> **new IExecOrderModule**(`configOrArgs`, `options?`): `IExecOrderModule`

Create an IExecModule instance

#### Parameters

##### configOrArgs

[`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) | [`IExecConfig`](IExecConfig.md)

##### options?

[`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)

#### Returns

`IExecOrderModule`

#### Inherited from

[`IExecModule`](IExecModule.md).[`constructor`](IExecModule.md#constructor)

## Properties

### config

> **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[`IExecModule`](IExecModule.md).[`config`](IExecModule.md#config)

## Methods

### cancelApporder()

> **cancelApporder**(`apporder`): `Promise`\<\{ `order`: [`SignedApporder`](../-internal-/interfaces/SignedApporder.md); `txHash`: `string`; \}\>

**SIGNER REQUIRED, ONLY APP OWNER**

cancel an apporder on the blockchain making it invalid

example:
```js
const { txHash } = await cancelApporder(apporder);
console.log('cancel tx:', txHash);
```

#### Parameters

##### apporder

[`ConsumableApporder`](../-internal-/interfaces/ConsumableApporder.md)

#### Returns

`Promise`\<\{ `order`: [`SignedApporder`](../-internal-/interfaces/SignedApporder.md); `txHash`: `string`; \}\>

***

### cancelDatasetorder()

> **cancelDatasetorder**(`datasetorder`): `Promise`\<\{ `order`: [`SignedDatasetorder`](../-internal-/interfaces/SignedDatasetorder.md); `txHash`: `string`; \}\>

**SIGNER REQUIRED, ONLY DATASET OWNER**

cancel a datasetorder on the blockchain making it invalid

example:
```js
const { txHash } = await cancelDatasetorder(datasetorder);
console.log('cancel tx:', txHash);
```

#### Parameters

##### datasetorder

[`ConsumableDatasetorder`](../-internal-/interfaces/ConsumableDatasetorder.md)

#### Returns

`Promise`\<\{ `order`: [`SignedDatasetorder`](../-internal-/interfaces/SignedDatasetorder.md); `txHash`: `string`; \}\>

***

### cancelRequestorder()

> **cancelRequestorder**(`requestorder`): `Promise`\<\{ `order`: [`SignedRequestorder`](../-internal-/interfaces/SignedRequestorder.md); `txHash`: `string`; \}\>

**SIGNER REQUIRED, ONLY REQUESTER**

cancel a requestorder on the blockchain making it invalid

example:
```js
const { txHash } = await cancelRequestorder(requestorder);
console.log('cancel tx:', txHash);
```

#### Parameters

##### requestorder

[`ConsumableRequestorder`](../-internal-/interfaces/ConsumableRequestorder.md)

#### Returns

`Promise`\<\{ `order`: [`SignedRequestorder`](../-internal-/interfaces/SignedRequestorder.md); `txHash`: `string`; \}\>

***

### cancelWorkerpoolorder()

> **cancelWorkerpoolorder**(`workerpoolorder`): `Promise`\<\{ `order`: [`SignedWorkerpoolorder`](../-internal-/interfaces/SignedWorkerpoolorder.md); `txHash`: `string`; \}\>

**SIGNER REQUIRED, ONLY WORKERPOOL OWNER**

cancel a workerpoolorder on the blockchain making it invalid

example:
```js
const { txHash } = await cancelWorkerpoolorder(workerpoolorder);
console.log('cancel tx:', txHash);
```

#### Parameters

##### workerpoolorder

[`ConsumableWorkerpoolorder`](../-internal-/interfaces/ConsumableWorkerpoolorder.md)

#### Returns

`Promise`\<\{ `order`: [`SignedWorkerpoolorder`](../-internal-/interfaces/SignedWorkerpoolorder.md); `txHash`: `string`; \}\>

***

### createApporder()

> **createApporder**(`overrides`): `Promise`\<[`ApporderTemplate`](../-internal-/interfaces/ApporderTemplate.md)\>

create an apporder template with specified parameters

example:
```js
const apporderTemplate = await createApporder({app: appAddress});
```

#### Parameters

##### overrides

###### app

`string`

###### appprice?

[`NRLCAmount`](../type-aliases/NRLCAmount.md)

price per task

default `0`

###### datasetrestrict?

`string`

restrict usage to a specific dataset

default no restrict

###### requesterrestrict?

`string`

restrict usage to a specific requester

default no restrict

###### tag?

[`Tag`](../type-aliases/Tag.md) \| `string`[]

restrict usage to runtime with specified tags

default `[]`

###### volume?

[`BNish`](../type-aliases/BNish.md)

volume of tasks executable with the order

default `1`

###### workerpoolrestrict?

`string`

restrict usage to a specific workerpool

default no restrict

#### Returns

`Promise`\<[`ApporderTemplate`](../-internal-/interfaces/ApporderTemplate.md)\>

***

### createDatasetorder()

> **createDatasetorder**(`overrides`): `Promise`\<[`DatasetorderTemplate`](../-internal-/interfaces/DatasetorderTemplate.md)\>

create a datasetorder template with specified parameters

example:
```js
const datasetorderTemplate = await createDatasetorder({dataset: datasetAddress});
```

#### Parameters

##### overrides

###### apprestrict?

`string`

restrict usage to a specific app

default no restrict

###### dataset

`string`

###### datasetprice?

[`NRLCAmount`](../type-aliases/NRLCAmount.md)

price per task

default `0`

###### requesterrestrict?

`string`

restrict usage to a specific requester

default no restrict

###### tag?

[`Tag`](../type-aliases/Tag.md) \| `string`[]

restrict usage to runtime with specified tags

default `[]`

###### volume?

[`BNish`](../type-aliases/BNish.md)

volume of tasks executable with the order

default `1`

###### workerpoolrestrict?

`string`

restrict usage to a specific workerpool

default no restrict

#### Returns

`Promise`\<[`DatasetorderTemplate`](../-internal-/interfaces/DatasetorderTemplate.md)\>

***

### createRequestorder()

> **createRequestorder**(`overrides`): `Promise`\<[`RequestorderTemplate`](../-internal-/interfaces/RequestorderTemplate.md)\>

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

##### overrides

###### app

`string`

app to run

###### appmaxprice?

[`NRLCAmount`](../type-aliases/NRLCAmount.md)

app max price per task

default `0`

###### beneficiary?

`string`

beneficiary

default connected wallet address

###### callback?

`string`

address of the smart contract for on-chain callback with the execution result

###### category

[`BNish`](../type-aliases/BNish.md)

computation category

###### dataset?

`string`

dataset to use

default none

###### datasetmaxprice?

[`NRLCAmount`](../type-aliases/NRLCAmount.md)

dataset max price per task

default `0`

###### params?

`string` \| [`RequestorderParams`](../-internal-/interfaces/RequestorderParams.md)

execution parameters

###### requester?

`string`

requester

default connected wallet address

###### tag?

[`Tag`](../type-aliases/Tag.md) \| `string`[]

restrict usage to runtime with specified tags

default `[]`

###### trust?

[`BNish`](../type-aliases/BNish.md)

required trust

default `0`

###### volume?

[`BNish`](../type-aliases/BNish.md)

volume of tasks executable with the order

default `1`

###### workerpool?

`string`

run one specified workerpool

default run on any workerpool

###### workerpoolmaxprice?

[`NRLCAmount`](../type-aliases/NRLCAmount.md)

workerpool max price per task

default `0`

#### Returns

`Promise`\<[`RequestorderTemplate`](../-internal-/interfaces/RequestorderTemplate.md)\>

***

### createWorkerpoolorder()

> **createWorkerpoolorder**(`overrides`): `Promise`\<[`WorkerpoolorderTemplate`](../-internal-/interfaces/WorkerpoolorderTemplate.md)\>

create a workerpoolorder template with specified parameters

example:
```js
const workerpoolorderTemplate = await createWorkerpoolorder({workerpool: workerpoolAddress, category: 0});
```

#### Parameters

##### overrides

###### apprestrict?

`string`

restrict usage to a specific app

default no restrict

###### category

[`BNish`](../type-aliases/BNish.md)

computation category

###### datasetrestrict?

`string`

restrict usage to a specific dataset

default no restrict

###### requesterrestrict?

`string`

restrict usage to a specific requester

default no restrict

###### tag?

[`Tag`](../type-aliases/Tag.md) \| `string`[]

proposed tags

default `[]`

###### trust?

[`BNish`](../type-aliases/BNish.md)

proposed trust

default `0`

###### volume?

[`BNish`](../type-aliases/BNish.md)

volume of tasks executable with the order

default `1`

###### workerpool

`string`

###### workerpoolprice?

[`NRLCAmount`](../type-aliases/NRLCAmount.md)

price per task

default `0`

#### Returns

`Promise`\<[`WorkerpoolorderTemplate`](../-internal-/interfaces/WorkerpoolorderTemplate.md)\>

***

### estimateMatchOrders()

> **estimateMatchOrders**(`orders`, `options?`): `Promise`\<\{ `sponsored`: [`BN`](../interfaces/BN.md); `total`: [`BN`](../interfaces/BN.md); `volume`: [`BN`](../interfaces/BN.md); \}\>

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

##### orders

###### apporder

[`ConsumableApporder`](../-internal-/interfaces/ConsumableApporder.md)

###### datasetorder?

[`ConsumableDatasetorder`](../-internal-/interfaces/ConsumableDatasetorder.md)

###### requestorder

[`ConsumableRequestorder`](../-internal-/interfaces/ConsumableRequestorder.md)

###### workerpoolorder

[`ConsumableWorkerpoolorder`](../-internal-/interfaces/ConsumableWorkerpoolorder.md)

##### options?

###### useVoucher?

`boolean`

use a voucher contract to sponsor the deal

###### voucherAddress?

`string`

override the voucher contract to use, must be combined with `useVoucher: true`

the user must be authorized by the voucher's owner to use it

#### Returns

`Promise`\<\{ `sponsored`: [`BN`](../interfaces/BN.md); `total`: [`BN`](../interfaces/BN.md); `volume`: [`BN`](../interfaces/BN.md); \}\>

***

### hashApporder()

> **hashApporder**(`apporder`): `Promise`\<`string`\>

compute the hash of an apporder

example:
```js
const orderHash = await hashApporder(apporder);
console.log('order hash:', orderHash);
```

#### Parameters

##### apporder

[`HashableApporder`](../-internal-/interfaces/HashableApporder.md)

#### Returns

`Promise`\<`string`\>

***

### hashDatasetorder()

> **hashDatasetorder**(`datasetorder`): `Promise`\<`string`\>

compute the hash of a datasetorder

example:
```js
const orderHash = await hashDatasetorder(datasetorder);
console.log('order hash:', orderHash);
```

#### Parameters

##### datasetorder

[`HashableDatasetorder`](../-internal-/interfaces/HashableDatasetorder.md)

#### Returns

`Promise`\<`string`\>

***

### hashRequestorder()

> **hashRequestorder**(`requestorder`): `Promise`\<`string`\>

compute the hash of a requestorder

example:
```js
const orderHash = await hashRequestorder(requestorder);
console.log('order hash:', orderHash);
```

#### Parameters

##### requestorder

[`HashableRequestorder`](../-internal-/interfaces/HashableRequestorder.md)

#### Returns

`Promise`\<`string`\>

***

### hashWorkerpoolorder()

> **hashWorkerpoolorder**(`workerpoolorder`): `Promise`\<`string`\>

compute the hash of a workerpoolorder

example:
```js
const orderHash = await hashWorkerpoolorder(workerpoolorder);
console.log('order hash:', orderHash);
```

#### Parameters

##### workerpoolorder

[`HashableWorkerpoolorder`](../-internal-/interfaces/HashableWorkerpoolorder.md)

#### Returns

`Promise`\<`string`\>

***

### matchOrders()

> **matchOrders**(`orders`, `options?`): `Promise`\<\{ `dealid`: `string`; `txHash`: `string`; `volume`: [`BN`](../interfaces/BN.md); \}\>

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

##### orders

###### apporder

[`ConsumableApporder`](../-internal-/interfaces/ConsumableApporder.md)

###### datasetorder?

[`ConsumableDatasetorder`](../-internal-/interfaces/ConsumableDatasetorder.md)

###### requestorder

[`ConsumableRequestorder`](../-internal-/interfaces/ConsumableRequestorder.md)

###### workerpoolorder

[`ConsumableWorkerpoolorder`](../-internal-/interfaces/ConsumableWorkerpoolorder.md)

##### options?

###### preflightCheck?

`boolean`

###### useVoucher?

`boolean`

use a voucher contract to sponsor the deal

###### voucherAddress?

`string`

override the voucher contract to use, must be combined with `useVoucher: true`

the user must be authorized by the voucher's owner to use it

#### Returns

`Promise`\<\{ `dealid`: `string`; `txHash`: `string`; `volume`: [`BN`](../interfaces/BN.md); \}\>

***

### prepareDatasetBulk()

> **prepareDatasetBulk**(`datasetorders`, `options?`): `Promise`\<\{ `cid`: `string`; `volume`: `number`; \}\>

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

##### datasetorders

[`ConsumableDatasetorder`](../-internal-/interfaces/ConsumableDatasetorder.md)[]

##### options?

###### maxDatasetPerTask?

`number`

Maximum number of datasets to include in a single task

**Default**

```ts
100
```

#### Returns

`Promise`\<\{ `cid`: `string`; `volume`: `number`; \}\>

***

### publishApporder()

> **publishApporder**(`apporder`, `options?`): `Promise`\<`string`\>

**SIGNER REQUIRED, ONLY APP OWNER**

publish an apporder on the off-chain marketplace making it available for other users

_NB_: preflight checks are performed on the order before signing (this helps detecting inconsistencies and prevent creating always failing tasks). these checks can be disabled by passing the option `preflightCheck: false`

example:
```js
const orderHash = await publishApporder(apporder);
console.log('published order hash:', orderHash);
```

#### Parameters

##### apporder

[`ConsumableApporder`](../-internal-/interfaces/ConsumableApporder.md)

##### options?

###### preflightCheck?

`boolean`

#### Returns

`Promise`\<`string`\>

***

### publishDatasetorder()

> **publishDatasetorder**(`datasetorder`, `options?`): `Promise`\<`string`\>

**SIGNER REQUIRED, ONLY DATASET OWNER**

publish a datasetorder on the off-chain marketplace making it available for other users

_NB_: preflight checks are performed on the order before signing (this helps detecting inconsistencies and prevent creating always failing tasks). these checks can be disabled by passing the option `preflightCheck: false`

example:
```js
const orderHash = await publishDatasetorder(datasetorder);
console.log('published order hash:', orderHash);
```

#### Parameters

##### datasetorder

[`ConsumableDatasetorder`](../-internal-/interfaces/ConsumableDatasetorder.md)

##### options?

###### preflightCheck?

`boolean`

#### Returns

`Promise`\<`string`\>

***

### publishRequestorder()

> **publishRequestorder**(`requestorder`, `options?`): `Promise`\<`string`\>

**SIGNER REQUIRED, ONLY REQUESTER**

publish a requestorder on the off-chain marketplace making it available for other users

_NB_: preflight checks are performed on the order before signing (this helps detecting inconsistencies and prevent creating always failing tasks). these checks can be disabled by passing the option `preflightCheck: false`

example:
```js
const orderHash = await publishRequestorder(requestorder);
console.log('published order hash:', orderHash);
```

#### Parameters

##### requestorder

[`ConsumableRequestorder`](../-internal-/interfaces/ConsumableRequestorder.md)

##### options?

###### preflightCheck?

`boolean`

#### Returns

`Promise`\<`string`\>

***

### publishWorkerpoolorder()

> **publishWorkerpoolorder**(`workerpoolorder`): `Promise`\<`string`\>

**SIGNER REQUIRED, ONLY WORKERPOOL OWNER**

publish a workerpoolorder on the off-chain marketplace making it available for other users

example:
```js
const orderHash = await publishWorkerpoolorder(workerpoolorder);
console.log('published order hash:', orderHash);
```

#### Parameters

##### workerpoolorder

[`ConsumableWorkerpoolorder`](../-internal-/interfaces/ConsumableWorkerpoolorder.md)

#### Returns

`Promise`\<`string`\>

***

### signApporder()

> **signApporder**(`apporder`, `options?`): `Promise`\<[`SignedApporder`](../-internal-/interfaces/SignedApporder.md)\>

**ONLY APP OWNER**

sign an apporder template to create a valid order

_NB_: preflight checks are performed on the order before signing (this helps detecting inconsistencies and prevent creating always failing tasks). these checks can be disabled by passing the option `preflightCheck: false`

example:
```js
const apporderTemplate = await createApporder({app: appAddress});
const apporder = await signApporder(apporderTemplate);
```

#### Parameters

##### apporder

[`SignableApporder`](../-internal-/interfaces/SignableApporder.md)

##### options?

###### preflightCheck?

`boolean`

#### Returns

`Promise`\<[`SignedApporder`](../-internal-/interfaces/SignedApporder.md)\>

***

### signDatasetorder()

> **signDatasetorder**(`datasetorder`, `options?`): `Promise`\<[`SignedDatasetorder`](../-internal-/interfaces/SignedDatasetorder.md)\>

**SIGNER REQUIRED, ONLY DATASET OWNER**

sign a datasetorder template to create a valid order

_NB_: preflight checks are performed on the order before signing (this helps detecting inconsistencies and prevent creating always failing tasks). these checks can be disabled by passing the option `preflightCheck: false`

example:
```js
const datasetorderTemplate = await createDatasetorder({dataset: datasetAddress});
const datasetorder = await signDatasetorder(datasetorderTemplate);
```

#### Parameters

##### datasetorder

[`SignableDatasetorder`](../-internal-/interfaces/SignableDatasetorder.md)

##### options?

###### preflightCheck?

`boolean`

#### Returns

`Promise`\<[`SignedDatasetorder`](../-internal-/interfaces/SignedDatasetorder.md)\>

***

### signRequestorder()

> **signRequestorder**(`requestorder`, `options?`): `Promise`\<[`SignedRequestorder`](../-internal-/interfaces/SignedRequestorder.md)\>

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

##### requestorder

[`SignableRequestorder`](../-internal-/interfaces/SignableRequestorder.md)

##### options?

###### preflightCheck?

`boolean`

#### Returns

`Promise`\<[`SignedRequestorder`](../-internal-/interfaces/SignedRequestorder.md)\>

***

### signWorkerpoolorder()

> **signWorkerpoolorder**(`workerpoolorder`): `Promise`\<[`SignedWorkerpoolorder`](../-internal-/interfaces/SignedWorkerpoolorder.md)\>

**SIGNER REQUIRED, ONLY WORKERPOOL OWNER**

sign a workerpoolorder template to create a valid order

```js
const workerpoolorderTemplate = await createWorkerpoolorder({workerpool: workerpoolAddress, category: 0});
const workerpoolorder = await signWorkerpoolorder(workerpoolorderTemplate);
```

#### Parameters

##### workerpoolorder

[`SignableWorkerpoolorder`](../-internal-/interfaces/SignableWorkerpoolorder.md)

#### Returns

`Promise`\<[`SignedWorkerpoolorder`](../-internal-/interfaces/SignedWorkerpoolorder.md)\>

***

### unpublishAllApporders()

> **unpublishAllApporders**(`appAddress`): `Promise`\<`string`[]\>

**SIGNER REQUIRED, ONLY APPORDER SIGNER**

unpublish all the published app's apporders from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHashes = await unpublishAllApporders(appAddress);
console.log('published orders count:', orderHashes.length);
```

#### Parameters

##### appAddress

`string`

#### Returns

`Promise`\<`string`[]\>

***

### unpublishAllDatasetorders()

> **unpublishAllDatasetorders**(`datasetAddress`): `Promise`\<`string`[]\>

**SIGNER REQUIRED, ONLY DATASETORDER SIGNER**

unpublish all the published dataset's datasetorders from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHashes = await unpublishAllDatasetorders(datasetAddress);
console.log('unpublished orders count:', orderHashes.length);
```

#### Parameters

##### datasetAddress

`string`

#### Returns

`Promise`\<`string`[]\>

***

### unpublishAllRequestorders()

> **unpublishAllRequestorders**(): `Promise`\<`string`[]\>

**SIGNER REQUIRED, ONLY REQUESTER**

unpublish all the published requester's requestorders from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHashes = await unpublishAllRequestorders();
console.log('unpublished orders count:', orderHashes.length);
```

#### Returns

`Promise`\<`string`[]\>

***

### unpublishAllWorkerpoolorders()

> **unpublishAllWorkerpoolorders**(`workerpoolAddress`): `Promise`\<`string`[]\>

**SIGNER REQUIRED, ONLY WORKERPOOLORDER SIGNER**

unpublish all the published workerpool's workerpoolorders from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHashes = await unpublishAllWorkerpoolorders(workerpoolAddress);
console.log('unpublished orders count:', orderHashes.length);
```

#### Parameters

##### workerpoolAddress

`string`

#### Returns

`Promise`\<`string`[]\>

***

### unpublishApporder()

> **unpublishApporder**(`apporderHash`): `Promise`\<`string`\>

**SIGNER REQUIRED, ONLY APPORDER SIGNER**

unpublish an apporder from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHash = await unpublishApporder(apporderHash);
console.log(unpublished order hash:', orderHash);
```

#### Parameters

##### apporderHash

`string`

#### Returns

`Promise`\<`string`\>

***

### unpublishDatasetorder()

> **unpublishDatasetorder**(`datasetorderHash`): `Promise`\<`string`\>

**SIGNER REQUIRED, ONLY DATASETORDER SIGNER**

unpublish a datasetorder from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHash = await unpublishDatasetorder(datasetorderHash);
console.log('unpublished order hash:', orderHash);
```

#### Parameters

##### datasetorderHash

`string`

#### Returns

`Promise`\<`string`\>

***

### unpublishLastApporder()

> **unpublishLastApporder**(`appAddress`): `Promise`\<`string`\>

**SIGNER REQUIRED, ONLY APPORDER SIGNER**

unpublish the last published app's apporder from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHash = await unpublishLastApporder(appAddress);
console.log('published order hash:', orderHash);
```

#### Parameters

##### appAddress

`string`

#### Returns

`Promise`\<`string`\>

***

### unpublishLastDatasetorder()

> **unpublishLastDatasetorder**(`datasetAddress`): `Promise`\<`string`\>

**SIGNER REQUIRED, ONLY DATASETORDER SIGNER**

unpublish the last published dataset's datasetorder from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHash = await unpublishLastDatasetorder(datasetAddress);
console.log('unpublished order hash:', orderHash);
```

#### Parameters

##### datasetAddress

`string`

#### Returns

`Promise`\<`string`\>

***

### unpublishLastRequestorder()

> **unpublishLastRequestorder**(): `Promise`\<`string`\>

**SIGNER REQUIRED, ONLY REQUESTER**

unpublish the last published requester's requestorder from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHash = await unpublishLastRequestorder();
console.log('unpublished order hash:', orderHash);
```

#### Returns

`Promise`\<`string`\>

***

### unpublishLastWorkerpoolorder()

> **unpublishLastWorkerpoolorder**(`workerpoolAddress`): `Promise`\<`string`\>

****SIGNER REQUIRED, ONLY WORKERPOOLORDER SIGNER**

unpublish the last published workerpool's workerpoolorder from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHash = await unpublishLastWorkerpoolorder(workerpoolAddress);
console.log('unpublished order hash:', orderHash);
```

#### Parameters

##### workerpoolAddress

`string`

#### Returns

`Promise`\<`string`\>

***

### unpublishRequestorder()

> **unpublishRequestorder**(`requestorderHash`): `Promise`\<`string`\>

**SIGNER REQUIRED, ONLY REQUESTER**

unpublish a requestorder from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHash = await unpublishRequestorder(requestorderHash);
console.log('unpublished order hash:', orderHash);
```

#### Parameters

##### requestorderHash

`string`

#### Returns

`Promise`\<`string`\>

***

### unpublishWorkerpoolorder()

> **unpublishWorkerpoolorder**(`workerpoolorderHash`): `Promise`\<`string`\>

**SIGNER REQUIRED, ONLY WORKERPOOLORDER SIGNER**

unpublish a workerpoolorder from the off-chain marketplace

_NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them

example:
```js
const orderHash = await unpublishWorkerpoolorder(workerpoolorderHash);
console.log('unpublished order hash:', orderHash);
```

#### Parameters

##### workerpoolorderHash

`string`

#### Returns

`Promise`\<`string`\>

***

### fromConfig()

> `static` **fromConfig**(`config`): `IExecOrderModule`

Create an IExecOrderModule instance using an IExecConfig instance

#### Parameters

##### config

[`IExecConfig`](IExecConfig.md)

#### Returns

`IExecOrderModule`

#### Overrides

[`IExecModule`](IExecModule.md).[`fromConfig`](IExecModule.md#fromconfig)
