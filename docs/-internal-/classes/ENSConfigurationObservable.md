[**iexec**](../../README.md)

***

[iexec](../../globals.md) / [\<internal\>](../README.md) / ENSConfigurationObservable

# Class: ENSConfigurationObservable

## Extends

- [`Observable`](../../classes/Observable.md)

## Constructors

### Constructor

> **new ENSConfigurationObservable**(): `ENSConfigurationObservable`

#### Returns

`ENSConfigurationObservable`

#### Inherited from

[`Observable`](../../classes/Observable.md).[`constructor`](../../classes/Observable.md#constructor)

## Methods

### subscribe()

> **subscribe**(`callbacks`): () => `void`

subscribe and start the ENS configuration process until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the returned cancel method.

return the `cancel: () => void` method.

data:
| message | comment | additional entries |
| --- | --- | --- |
| `DESCRIBE_WORKFLOW` | sent once | `addressType`,`steps` |
| `SET_RESOLVER_TX_REQUEST` | sent once if resolver is not set | `name`,`resolverAddress` |
| `SET_RESOLVER_TX_SENT` | sent once if resolver is not set | `txHash` |
| `SET_RESOLVER_SUCCESS` | sent once | `name`,`resolverAddress` |
| `SET_ADDR_TX_REQUEST` | sent once if addr is not set | `name`,`address` |
| `SET_ADDR_TX_SENT` | sent once if addr is not set | `txHash` |
| `SET_ADDR_SUCCESS` | sent once | `name`,`address` |
| `SET_NAME_TX_REQUEST` | sent once if the name is not set | `name`,`address` |
| `SET_NAME_TX_SENT` | sent once if the name is not set | `txHash` |
| `SET_NAME_SUCCESS` | sent once | `name`,`address` |

#### Parameters

##### callbacks

###### complete?

() => `any`

callback fired once when the configuration is completed

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
| `DESCRIBE_WORKFLOW` | sent once | `addressType`,`steps` |
| `SET_RESOLVER_TX_REQUEST` | sent once if resolver is not set | `name`,`resolverAddress` |
| `SET_RESOLVER_TX_SENT` | sent once if resolver is not set | `txHash` |
| `SET_RESOLVER_SUCCESS` | sent once | `name`,`resolverAddress` |
| `SET_ADDR_TX_REQUEST` | sent once if addr is not set | `name`,`address` |
| `SET_ADDR_TX_SENT` | sent once if addr is not set | `txHash` |
| `SET_ADDR_SUCCESS` | sent once | `name`,`address` |
| `SET_NAME_TX_REQUEST` | sent once if the name is not set | `name`,`address` |
| `SET_NAME_TX_SENT` | sent once if the name is not set | `txHash` |
| `SET_NAME_SUCCESS` | sent once | `name`,`address` |

#### Returns

> (): `void`

##### Returns

`void`

#### Overrides

[`Observable`](../../classes/Observable.md).[`subscribe`](../../classes/Observable.md#subscribe)
