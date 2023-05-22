[iexec](../README.md) / [Exports](../modules.md) / [<internal\>](../modules/internal_.md) / RequestorderParams

# Interface: RequestorderParams

[<internal>](../modules/internal_.md).RequestorderParams

## Table of contents

### Properties

- [iexec\_args](internal_.RequestorderParams.md#iexec_args)
- [iexec\_developer\_logger](internal_.RequestorderParams.md#iexec_developer_logger)
- [iexec\_input\_files](internal_.RequestorderParams.md#iexec_input_files)
- [iexec\_result\_encryption](internal_.RequestorderParams.md#iexec_result_encryption)
- [iexec\_result\_storage\_provider](internal_.RequestorderParams.md#iexec_result_storage_provider)
- [iexec\_result\_storage\_proxy](internal_.RequestorderParams.md#iexec_result_storage_proxy)
- [iexec\_secrets](internal_.RequestorderParams.md#iexec_secrets)

## Properties

### iexec\_args

• `Optional` **iexec\_args**: `string`

arguments to pass to the app

___

### iexec\_developer\_logger

• `Optional` **iexec\_developer\_logger**: `boolean`

[deprecated]

enable debug logs

default false

___

### iexec\_input\_files

• `Optional` **iexec\_input\_files**: `string`[]

input files for the app (direct download url)

___

### iexec\_result\_encryption

• `Optional` **iexec\_result\_encryption**: `boolean`

encrypt results

default `false`

_NB_: `iexec_result_encryption: true` is only available for TEE tasks, use with `tag: ["tee"]`

___

### iexec\_result\_storage\_provider

• `Optional` **iexec\_result\_storage\_provider**: `string`

selected storage provider

supported: `'ipfs'`|`'dropbox'`

default `'ipfs'`

___

### iexec\_result\_storage\_proxy

• `Optional` **iexec\_result\_storage\_proxy**: `string`

result proxy url

default determined by IExecConfig

___

### iexec\_secrets

• `Optional` **iexec\_secrets**: `Record`<`number`, `string`\>

requester secrets to pass to the app

```js
const secret = {
  1: 'login', // maps requester named secret "login" to app secret 1
  2: 'password' // maps requester named secret "password" to app secret 2
};
```

_NB_: `iexec_secrets` are only available for TEE tasks, use with `tag: ["tee"]`
