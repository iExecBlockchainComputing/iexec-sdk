[iexec](../README.md) / [Exports](../modules.md) / [<internal\>](../modules/internal_.md) / SconeMREnclave

# Interface: SconeMREnclave

[<internal>](../modules/internal_.md).SconeMREnclave

## Hierarchy

- [`MREnclaveBase`](internal_.MREnclaveBase.md)

  ↳ **`SconeMREnclave`**

## Table of contents

### Properties

- [entrypoint](internal_.SconeMREnclave.md#entrypoint)
- [fingerprint](internal_.SconeMREnclave.md#fingerprint)
- [framework](internal_.SconeMREnclave.md#framework)
- [heapSize](internal_.SconeMREnclave.md#heapsize)
- [version](internal_.SconeMREnclave.md#version)

## Properties

### entrypoint

• **entrypoint**: `string`

app entrypoint path

___

### fingerprint

• **fingerprint**: `string`

app tee fingerprint

#### Inherited from

[MREnclaveBase](internal_.MREnclaveBase.md).[fingerprint](internal_.MREnclaveBase.md#fingerprint)

___

### framework

• **framework**: ``"scone"``

TEE framework name

#### Overrides

[MREnclaveBase](internal_.MREnclaveBase.md).[framework](internal_.MREnclaveBase.md#framework)

___

### heapSize

• **heapSize**: `number`

dedicated memory in bytes

___

### version

• **version**: `string`

framework's protocol version

#### Inherited from

[MREnclaveBase](internal_.MREnclaveBase.md).[version](internal_.MREnclaveBase.md#version)
