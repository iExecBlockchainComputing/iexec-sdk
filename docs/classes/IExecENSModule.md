[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecENSModule

# Class: IExecENSModule

module exposing ENS methods

## Extends

- [`IExecModule`](IExecModule.md)

## Constructors

### Constructor

> **new IExecENSModule**(`configOrArgs`, `options?`): `IExecENSModule`

Create an IExecModule instance

#### Parameters

##### configOrArgs

[`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) | [`IExecConfig`](IExecConfig.md)

##### options?

[`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)

#### Returns

`IExecENSModule`

#### Inherited from

[`IExecModule`](IExecModule.md).[`constructor`](IExecModule.md#constructor)

## Properties

### config

> **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[`IExecModule`](IExecModule.md).[`config`](IExecModule.md#config)

## Methods

### claimName()

> **claimName**(`label`, `domain?`): `Promise`\<\{ `name`: `string`; `registerTxHash?`: `string`; \}\>

register a subdomain (label) on an ENS FIFSRegistrar

_NB_:
- if specifier, the domain must be controlled by a FIFSRegistrar, default "users.iexec.eth" (use `getDefaultDomain(address)` to determine the best suited domain for an address)
- if the user already own the domain, the register transaction will not occur

example:
```js
const { name, registerTxHash } = claimName(
  'me',
  'users.iexec.eth',
);
console.log('registered:', name);
```

#### Parameters

##### label

`string`

##### domain?

`string`

#### Returns

`Promise`\<\{ `name`: `string`; `registerTxHash?`: `string`; \}\>

***

### configureResolution()

> **configureResolution**(`name`, `address?`): `Promise`\<\{ `address`: `string`; `name`: `string`; `setAddrTxHash?`: `string`; `setNameTxHash?`: `string`; `setResolverTxHash?`: `string`; \}\>

**SIGNER REQUIRED, ONLY ENS NAME OWNER**

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

##### name

`string`

##### address?

`string`

#### Returns

`Promise`\<\{ `address`: `string`; `name`: `string`; `setAddrTxHash?`: `string`; `setNameTxHash?`: `string`; `setResolverTxHash?`: `string`; \}\>

***

### getDefaultDomain()

> **getDefaultDomain**(`address`): `Promise`\<`string`\>

get the default free to use ENS domain given an address

_NB_:
- the ENS domain is determined by the nature of the address (app, dataset, workerpool, other)
- the returned ENS domain is controlled by a FIFSRegistrar that allocates subdomains to the first person to claim them

example:
```js
const domain = await getDefaultDomain(address);
console.log('default domain:', domain);
```

#### Parameters

##### address

`string`

#### Returns

`Promise`\<`string`\>

***

### getOwner()

> **getOwner**(`name`): `Promise`\<`string` \| `null`\>

get the address of the ENS name's owner.

example:
```js
const owner = await getOwner('iexec.eth');
console.log('iexec.eth owner:', owner);
```

#### Parameters

##### name

`string`

#### Returns

`Promise`\<`string` \| `null`\>

***

### lookupAddress()

> **lookupAddress**(`address`): `Promise`\<`string` \| `null`\>

lookup to find the ENS name of an ethereum address

example:
```js
const name = await lookupAddress(address);
console.log('ENS name:', name);
```

#### Parameters

##### address

`string`

#### Returns

`Promise`\<`string` \| `null`\>

***

### obsConfigureResolution()

> **obsConfigureResolution**(`name`, `address?`): `Promise`\<[`ENSConfigurationObservable`](../-internal-/classes/ENSConfigurationObservable.md)\>

**SIGNER REQUIRED, ONLY ENS NAME OWNER**

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
    console.log(`${message} ${JSON.stringify(rest)}`),
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
    console.log(`${message} ${JSON.stringify(rest)}`),
  completed: () => console.log('resolution configured'),
});
```

#### Parameters

##### name

`string`

##### address?

`string`

#### Returns

`Promise`\<[`ENSConfigurationObservable`](../-internal-/classes/ENSConfigurationObservable.md)\>

***

### readTextRecord()

> **readTextRecord**(`name`, `key`): `Promise`\<`string`\>

read an ENS text record associated to an ENS name

example:
```js
const value = await readTextRecord('me.users.iexec.eth', 'email');
console.log('email record:', value);
```

#### Parameters

##### name

`string`

##### key

`string`

#### Returns

`Promise`\<`string`\>

***

### resolveName()

> **resolveName**(`name`): `Promise`\<`string` \| `null`\>

resolve the ENS name to an ethereum address if a resolver is configured for the name

example:
```js
const address = await resolveName('me.users.iexec.eth');
console.log('me.users.iexec.eth:', address);
```

#### Parameters

##### name

`string`

#### Returns

`Promise`\<`string` \| `null`\>

***

### setTextRecord()

> **setTextRecord**(`name`, `key`, `value?`): `Promise`\<`string`\>

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

##### name

`string`

##### key

`string`

##### value?

`string`

#### Returns

`Promise`\<`string`\>

***

### fromConfig()

> `static` **fromConfig**(`config`): `IExecENSModule`

Create an IExecENSModule instance using an IExecConfig instance

#### Parameters

##### config

[`IExecConfig`](IExecConfig.md)

#### Returns

`IExecENSModule`

#### Overrides

[`IExecModule`](IExecModule.md).[`fromConfig`](IExecModule.md#fromconfig)
