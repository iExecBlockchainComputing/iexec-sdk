[iexec](../README.md) / [Exports](../modules.md) / [{internal}](../modules/internal_.md) / Observable

# Class: Observable

[{internal}](../modules/internal_.md).Observable

## Hierarchy

- **`Observable`**

  ↳ [`DealObservable`](internal_.DealObservable.md)

  ↳ [`ENSConfigurationObservable`](internal_.ENSConfigurationObservable.md)

  ↳ [`TaskObservable`](internal_.TaskObservable.md)

  ↳ [`BrigdeObservable`](internal_.BrigdeObservable.md)

## Table of contents

### Constructors

- [constructor](internal_.Observable.md#constructor)

### Methods

- [subscribe](internal_.Observable.md#subscribe)

## Constructors

### constructor

• **new Observable**()

## Methods

### subscribe

▸ **subscribe**(`callbacks`): () => `void`

subscribe to a data source events via an Observer until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the retruned unsubscribe method.

return the `unsubscribe: () => void` method.

#### Parameters

| Name | Type |
| :------ | :------ |
| `callbacks` | `Object` |
| `callbacks.complete` | () => `any` |
| `callbacks.error` | (`error`: `Error`) => `any` |
| `callbacks.next` | (`data`: `any`) => `any` |

#### Returns

`fn`

▸ (): `void`

subscribe to a data source events via an Observer until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the retruned unsubscribe method.

return the `unsubscribe: () => void` method.

##### Returns

`void`

#### Defined in

[src/common/utils/reactive.d.ts:7](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8cfa57c/src/common/utils/reactive.d.ts#L7)
