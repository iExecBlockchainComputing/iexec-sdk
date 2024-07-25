[iexec](../README.md) / [Exports](../modules.md) / [<internal\>](../modules/internal_.md) / AppDeploymentArgs

# Interface: AppDeploymentArgs

[<internal>](../modules/internal_.md).AppDeploymentArgs

## Table of contents

### Properties

- [checksum](internal_.AppDeploymentArgs.md#checksum)
- [mrenclave](internal_.AppDeploymentArgs.md#mrenclave)
- [multiaddr](internal_.AppDeploymentArgs.md#multiaddr)
- [name](internal_.AppDeploymentArgs.md#name)
- [owner](internal_.AppDeploymentArgs.md#owner)
- [type](internal_.AppDeploymentArgs.md#type)

## Properties

### checksum

• **checksum**: `string`

app image digest

___

### mrenclave

• `Optional` **mrenclave**: [`SconeMREnclave`](internal_.SconeMREnclave.md) \| [`GramineMREnclave`](internal_.GramineMREnclave.md)

optional for TEE apps only, specify the TEE protocol to use

___

### multiaddr

• **multiaddr**: [`Multiaddress`](../modules.md#multiaddress)

app image address

___

### name

• **name**: `string`

a name for the app

___

### owner

• **owner**: `string`

the app owner

___

### type

• **type**: `string`

only 'DOCKER' is supported
