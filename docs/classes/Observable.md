[**iexec**](../README.md)

***

[iexec](../globals.md) / Observable

# Class: Observable

## Extended by

- [`DealObservable`](../-internal-/classes/DealObservable.md)
- [`ENSConfigurationObservable`](../-internal-/classes/ENSConfigurationObservable.md)
- [`TaskObservable`](../-internal-/classes/TaskObservable.md)
- [`BridgeObservable`](../-internal-/classes/BridgeObservable.md)

## Constructors

### Constructor

> **new Observable**(): `Observable`

#### Returns

`Observable`

## Methods

### subscribe()

> **subscribe**(`callbacks`): () => `void`

subscribe to a data source events via an Observer until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the returned unsubscribe method.

return the `unsubscribe: () => void` method.

#### Parameters

##### callbacks

callbacks to call on specific events

###### complete?

() => `any`

callback to fire when the data emission is done

no other callback is fired after firing `complete()`

###### error?

(`error`) => `any`

callback to fire when a error occurs on the data source

no other callback is fired after firing `error(error: Error)`

###### next?

(`data`) => `any`

callback to fire on incoming data

#### Returns

> (): `void`

##### Returns

`void`
