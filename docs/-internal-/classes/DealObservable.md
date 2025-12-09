[**iexec**](../../README.md)

***

[iexec](../../globals.md) / [\<internal\>](../README.md) / DealObservable

# Class: DealObservable

## Extends

- [`Observable`](../../classes/Observable.md)

## Constructors

### Constructor

> **new DealObservable**(): `DealObservable`

#### Returns

`DealObservable`

#### Inherited from

[`Observable`](../../classes/Observable.md).[`constructor`](../../classes/Observable.md#constructor)

## Methods

### subscribe()

> **subscribe**(`callbacks`): () => `void`

subscribe to deal updates via an Observer until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the returned unsubscribe method.

return the `unsubscribe: () => void` method.

data:
| message | comment |
| --- | --- |
| `DEAL_UPDATED` | sent every time a task status changes |
| `DEAL_COMPLETED` | sent once all tasks are completed |
| `DEAL_TIMEDOUT` | sent once the timeout is reached before all tasks completion |

#### Parameters

##### callbacks

###### complete?

() => `any`

callback fired once when all the tasks are completed or when the deadline is reached

no other callback is fired after firing `complete()`

###### error?

(`error`) => `any`

callback fired once when an error occurs

no other callback is fired after firing `error(error: Error)`

###### next?

(`data`) => `any`

callback fired with initial deal status and after every deal status update

data:
| message | comment |
| --- | --- |
| `DEAL_UPDATED` | sent every time a task status changes |
| `DEAL_COMPLETED` | sent once all tasks are completed |
| `DEAL_TIMEDOUT` | sent once the timeout is reached before all tasks completion |

#### Returns

> (): `void`

##### Returns

`void`

#### Overrides

[`Observable`](../../classes/Observable.md).[`subscribe`](../../classes/Observable.md#subscribe)
