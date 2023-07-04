[iexec](../README.md) / [Exports](../modules.md) / Observable

# Class: Observable

## Hierarchy

- **`Observable`**

  ↳ [`DealObservable`](internal_.DealObservable.md)

  ↳ [`ENSConfigurationObservable`](internal_.ENSConfigurationObservable.md)

  ↳ [`TaskObservable`](internal_.TaskObservable.md)

  ↳ [`BridgeObservable`](internal_.BridgeObservable.md)

## Table of contents

### Constructors

- [constructor](Observable.md#constructor)

### Methods

- [subscribe](Observable.md#subscribe)

## Constructors

### constructor

• **new Observable**()

## Methods

### subscribe

▸ **subscribe**(`callbacks`): () => `void`

subscribe to a data source events via an Observer until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the retruned unsubscribe method.

return the `unsubscribe: () => void` method.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `callbacks` | `Object` | callbacks to call on specific events |
| `callbacks.complete` | () => `any` | callback to fire when the data emission is done no other callback is fired after firing `complete()` |
| `callbacks.error` | (`error`: `Error`) => `any` | callback to fire when a error occurs on the data source no other callback is fired after firing `error(error: Error)` |
| `callbacks.next` | (`data`: `any`) => `any` | callback to fire on incoming data |

#### Returns

`fn`

▸ (): `void`

subscribe to a data source events via an Observer until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the retruned unsubscribe method.

return the `unsubscribe: () => void` method.

##### Returns

`void`
