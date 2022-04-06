[iexec](../README.md) / [Exports](../modules.md) / IExecTaskModule

# Class: IExecTaskModule

module exposing task methods

## Hierarchy

- [`IExecModule`](IExecModule.md)

  ↳ **`IExecTaskModule`**

## Table of contents

### Constructors

- [constructor](IExecTaskModule.md#constructor)

### Properties

- [config](IExecTaskModule.md#config)

### Methods

- [claim](IExecTaskModule.md#claim)
- [fetchResults](IExecTaskModule.md#fetchresults)
- [obsTask](IExecTaskModule.md#obstask)
- [show](IExecTaskModule.md#show)
- [fromConfig](IExecTaskModule.md#fromconfig)

## Constructors

### constructor

• **new IExecTaskModule**(`configOrArgs`, `options?`)

Create an IExecModule instance using an IExecConfig like

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/internal_.IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/internal_.IExecConfigOptions.md) |

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

#### Defined in

[src/lib/IExecModule.d.ts:13](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/IExecModule.d.ts#L13)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

#### Defined in

[src/lib/IExecModule.d.ts:20](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/IExecModule.d.ts#L20)

## Methods

### claim

▸ **claim**(`taskid`): `Promise`<`string`\>

claim a task not completed after the final deadline (proceed to refunds).

example:
```js
const claimTxHash = await claim(taskid);
console.log('task claimed:', claimTxHash);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `taskid` | `string` |

#### Returns

`Promise`<`string`\>

#### Defined in

[src/lib/IExecTaskModule.d.ts:132](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/IExecTaskModule.d.ts#L132)

___

### fetchResults

▸ **fetchResults**(`taskid`): `Promise`<`Response`\>

**IPFS stored results only**

download the specified task result.

example:
```js
const response = await fetchResults('0x668cb3e53ebbcc9999997709586c5af07f502f6120906fa3506ce1f531cedc81');
cosnt binary = await response.blob();
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `taskid` | `string` |

#### Returns

`Promise`<`Response`\>

#### Defined in

[src/lib/IExecTaskModule.d.ts:144](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/IExecTaskModule.d.ts#L144)

___

### obsTask

▸ **obsTask**(`taskid`, `optional?`): `Promise`<[`TaskObservable`](internal_.TaskObservable.md)\>

return an Observable with a `subscribe` method to monitor the task status changes.

_NB_: specify the `dealid` of the task to allow task monitoring when the task is not yet initialized (ACTIVE)

example:
- monitor task updates
```js
const taskObservable = await obsTask('0xec8045dfb0235d46c2d7ece1eadfe7741728754aed8b7efb716e9890cf3e9a8d');
const unsubscribe = taskObservable.subscribe({
 next: ({ message, task }) => console.log(message, task.statusName),
 error: (e) => console.error(e),
 complete: () => console.log('final state reached'),
});
// call unsubscribe() to unsubscribe from taskObservable
```
- wait for task completion
```js
const waitFinalState = (taskid, dealid) =>
  new Promise((resolve, reject) => {
    let taskState;
    iexec.task.obsTask(taskid, { dealid }).subscribe({
      next ({task}) => taskState = task,
      error: e => reject(e),
      complete: () => resolve(taskState),
    });
  });
const task = await waitFinalState(
  '0xec8045dfb0235d46c2d7ece1eadfe7741728754aed8b7efb716e9890cf3e9a8d',
  '0x4246d0ddf4c4c728cedd850890ee9a6781a88e5d3c46098c0774af3b7963879b',
);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `taskid` | `string` |
| `optional?` | `Object` |
| `optional.dealid?` | `string` |

#### Returns

`Promise`<[`TaskObservable`](internal_.TaskObservable.md)\>

#### Defined in

[src/lib/IExecTaskModule.d.ts:119](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/IExecTaskModule.d.ts#L119)

___

### show

▸ **show**(`taskid`): `Promise`<{ `consensusValue`: `string` ; `contributionDeadline`: `BN` ; `contributors`: `string`[] ; `dealid`: `string` ; `finalDeadline`: `BN` ; `idx`: `BN` ; `resultDigest`: `string` ; `results`: `string` \| { `location?`: `string` ; `storage`: `string`  } ; `resultsCallback`: `string` ; `resultsTimestamp`: `BN` ; `revealCounter`: `BN` ; `revealDeadline`: `BN` ; `status`: `number` ; `statusName`: `string` ; `taskTimedOut`: `boolean` ; `taskid`: `string` ; `winnerCounter`: `BN`  }\>

show the details of a task.

example:
```js
const task = await show(
 '0xec8045dfb0235d46c2d7ece1eadfe7741728754aed8b7efb716e9890cf3e9a8d',
);
console.log('task:', task);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `taskid` | `string` |

#### Returns

`Promise`<{ `consensusValue`: `string` ; `contributionDeadline`: `BN` ; `contributors`: `string`[] ; `dealid`: `string` ; `finalDeadline`: `BN` ; `idx`: `BN` ; `resultDigest`: `string` ; `results`: `string` \| { `location?`: `string` ; `storage`: `string`  } ; `resultsCallback`: `string` ; `resultsTimestamp`: `BN` ; `revealCounter`: `BN` ; `revealDeadline`: `BN` ; `status`: `number` ; `statusName`: `string` ; `taskTimedOut`: `boolean` ; `taskid`: `string` ; `winnerCounter`: `BN`  }\>

#### Defined in

[src/lib/IExecTaskModule.d.ts:67](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/IExecTaskModule.d.ts#L67)

___

### fromConfig

▸ `Static` **fromConfig**(`config`): [`IExecModule`](IExecModule.md)

Create an IExecModule using an IExecConfig instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExecModule`](IExecModule.md)

#### Inherited from

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)

#### Defined in

[src/lib/IExecModule.d.ts:24](https://github.com/iExecBlockchainComputing/iexec-sdk/blob/961d430/src/lib/IExecModule.d.ts#L24)
