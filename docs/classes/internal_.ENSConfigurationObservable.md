[iexec](../README.md) / [Exports](../modules.md) / [<internal\>](../modules/internal_.md) / ENSConfigurationObservable

# Class: ENSConfigurationObservable

[<internal>](../modules/internal_.md).ENSConfigurationObservable

## Hierarchy

- [`Observable`](Observable.md)

  ↳ **`ENSConfigurationObservable`**

## Table of contents

### Constructors

- [constructor](internal_.ENSConfigurationObservable.md#constructor)

### Methods

- [subscribe](internal_.ENSConfigurationObservable.md#subscribe)

## Constructors

### constructor

• **new ENSConfigurationObservable**(): [`ENSConfigurationObservable`](internal_.ENSConfigurationObservable.md)

#### Returns

[`ENSConfigurationObservable`](internal_.ENSConfigurationObservable.md)

#### Inherited from

[Observable](Observable.md).[constructor](Observable.md#constructor)

## Methods

### subscribe

▸ **subscribe**(`callbacks`): () => `void`

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

| Name | Type |
| :------ | :------ |
| `callbacks` | `Object` |
| `callbacks.complete?` | () => `any` |
| `callbacks.error?` | (`error`: `Error`) => `any` |
| `callbacks.next?` | (`data`: { `address?`: `string` ; `addressType?`: `string` ; `message`: ``"DESCRIBE_WORKFLOW"`` \| ``"SET_RESOLVER_TX_REQUEST"`` \| ``"SET_RESOLVER_TX_SENT"`` \| ``"SET_RESOLVER_SUCCESS"`` \| ``"SET_ADDR_TX_REQUEST"`` \| ``"SET_ADDR_TX_SENT"`` \| ``"SET_ADDR_SUCCESS"`` \| ``"SET_NAME_TX_REQUEST"`` \| ``"SET_NAME_TX_SENT"`` \| ``"SET_NAME_SUCCESS"`` ; `name?`: `string` ; `resolverAddress?`: `string` ; `steps?`: `string`[] ; `txHash?`: `string`  }) => `any` |

#### Returns

`fn`

▸ (): `void`

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

##### Returns

`void`

#### Overrides

[Observable](Observable.md).[subscribe](Observable.md#subscribe)
