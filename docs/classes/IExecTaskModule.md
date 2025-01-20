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
- [fetchLogs](IExecTaskModule.md#fetchlogs)
- [fetchOffchainInfo](IExecTaskModule.md#fetchoffchaininfo)
- [fetchResults](IExecTaskModule.md#fetchresults)
- [obsTask](IExecTaskModule.md#obstask)
- [show](IExecTaskModule.md#show)
- [fromConfig](IExecTaskModule.md#fromconfig)

## Constructors

### constructor

• **new IExecTaskModule**(`configOrArgs`, `options?`): [`IExecTaskModule`](IExecTaskModule.md)

Create an IExecModule instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `configOrArgs` | [`IExecConfig`](IExecConfig.md) \| [`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) |
| `options?` | [`IExecConfigOptions`](../interfaces/IExecConfigOptions.md) |

#### Returns

[`IExecTaskModule`](IExecTaskModule.md)

#### Inherited from

[IExecModule](IExecModule.md).[constructor](IExecModule.md#constructor)

## Properties

### config

• **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[IExecModule](IExecModule.md).[config](IExecModule.md#config)

## Methods

### claim

▸ **claim**(`taskid`): `Promise`<`string`\>

**SIGNER REQUIRED**

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

___

### fetchLogs

▸ **fetchLogs**(`taskid`): `Promise`<{ `stderr`: `string` ; `stdout`: `string` ; `worker`: `string`  }[]\>

**SIGNER REQUIRED, ONLY REQUESTER**

get the workers logs for specified task.

_NB_: the workerpool must declare it's API url to enable this feature, check declared API url with `IExecWorkerpoolModule.getWorkerpoolApiUrl(workerpool)`

example:
```js
const logArray = await fetchLogs('0x668cb3e53ebbcc9999997709586c5af07f502f6120906fa3506ce1f531cedc81');
logsArray.forEach(({ worker, stdout, stderr }) => {
  console.log(`----- worker ${worker} -----`);
  console.log(`stdout:\n${stdout}`);
  console.log(`stderr:\n${stderr}`);
});
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `taskid` | `string` |

#### Returns

`Promise`<{ `stderr`: `string` ; `stdout`: `string` ; `worker`: `string`  }[]\>

___

### fetchOffchainInfo

▸ **fetchOffchainInfo**(`taskid`): `Promise`<{ `replicates`: { `exitCode?`: `number` ; `status`: `string` ; `statusHistory`: { `cause?`: `string` ; `date`: `string` ; `status`: `string`  }[] ; `worker`: `string`  }[] ; `task`: { `status`: `string` ; `statusHistory`: { `cause?`: `string` ; `date`: `string` ; `status`: `string`  }[]  }  }\>

get off-chain status information for specified task.

_NB_: the workerpool must declare it's API url to enable this feature, check declared API url with `IExecWorkerpoolModule.getWorkerpoolApiUrl(workerpool)`

example:
```js
const { task, replicates } = await fetchOffchainInfo('0x668cb3e53ebbcc9999997709586c5af07f502f6120906fa3506ce1f531cedc81');

console.log(`task status: ${task.status}`);
replicates.forEach(({ worker, status }) =>
  console.log(`worker ${worker} replicate status: ${status}`)
);
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `taskid` | `string` |

#### Returns

`Promise`<{ `replicates`: { `exitCode?`: `number` ; `status`: `string` ; `statusHistory`: { `cause?`: `string` ; `date`: `string` ; `status`: `string`  }[] ; `worker`: `string`  }[] ; `task`: { `status`: `string` ; `statusHistory`: { `cause?`: `string` ; `date`: `string` ; `status`: `string`  }[]  }  }\>

___

### fetchResults

▸ **fetchResults**(`taskid`): `Promise`<`Response`\>

**IPFS stored results only**

download the specified task result.

example:
```js
const response = await fetchResults('0x668cb3e53ebbcc9999997709586c5af07f502f6120906fa3506ce1f531cedc81');
const binary = await response.blob();
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `taskid` | `string` |

#### Returns

`Promise`<`Response`\>

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

___

### show

▸ **show**(`taskid`): `Promise`<[`Task`](../interfaces/internal_.Task.md)\>

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

`Promise`<[`Task`](../interfaces/internal_.Task.md)\>

___

### fromConfig

▸ **fromConfig**(`config`): [`IExecTaskModule`](IExecTaskModule.md)

Create an IExecTaskModule instance using an IExecConfig instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`IExecConfig`](IExecConfig.md) |

#### Returns

[`IExecTaskModule`](IExecTaskModule.md)

#### Overrides

[IExecModule](IExecModule.md).[fromConfig](IExecModule.md#fromconfig)
