[iexec](../README.md) / [Exports](../modules.md) / [<internal\>](../modules/internal_.md) / BridgeObservable

# Class: BridgeObservable

[<internal>](../modules/internal_.md).BridgeObservable

## Hierarchy

- [`Observable`](Observable.md)

  ↳ **`BridgeObservable`**

## Table of contents

### Constructors

- [constructor](internal_.BridgeObservable.md#constructor)

### Methods

- [subscribe](internal_.BridgeObservable.md#subscribe)

## Constructors

### constructor

• **new BridgeObservable**()

#### Inherited from

[Observable](Observable.md).[constructor](Observable.md#constructor)

## Methods

### subscribe

▸ **subscribe**(`callbacks`): () => `void`

subscribe and start the bridge process to transfer tokens from one chain to another until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the retruned cancel method.

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

| Name | Type |
| :------ | :------ |
| `callbacks` | `Object` |
| `callbacks.complete` | () => `any` |
| `callbacks.error` | (`error`: `Error`) => `any` |
| `callbacks.next` | (`data`: { `bridgeAddress?`: `string` ; `dailyLimit?`: `BN` ; `maxPerTx?`: `BN` ; `message`: `string` ; `minPerTx?`: `BN` ; `totalSpentPerDay?`: `BN` ; `txHash?`: `string`  }) => `any` |

#### Returns

`fn`

▸ (): `void`

subscribe and start the bridge process to transfer tokens from one chain to another until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the retruned cancel method.

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

##### Returns

`void`

#### Overrides

[Observable](Observable.md).[subscribe](Observable.md#subscribe)
