[**iexec**](../../README.md)

***

[iexec](../../globals.md) / [\<internal\>](../README.md) / AppDeploymentArgs

# Interface: AppDeploymentArgs

## Properties

### checksum

> **checksum**: `string`

app image digest

***

### mrenclave?

> `optional` **mrenclave**: [`SconeMREnclave`](SconeMREnclave.md)

optional for TEE apps only, specify the TEE protocol to use

***

### multiaddr

> **multiaddr**: [`Multiaddress`](../../type-aliases/Multiaddress.md)

app image address

***

### name

> **name**: `string`

a name for the app

***

### owner

> **owner**: `string`

the app owner

***

### type

> **type**: `string`

only 'DOCKER' is supported
