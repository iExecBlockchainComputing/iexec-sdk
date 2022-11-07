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

___

### mrenclave

• `Optional` **mrenclave**: `string` \| { `entrypoint`: `string` ; `fingerprint`: `string` ; `framework`: ``"SCONE"`` \| ``"GRAMINE"`` ; `heapSize`: `number` ; `version`: `string`  }

optional for TEE apps only, specify the TEE protocol to use

___

### multiaddr

• **multiaddr**: [`Multiaddress`](../modules/internal_.md#multiaddress)

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
