[**iexec**](../../README.md)

***

[iexec](../../globals.md) / [\<internal\>](../README.md) / TaskObservable

# Class: TaskObservable

## Extends

- [`Observable`](../../classes/Observable.md)

## Constructors

### Constructor

> **new TaskObservable**(): `TaskObservable`

#### Returns

`TaskObservable`

#### Inherited from

[`Observable`](../../classes/Observable.md).[`constructor`](../../classes/Observable.md#constructor)

## Methods

### subscribe()

> **subscribe**(`callbacks`): () => `void`

subscribe to task updates via an Observer until either `complete()` or `error(error: Error)` is called on the Observer or the subscription is canceled by calling the returned unsubscribe method.

return the `unsubscribe: () => void` method.

data:
| message | comment |
| --- | --- |
| `TASK_UPDATED` | sent with every time the task status changes |
| `TASK_COMPLETED` | sent once when the task is completed |
| `TASK_TIMEDOUT` | sent once when the deadline is reached before completion|
| `TASK_FAILED` | sent once when the task is claimed after a timeout |

#### Parameters

##### callbacks

###### complete?

() => `any`

callback fired once when the task is completed or when the deadline is reached

no other callback is fired after firing `complete()`

###### error?

(`error`) => `any`

callback fired once when an error occurs

no other callback is fired after firing `error(error: Error)`

###### next?

(`data`) => `any`

callback fired with initial task status and after every task status update

data:
| message | comment |
| --- | --- |
| `TASK_UPDATED` | sent with every time the task status changes |
| `TASK_COMPLETED` | sent once when the task is completed |
| `TASK_TIMEDOUT` | sent once when the deadline is reached before completion|
| `TASK_FAILED` | sent once when the task is claimed after a timeout |

#### Returns

> (): `void`

##### Returns

`void`

#### Overrides

[`Observable`](../../classes/Observable.md).[`subscribe`](../../classes/Observable.md#subscribe)
