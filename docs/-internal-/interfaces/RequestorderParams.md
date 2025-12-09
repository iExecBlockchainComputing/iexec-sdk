[**iexec**](../../README.md)

***

[iexec](../../globals.md) / [\<internal\>](../README.md) / RequestorderParams

# Interface: RequestorderParams

## Properties

### bulk\_cid?

> `optional` **bulk\_cid**: `string`

bulk CID for the request

default none

***

### iexec\_args?

> `optional` **iexec\_args**: `string`

arguments to pass to the app

***

### iexec\_input\_files?

> `optional` **iexec\_input\_files**: `string`[]

input files for the app (direct download url)

***

### iexec\_result\_encryption?

> `optional` **iexec\_result\_encryption**: `boolean`

encrypt results

default `false`

_NB_: `iexec_result_encryption: true` is only available for TEE tasks, use with `tag: ["tee"]`

***

### iexec\_result\_storage\_provider?

> `optional` **iexec\_result\_storage\_provider**: `string`

selected storage provider

supported: `'ipfs'`|`'dropbox'`

default `'ipfs'`

***

### iexec\_result\_storage\_proxy?

> `optional` **iexec\_result\_storage\_proxy**: `string`

result proxy url

***

### iexec\_secrets?

> `optional` **iexec\_secrets**: `Record`\<`number`, `string`\>

requester secrets to pass to the app

```js
const secret = {
  1: 'login', // maps requester named secret "login" to app secret 1
  2: 'password' // maps requester named secret "password" to app secret 2
};
```

_NB_: `iexec_secrets` are only available for TEE tasks, use with `tag: ["tee"]`
