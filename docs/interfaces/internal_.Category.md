[iexec](../README.md) / [Exports](../modules.md) / [{internal}](../modules/internal_.md) / Category

# Interface: Category

[{internal}](../modules/internal_.md).Category

IExec category

## Table of contents

### Properties

- [description](internal_.Category.md#description)
- [name](internal_.Category.md#name)
- [workClockTimeRef](internal_.Category.md#workclocktimeref)

## Properties

### description

• **description**: `string`

a description of the category

#### Defined in

[src/lib/IExecHubModule.d.ts:15](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8cfa57c/src/lib/IExecHubModule.d.ts#L15)

___

### name

• **name**: `string`

a name for the category

#### Defined in

[src/lib/IExecHubModule.d.ts:11](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8cfa57c/src/lib/IExecHubModule.d.ts#L11)

___

### workClockTimeRef

• **workClockTimeRef**: [`BNish`](../modules/internal_.md#bnish)

time base (in sec) for the category (tasks of this category must be completed under 10 * workClockTimeRef)

#### Defined in

[src/lib/IExecHubModule.d.ts:19](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/8cfa57c/src/lib/IExecHubModule.d.ts#L19)
