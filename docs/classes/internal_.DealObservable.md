[iexec](../README.md) / [Exports](../modules.md) / [<internal\>](../modules/internal_.md) / DealObservable

# Class: DealObservable

[<internal>](../modules/internal_.md).DealObservable

## Hierarchy

- [`Observable`](internal_.Observable.md)

  ↳ **`DealObservable`**

## Table of contents

### Constructors

- [constructor](internal_.DealObservable.md#constructor)

### Methods

- [subscribe](internal_.DealObservable.md#subscribe)

## Constructors

### constructor

• **new DealObservable**()

#### Inherited from

[Observable](internal_.Observable.md).[constructor](internal_.Observable.md#constructor)

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
| `callbacks.next` | (`data`: { `completedTasksCount`: `number` ; `deal`: { `app`: { `owner`: `string` ; `pointer`: `string` ; `price`: `BN`  } ; `beneficiary`: `string` ; `botFirst`: `BN` ; `botSize`: `BN` ; `callback`: `string` ; `category`: `BN` ; `dataset`: { `owner`: `string` ; `pointer`: `string` ; `price`: `BN`  } ; `deadlineReached`: `boolean` ; `dealid`: `string` ; `finalTime`: `BN` ; `params`: `string` ; `requester`: `string` ; `schedulerRewardRatio`: `BN` ; `startTime`: `BN` ; `tag`: `string` ; `tasks`: `string`[] ; `trust`: `BN` ; `workerStake`: `BN` ; `workerpool`: { `owner`: `string` ; `pointer`: `string` ; `price`: `BN`  }  } ; `failedTaksCount`: `number` ; `message`: `string` ; `taskCount`: `number` ; `tasks`: { `consensusValue`: `string` ; `contributionDeadline`: `BN` ; `contributors`: `string`[] ; `dealid`: `string` ; `finalDeadline`: `BN` ; `idx`: `BN` ; `resultDigest`: `string` ; `results`: `string` \| { `location?`: `string` ; `storage`: `string`  } ; `resultsCallback`: `string` ; `resultsTimestamp`: `BN` ; `revealCounter`: `BN` ; `revealDeadline`: `BN` ; `status`: `number` ; `statusName`: `string` ; `taskTimedOut`: `boolean` ; `taskid`: `string` ; `winnerCounter`: `BN`  }[]  }) => `any` |

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

[Observable](internal_.Observable.md).[subscribe](internal_.Observable.md#subscribe)
