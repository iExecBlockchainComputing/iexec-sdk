[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecSecretsModule

# Class: IExecSecretsModule

module exposing secrets methods

## Extends

- [`IExecModule`](IExecModule.md)

## Constructors

### Constructor

> **new IExecSecretsModule**(`configOrArgs`, `options?`): `IExecSecretsModule`

Create an IExecModule instance

#### Parameters

##### configOrArgs

[`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) | [`IExecConfig`](IExecConfig.md)

##### options?

[`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)

#### Returns

`IExecSecretsModule`

#### Inherited from

[`IExecModule`](IExecModule.md).[`constructor`](IExecModule.md#constructor)

## Properties

### config

> **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[`IExecModule`](IExecModule.md).[`config`](IExecModule.md#config)

## Methods

### checkRequesterSecretExists()

> **checkRequesterSecretExists**(`requesterAddress`, `secretName`, `options?`): `Promise`\<`boolean`\>

check if a named secret exists for the requester in the Secret Management Service

example:
```js
const isSecretSet = await checkRequesterSecretExists(requesterAddress, "my-password");
console.log('secret "my-password" set:', isSecretSet);
```

#### Parameters

##### requesterAddress

`string`

##### secretName

`String`

##### options?

###### teeFramework?

[`TeeFramework`](../type-aliases/TeeFramework.md)

#### Returns

`Promise`\<`boolean`\>

***

### pushRequesterSecret()

> **pushRequesterSecret**(`secretName`, `secretValue`, `options?`): `Promise`\<\{ `isPushed`: `boolean`; \}\>

**SIGNER REQUIRED, ONLY REQUESTER**

push a named secret to the Secret Management Service

_NB_:
- pushed secrets can be used in `tee` tasks by specifying `iexec_secrets` in the requestorder params.
- once pushed a secret can not be updated

example:
```js
const { isPushed } = await pushRequesterSecret("my-password", "passw0rd");
console.log('pushed secret "my-password":', isPushed);
```

#### Parameters

##### secretName

`String`

##### secretValue

`String`

##### options?

###### teeFramework?

[`TeeFramework`](../type-aliases/TeeFramework.md)

#### Returns

`Promise`\<\{ `isPushed`: `boolean`; \}\>

***

### fromConfig()

> `static` **fromConfig**(`config`): `IExecSecretsModule`

Create an IExecSecretsModule instance using an IExecConfig instance

#### Parameters

##### config

[`IExecConfig`](IExecConfig.md)

#### Returns

`IExecSecretsModule`

#### Overrides

[`IExecModule`](IExecModule.md).[`fromConfig`](IExecModule.md#fromconfig)
