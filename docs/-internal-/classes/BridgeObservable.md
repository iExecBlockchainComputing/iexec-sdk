[**iexec**](../../README.md)

***

[iexec](../../globals.md) / [\<internal\>](../README.md) / BridgeObservable

# Class: BridgeObservable

## Extends

- [`Observable`](../../classes/Observable.md)

## Constructors

### Constructor

> **new BridgeObservable**(): `BridgeObservable`

#### Returns

`BridgeObservable`

#### Inherited from

[`Observable`](../../classes/Observable.md).[`constructor`](../../classes/Observable.md#constructor)

## Methods

### subscribe()

> **subscribe**(`callbacks`): () => `void`

subscribe and start the bridge process to transfer tokens from one chain to another until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the returned cancel method.

return the `cancel: () => void` method.

data:
| message | comment | additional entries |
| --- | --- | --- |
| `CHECK_BRIDGE_POLICY` | sent once | |
| `BRIDGE_POLICY_CHECKED` | sent once | `minPerTx`,`maxPerTx`,`dailyLimit` |
| `CHECK_BRIDGE_LIMIT` | sent once |  |
| `BRIDGE_LIMIT_CHECKED` | sent once | `totalSpentPerDay` |
| `SEND_TO_BRIDGE_TX_REQUEST` | sent once | `bridgeAddress` |
| `SEND_TO_BRIDGE_TX_SUCCESS` | sent once | `txHash` |
| `WAIT_RECEIVE_TX` | sent once if the bridged chain is configured | `bridgeAddress` |
| `RECEIVE_TX_SUCCESS` | sent once if the bridged chain is configured | `txHash` |

#### Parameters

##### callbacks

###### complete?

() => `any`

callback fired once when the bridge process is completed

no other callback is fired after firing `complete()`

###### error?

(`error`) => `any`

callback fired once when an error occurs

no other callback is fired after firing `error(error: Error)`

###### next?

(`data`) => `any`

callback fired at every configuration step

data:
| message | comment | additional entries |
| --- | --- | --- |
| `CHECK_BRIDGE_POLICY` | sent once | |
| `BRIDGE_POLICY_CHECKED` | sent once | `minPerTx`,`maxPerTx`,`dailyLimit` |
| `CHECK_BRIDGE_LIMIT` | sent once |  |
| `BRIDGE_LIMIT_CHECKED` | sent once | `totalSpentPerDay` |
| `SEND_TO_BRIDGE_TX_REQUEST` | sent once | `bridgeAddress` |
| `SEND_TO_BRIDGE_TX_SUCCESS` | sent once | `txHash` |
| `WAIT_RECEIVE_TX` | sent once if the bridged chain is configured | `bridgeAddress` |
| `RECEIVE_TX_SUCCESS` | sent once if the bridged chain is configured | `txHash` |

#### Returns

> (): `void`

##### Returns

`void`

#### Overrides

[`Observable`](../../classes/Observable.md).[`subscribe`](../../classes/Observable.md#subscribe)
