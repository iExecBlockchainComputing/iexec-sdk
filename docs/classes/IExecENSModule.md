[iexec](../README.md) / [Exports](../modules.md) / IExecENSModule

# Class: IExecENSModule

module exposing ENS methods

## Hierarchy

- [`IExecModule`](IExecModule.md)

  ↳ **`IExecENSModule`**

## Table of contents

### Constructors

- [constructor](IExecENSModule.md#constructor)

### Properties

- [config](IExecENSModule.md#config)

### Methods

- [claimName](IExecENSModule.md#claimname)
- [configureResolution](IExecENSModule.md#configureresolution)
- [getOwner](IExecENSModule.md#getowner)
- [lookupAddress](IExecENSModule.md#lookupaddress)
- [obsConfigureResolution](IExecENSModule.md#obsconfigureresolution)
- [readTextRecord](IExecENSModule.md#readtextrecord)
- [resolveName](IExecENSModule.md#resolvename)
- [setTextRecord](IExecENSModule.md#settextrecord)
- [fromConfig](IExecENSModule.md#fromconfig)

## Constructors

### constructor

• **new IExecENSModule**(`configOrArgs`, `options?`)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/internal_.IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/internal_.IExecConfigOptions.md) |

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

#### Defined in

[src/lib/IExecModule.d.ts:13](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/IExecModule.d.ts#L13)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

#### Defined in

[src/lib/IExecModule.d.ts:20](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/IExecModule.d.ts#L20)

## Methods

### claimName

▸ **claimName**(`label`, `domain?`): `Promise`<{ `registerTxHash?`: `string` ; `registeredName`: `string`  }\>

register a subdomain (label) on an ENS FIFSRegistrar

_NB_:
- if specifier, the domain must be controlled by a FIFSRegistrar, default "users.iexec.eth"
- if the user already own the domain, the register transaction will not occur

example:
```js
const { name, registerTxHash } = claimName(
  'me',
  'users.iexec.eth',
);
console.log('regitered:', name);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `label` | `string` |
| `domain?` | `string` |

#### Returns

`Promise`<{ `registerTxHash?`: `string` ; `registeredName`: `string`  }\>

#### Defined in

[src/lib/IExecENSModule.d.ts:122](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/IExecENSModule.d.ts#L122)

___

### configureResolution

▸ **configureResolution**(`name`, `address?`): `Promise`<{ `address`: `string` ; `name`: `string` ; `setAddrTxHash?`: `string` ; `setNameTxHash?`: `string` ; `setResolverTxHash?`: `string`  }\>

**ONLY ENS NAME OWNER**

configure the ENS resolution and reverse resolution for an owned ENS name, same as `obsConfigureResolution` wrapped in a `Promise`.

_NB_:
- `address` must be an iExec RegistryEntry address (ie: app, dataset or workerpool) or the user address, default user address
- the configuration may require up to 3 transactions, depending on the current state, some transaction may or may not occur to complete the configuration

example:
- EOA ENS configuration
```js
const { address, name } = await configureResolution(
  'me.users.iexec.eth',
);
console.log('configured resolution:', address, '<=>', name);
```
- iExec App contract ENS configuration
```js
const { address, name } = await configureResolution(
  'my-app.eth',
   appAddress
);
console.log('configured resolution:', address, '<=>', name);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |
| `address?` | `string` |

#### Returns

`Promise`<{ `address`: `string` ; `name`: `string` ; `setAddrTxHash?`: `string` ; `setNameTxHash?`: `string` ; `setResolverTxHash?`: `string`  }\>

#### Defined in

[src/lib/IExecENSModule.d.ts:196](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/IExecENSModule.d.ts#L196)

___

### getOwner

▸ **getOwner**(`name`): `Promise`<`string`\>

get the address of the ENS name's owner.

example:
```js
const owner = await getOwner('iexec.eth');
console.log('iexec.eth owner:', owner);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecENSModule.d.ts:85](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/IExecENSModule.d.ts#L85)

___

### lookupAddress

▸ **lookupAddress**(`address`): `Promise`<`string`\>

lookup to find the ENS name of an ethereum address

example:
```js
const name = await lookupAddress(address);
console.log('ENS name:', name);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecENSModule.d.ts:105](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/IExecENSModule.d.ts#L105)

___

### obsConfigureResolution

▸ **obsConfigureResolution**(`name`, `address?`): `Promise`<[`ENSConfigurationObservable`](internal_.ENSConfigurationObservable.md)\>

**ONLY ENS NAME OWNER**

return a cold Observable with a `subscribe` method to start and monitor the ENS resolution and reverse resolution configuration.

calling the `subscribe` method on the observable will immediately return a cancel function and start the asynchronous ENS configuration.

calling the returned cancel method will stop the configuration process

_NB_:
- `address` must be an iExec RegistryEntry address (ie: app, dataset or workerpool) or the user address, default user address
- the configuration may require up to 4 transactions, depending on the target type (EOA or RegistryEntry) and the current state, some transaction may or may not occur to complete the configuration

example:
- EOA ENS configuration
```js
const configureResolutionObservable = await obsConfigureResolution(
  'me.users.iexec.eth',
);
configureResolutionObservable.subscribe({
  error: console.error,
  next: ({ message, ...rest }) =>
    console.log(`${message} ${JSON.strigify(rest)}`),
  completed: () => console.log('resolution configured'),
});
```
- iExec App contract ENS configuration
```js
const configureResolutionObservable = await obsConfigureResolution(
  'my-app.eth',
   appAddress
);
configureResolutionObservable.subscribe({
  error: console.error,
  next: ({ message, ...rest }) =>
    console.log(`${message} ${JSON.strigify(rest)}`),
  completed: () => console.log('resolution configured'),
});
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |
| `address?` | `string` |

#### Returns

`Promise`<[`ENSConfigurationObservable`](internal_.ENSConfigurationObservable.md)\>

#### Defined in

[src/lib/IExecENSModule.d.ts:166](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/IExecENSModule.d.ts#L166)

___

### readTextRecord

▸ **readTextRecord**(`name`, `key`): `Promise`<`string`\>

read an ENS text record associated to an ENS name

example:
```js
const value = await readTextRecord('me.users.iexec.eth', 'email');
console.log('email record:', value);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |
| `key` | `string` |

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecENSModule.d.ts:215](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/IExecENSModule.d.ts#L215)

___

### resolveName

▸ **resolveName**(`name`): `Promise`<`string`\>

resolve the ENS name to an ethereum address if a resolver is configured for the name

example:
```js
const owner = await resolveName('me.users.iexec.eth');
console.log('me.users.iexec.eth:', address);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecENSModule.d.ts:95](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/IExecENSModule.d.ts#L95)

___

### setTextRecord

▸ **setTextRecord**(`name`, `key`, `value?`): `Promise`<`string`\>

**ONLY ENS NAME OWNER**

set a text record associated to an ENS name

_NB_:
- if value is not specified, the text record is reset to `""`

example:
```js
const txHash = setTextRecord(
  'me.users.iexec.eth',
  'email',
  'me@iex.ec'
);
console.log('txHash:', txHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |
| `key` | `string` |
| `value?` | `string` |

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecENSModule.d.ts:234](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/IExecENSModule.d.ts#L234)

___

### fromConfig

▸ `Static` **fromConfig**(`config`): [`IExecModule`](IExecModule.md)

Create an IExecModule using an IExecConfig instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExecModule`](IExecModule.md)

#### Inherited from

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)

#### Defined in

[src/lib/IExecModule.d.ts:24](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/IExecModule.d.ts#L24)
