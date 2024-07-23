[iexec](../README.md) / [Exports](../modules.md) / IExecSecretsModule

# Class: IExecSecretsModule

module exposing secrets methods

## Hierarchy

- [`IExecModule`](IExecModule.md)

  ↳ **`IExecSecretsModule`**

## Table of contents

### Constructors

- [constructor](IExecSecretsModule.md#constructor)

### Properties

- [config](IExecSecretsModule.md#config)

### Methods

- [checkRequesterSecretExists](IExecSecretsModule.md#checkrequestersecretexists)
- [pushRequesterSecret](IExecSecretsModule.md#pushrequestersecret)
- [fromConfig](IExecSecretsModule.md#fromconfig)

## Constructors

### constructor

• **new IExecSecretsModule**(`configOrArgs`, `options?`): [`IExecSecretsModule`](IExecSecretsModule.md)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name           | Type                                                                                     |
| :------------- | :--------------------------------------------------------------------------------------- |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) |
| `options?`     | [`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)                              |

#### Returns

[`IExecSecretsModule`](IExecSecretsModule.md)

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

## Methods

### checkRequesterSecretExists

▸ **checkRequesterSecretExists**(`requesterAddress`, `secretName`, `options?`): `Promise`<`boolean`\>

check if a named secret exists for the requester in the Secret Management Service

example:

```js
const isSecretSet = await checkRequesterSecretExists(
  requesterAddress,
  'my-password'
);
console.log('secret "my-password" set:', isSecretSet);
```

#### Parameters

| Name                    | Type                                         |
| :---------------------- | :------------------------------------------- |
| `requesterAddress`      | `string`                                     |
| `secretName`            | `String`                                     |
| `options?`              | `Object`                                     |
| `options.teeFramework?` | [`TeeFramework`](../modules.md#teeframework) |

#### Returns

`Promise`<`boolean`\>

---

### pushRequesterSecret

▸ **pushRequesterSecret**(`secretName`, `secretValue`, `options?`): `Promise`<{ `isPushed`: `boolean` }\>

**SIGNER REQUIRED, ONLY REQUESTER**

push a named secret to the Secret Management Service

_NB_:

- pushed secrets can be used in `tee` tasks by specifying `iexec_secrets` in the requestorder params.
- once pushed a secret can not be updated

example:

```js
const { isPushed } = await pushRequesterSecret('my-password', 'passw0rd');
console.log('pushed secret "my-password":', isPushed);
```

#### Parameters

| Name                    | Type                                         |
| :---------------------- | :------------------------------------------- |
| `secretName`            | `String`                                     |
| `secretValue`           | `String`                                     |
| `options?`              | `Object`                                     |
| `options.teeFramework?` | [`TeeFramework`](../modules.md#teeframework) |

#### Returns

`Promise`<{ `isPushed`: `boolean` }\>

---

### fromConfig

▸ **fromConfig**(`config`): [`IExecSecretsModule`](IExecSecretsModule.md)

Create an IExecSecretsModule instance using an IExecConfig instance

#### Parameters

| Name     | Type                            |
| :------- | :------------------------------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExecSecretsModule`](IExecSecretsModule.md)

#### Overrides

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)
