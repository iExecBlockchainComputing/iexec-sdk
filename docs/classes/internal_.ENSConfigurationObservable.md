[iexec](../README.md) / [Exports](../modules.md) / [{internal}](../modules/internal_.md) / ENSConfigurationObservable

# Class: ENSConfigurationObservable

[{internal}](../modules/internal_.md).ENSConfigurationObservable

## Hierarchy

- [`Observable`](internal_.Observable.md)

  ↳ **`ENSConfigurationObservable`**

## Table of contents

### Constructors

- [constructor](internal_.ENSConfigurationObservable.md#constructor)

### Methods

- [subscribe](internal_.ENSConfigurationObservable.md#subscribe)

## Constructors

### constructor

• **new ENSConfigurationObservable**()

#### Inherited from

[Observable](internal_.Observable.md).[constructor](internal_.Observable.md#constructor)

## Methods

### subscribe

▸ **subscribe**(`callbacks`): () => `void`

subscribe and start the ENS configuration process until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the retruned cancel method.

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
| `CLAIM_REVERSE_WITH_RESOLVER_TX_REQUEST` | sent once if address type is EAO and reverse address is not claimed | `address`,`resolverAddress` |
| `CLAIM_REVERSE_WITH_RESOLVER_TX_SENT` | sent once if address type is EAO and reverse address is not claimed | `txHash` |
| `CLAIM_REVERSE_WITH_RESOLVER_SUCCESS` | sent once if address type is EAO | `address`,`resolverAddress` |
| `SET_NAME_TX_REQUEST` | sent once if the name is not set | `name`,`address` |
| `SET_NAME_TX_SENT` | sent once if the name is not set | `txHash` |
| `SET_NAME_SUCCESS` | sent once | `name`,`address` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `callbacks` | `Object` |
| `callbacks.complete` | () => `any` |
| `callbacks.error` | (`error`: `Error`) => `any` |
| `callbacks.next` | (`data`: { `address?`: `string` ; `addressType?`: `string` ; `message`: `string` ; `name?`: `string` ; `resolverAddress?`: `string` ; `steps?`: `string`[] ; `txHash?`: `string`  }) => `any` |

#### Returns

`fn`

▸ (): `void`

subscribe and start the ENS configuration process until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the retruned cancel method.

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
| `CLAIM_REVERSE_WITH_RESOLVER_TX_REQUEST` | sent once if address type is EAO and reverse address is not claimed | `address`,`resolverAddress` |
| `CLAIM_REVERSE_WITH_RESOLVER_TX_SENT` | sent once if address type is EAO and reverse address is not claimed | `txHash` |
| `CLAIM_REVERSE_WITH_RESOLVER_SUCCESS` | sent once if address type is EAO | `address`,`resolverAddress` |
| `SET_NAME_TX_REQUEST` | sent once if the name is not set | `name`,`address` |
| `SET_NAME_TX_SENT` | sent once if the name is not set | `txHash` |
| `SET_NAME_SUCCESS` | sent once | `name`,`address` |

##### Returns

`void`

#### Overrides

[Observable](internal_.Observable.md).[subscribe](internal_.Observable.md#subscribe)

#### Defined in

[src/lib/IExecENSModule.d.ts:28](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/460192e/src/lib/IExecENSModule.d.ts#L28)
