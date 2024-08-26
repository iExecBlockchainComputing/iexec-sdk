[iexec](../README.md) / [Exports](../modules.md) / [<internal\>](../modules/internal_.md) / TaskObservable

# Class: TaskObservable

[<internal>](../modules/internal_.md).TaskObservable

## Hierarchy

- [`Observable`](Observable.md)

  ↳ **`TaskObservable`**

## Table of contents

### Constructors

- [constructor](internal_.TaskObservable.md#constructor)

### Methods

- [subscribe](internal_.TaskObservable.md#subscribe)

## Constructors

### constructor

• **new TaskObservable**(): [`TaskObservable`](internal_.TaskObservable.md)

#### Returns

[`TaskObservable`](internal_.TaskObservable.md)

#### Inherited from

[Observable](Observable.md).[constructor](Observable.md#constructor)

## Methods

### subscribe

▸ **subscribe**(`callbacks`): () => `void`

subscribe to task updates via an Observer until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the returned unsubscribe method.

return the `unsubscribe: () => void` method.

data:
| message | comment |
| --- | --- |
| `TASK_UPDATED` | sent with every time the task status changes |
| `TASK_COMPLETED` | sent once when the task is completed |
| `TASK_TIMEDOUT` | sent once when the deadline is reached before completion|
| `TASK_FAILED` | sent once when the task is claimed after a timeout |

#### Parameters

| Name | Type |
| :------ | :------ |
| `callbacks` | `Object` |
| `callbacks.complete?` | () => `any` |
| `callbacks.error?` | (`error`: `Error`) => `any` |
| `callbacks.next?` | (`data`: { `message`: ``"TASK_UPDATED"`` \| ``"TASK_COMPLETED"`` \| ``"TASK_TIMEDOUT"`` \| ``"TASK_FAILED"`` ; `task`: [`Task`](../interfaces/internal_.Task.md)  }) => `any` |

#### Returns

`fn`

▸ (): `void`

subscribe to task updates via an Observer until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the returned unsubscribe method.

return the `unsubscribe: () => void` method.

data:
| message | comment |
| --- | --- |
| `TASK_UPDATED` | sent with every time the task status changes |
| `TASK_COMPLETED` | sent once when the task is completed |
| `TASK_TIMEDOUT` | sent once when the deadline is reached before completion|
| `TASK_FAILED` | sent once when the task is claimed after a timeout |

##### Returns

`void`

#### Overrides

[Observable](Observable.md).[subscribe](Observable.md#subscribe)
