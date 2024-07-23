[iexec](../README.md) / [Exports](../modules.md) / [<internal\>](../modules/internal_.md) / RequestorderParams

# Interface: RequestorderParams

[<internal>](../modules/internal_.md).RequestorderParams

## Table of contents

### Properties

- [iexec_args](internal_.RequestorderParams.md#iexec_args)
- [iexec_developer_logger](internal_.RequestorderParams.md#iexec_developer_logger)
- [iexec_input_files](internal_.RequestorderParams.md#iexec_input_files)
- [iexec_result_encryption](internal_.RequestorderParams.md#iexec_result_encryption)
- [iexec_result_storage_provider](internal_.RequestorderParams.md#iexec_result_storage_provider)
- [iexec_result_storage_proxy](internal_.RequestorderParams.md#iexec_result_storage_proxy)
- [iexec_secrets](internal_.RequestorderParams.md#iexec_secrets)

## Properties

### iexec_args

• `Optional` **iexec_args**: `string`

arguments to pass to the app

---

### iexec_developer_logger

• `Optional` **iexec_developer_logger**: `boolean`

[deprecated]

enable debug logs

default false

---

### iexec_input_files

• `Optional` **iexec_input_files**: `string`[]

input files for the app (direct download url)

---

### iexec_result_encryption

• `Optional` **iexec_result_encryption**: `boolean`

encrypt results

default `false`

_NB_: `iexec_result_encryption: true` is only available for TEE tasks, use with `tag: ["tee"]`

---

### iexec_result_storage_provider

• `Optional` **iexec_result_storage_provider**: `string`

selected storage provider

supported: `'ipfs'`|`'dropbox'`

default `'ipfs'`

---

### iexec_result_storage_proxy

• `Optional` **iexec_result_storage_proxy**: `string`

result proxy url

default determined by IExecConfig

---

### iexec_secrets

• `Optional` **iexec_secrets**: `Record`<`number`, `string`\>

requester secrets to pass to the app

```js
const secret = {
  1: 'login', // maps requester named secret "login" to app secret 1
  2: 'password', // maps requester named secret "password" to app secret 2
};
```

_NB_: `iexec_secrets` are only available for TEE tasks, use with `tag: ["tee"]`
