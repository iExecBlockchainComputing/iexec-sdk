[iexec](../README.md) / [Exports](../modules.md) / [{internal}](../modules/internal_.md) / App

# Interface: App

[{internal}](../modules/internal_.md).App

IExec app

## Table of contents

### Properties

- [checksum](internal_.App.md#checksum)
- [mrenclave](internal_.App.md#mrenclave)
- [multiaddr](internal_.App.md#multiaddr)
- [name](internal_.App.md#name)
- [owner](internal_.App.md#owner)
- [type](internal_.App.md#type)

## Properties

### checksum

• **checksum**: `string`

app image digest

#### Defined in

[src/lib/IExecAppModule.d.ts:35](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/0c88714/src/lib/IExecAppModule.d.ts#L35)

___

### mrenclave

• `Optional` **mrenclave**: `string`

optional for TEE apps only, specify the TEE protocol to use

#### Defined in

[src/lib/IExecAppModule.d.ts:39](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/0c88714/src/lib/IExecAppModule.d.ts#L39)

___

### multiaddr

• **multiaddr**: [`Multiaddress`](../modules/internal_.md#multiaddress)

app image address

#### Defined in

[src/lib/IExecAppModule.d.ts:31](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/0c88714/src/lib/IExecAppModule.d.ts#L31)

___

### name

• **name**: `string`

a name for the app

#### Defined in

[src/lib/IExecAppModule.d.ts:23](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/0c88714/src/lib/IExecAppModule.d.ts#L23)

___

### owner

• **owner**: `string`

the app owner

#### Defined in

[src/lib/IExecAppModule.d.ts:19](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/0c88714/src/lib/IExecAppModule.d.ts#L19)

___

### type

• **type**: `string`

only 'DOCKER' is supported

#### Defined in

[src/lib/IExecAppModule.d.ts:27](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/0c88714/src/lib/IExecAppModule.d.ts#L27)
