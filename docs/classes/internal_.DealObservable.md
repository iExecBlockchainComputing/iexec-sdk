[iexec](../README.md) / [Exports](../modules.md) / [<internal\>](../modules/internal_.md) / DealObservable

# Class: DealObservable

[<internal>](../modules/internal_.md).DealObservable

## Hierarchy

- [`Observable`](Observable.md)

  ↳ **`DealObservable`**

## Table of contents

### Constructors

- [constructor](internal_.DealObservable.md#constructor)

### Methods

- [subscribe](internal_.DealObservable.md#subscribe)

## Constructors

### constructor

• **new DealObservable**(): [`DealObservable`](internal_.DealObservable.md)

#### Returns

[`DealObservable`](internal_.DealObservable.md)

#### Inherited from

[Observable](Observable.md).[constructor](Observable.md#constructor)

## Methods

### subscribe

▸ **subscribe**(`callbacks`): () => `void`

subscribe to deal updates via an Observer until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the retruned unsubscribe method.

return the `unsubscribe: () => void` method.

data:
| message | comment |
| --- | --- |
| `DEAL_UPDATED` | sent every time a task status changes |
| `DEAL_COMPLETED` | sent once all tasks are completed |
| `DEAL_TIMEDOUT` | sent once the timeout is reached before all tasks completion |

#### Parameters

| Name | Type |
| :------ | :------ |
| `callbacks` | `Object` |
| `callbacks.complete` | () => `any` |
| `callbacks.error` | (`error`: `Error`) => `any` |
| `callbacks.next` | (`data`: { `completedTasksCount`: `number` ; `deal`: { `app`: { `owner`: `string` ; `pointer`: `string` ; `price`: [`BN`](utils.BN.md)  } ; `beneficiary`: `string` ; `botFirst`: [`BN`](utils.BN.md) ; `botSize`: [`BN`](utils.BN.md) ; `callback`: `string` ; `category`: [`BN`](utils.BN.md) ; `dataset`: { `owner`: `string` ; `pointer`: `string` ; `price`: [`BN`](utils.BN.md)  } ; `deadlineReached`: `boolean` ; `dealid`: `string` ; `finalTime`: [`BN`](utils.BN.md) ; `params`: `string` ; `requester`: `string` ; `schedulerRewardRatio`: [`BN`](utils.BN.md) ; `startTime`: [`BN`](utils.BN.md) ; `tag`: `string` ; `tasks`: `string`[] ; `trust`: [`BN`](utils.BN.md) ; `workerStake`: [`BN`](utils.BN.md) ; `workerpool`: { `owner`: `string` ; `pointer`: `string` ; `price`: [`BN`](utils.BN.md)  }  } ; `failedTaksCount`: `number` ; `message`: `string` ; `taskCount`: `number` ; `tasks`: { `consensusValue`: `string` ; `contributionDeadline`: [`BN`](utils.BN.md) ; `contributors`: `string`[] ; `dealid`: `string` ; `finalDeadline`: [`BN`](utils.BN.md) ; `idx`: [`BN`](utils.BN.md) ; `resultDigest`: `string` ; `results`: `string` \| { `location?`: `string` ; `storage`: `string`  } ; `resultsCallback`: `string` ; `resultsTimestamp`: [`BN`](utils.BN.md) ; `revealCounter`: [`BN`](utils.BN.md) ; `revealDeadline`: [`BN`](utils.BN.md) ; `status`: `number` ; `statusName`: `string` ; `taskTimedOut`: `boolean` ; `taskid`: `string` ; `winnerCounter`: [`BN`](utils.BN.md)  }[]  }) => `any` |

#### Returns

`fn`

▸ (): `void`

subscribe to deal updates via an Observer until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the retruned unsubscribe method.

return the `unsubscribe: () => void` method.

data:
| message | comment |
| --- | --- |
| `DEAL_UPDATED` | sent every time a task status changes |
| `DEAL_COMPLETED` | sent once all tasks are completed |
| `DEAL_TIMEDOUT` | sent once the timeout is reached before all tasks completion |

##### Returns

`void`

#### Overrides

[Observable](Observable.md).[subscribe](Observable.md#subscribe)
