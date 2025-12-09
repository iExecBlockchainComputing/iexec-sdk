[**iexec**](../README.md)

***

[iexec](../globals.md) / IExecTaskModule

# Class: IExecTaskModule

module exposing task methods

## Extends

- [`IExecModule`](IExecModule.md)

## Constructors

### Constructor

> **new IExecTaskModule**(`configOrArgs`, `options?`): `IExecTaskModule`

Create an IExecModule instance

#### Parameters

##### configOrArgs

[`IExecConfigArgs`](../interfaces/IExecConfigArgs.md) | [`IExecConfig`](IExecConfig.md)

##### options?

[`IExecConfigOptions`](../interfaces/IExecConfigOptions.md)

#### Returns

`IExecTaskModule`

#### Inherited from

[`IExecModule`](IExecModule.md).[`constructor`](IExecModule.md#constructor)

## Properties

### config

> **config**: [`IExecConfig`](IExecConfig.md)

current IExecConfig

#### Inherited from

[`IExecModule`](IExecModule.md).[`config`](IExecModule.md#config)

## Methods

### claim()

> **claim**(`taskid`): `Promise`\<`string`\>

**SIGNER REQUIRED**

claim a task not completed after the final deadline (proceed to refunds).

example:
```js
const claimTxHash = await claim(taskid);
console.log('task claimed:', claimTxHash);
```

#### Parameters

##### taskid

`string`

#### Returns

`Promise`\<`string`\>

***

### fetchLogs()

> **fetchLogs**(`taskid`): `Promise`\<`object`[]\>

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

##### taskid

`string`

#### Returns

`Promise`\<`object`[]\>

***

### fetchOffchainInfo()

> **fetchOffchainInfo**(`taskid`): `Promise`\<\{ `replicates`: `object`[]; `task`: \{ `status`: `string`; `statusHistory`: `object`[]; \}; \}\>

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

##### taskid

`string`

#### Returns

`Promise`\<\{ `replicates`: `object`[]; `task`: \{ `status`: `string`; `statusHistory`: `object`[]; \}; \}\>

***

### fetchResults()

> **fetchResults**(`taskid`): `Promise`\<`Response`\>

**IPFS stored results only**

download the specified task result.

example:
```js
const response = await fetchResults('0x668cb3e53ebbcc9999997709586c5af07f502f6120906fa3506ce1f531cedc81');
const binary = await response.blob();
```

#### Parameters

##### taskid

`string`

#### Returns

`Promise`\<`Response`\>

***

### obsTask()

> **obsTask**(`taskid`, `optional?`): `Promise`\<[`TaskObservable`](../-internal-/classes/TaskObservable.md)\>

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

##### taskid

`string`

##### optional?

###### dealid?

`string`

#### Returns

`Promise`\<[`TaskObservable`](../-internal-/classes/TaskObservable.md)\>

***

### show()

> **show**(`taskid`): `Promise`\<[`Task`](../-internal-/interfaces/Task.md)\>

show the details of a task.

example:
```js
const task = await show(
 '0xec8045dfb0235d46c2d7ece1eadfe7741728754aed8b7efb716e9890cf3e9a8d',
);
console.log('task:', task);
```

#### Parameters

##### taskid

`string`

#### Returns

`Promise`\<[`Task`](../-internal-/interfaces/Task.md)\>

***

### fromConfig()

> `static` **fromConfig**(`config`): `IExecTaskModule`

Create an IExecTaskModule instance using an IExecConfig instance

#### Parameters

##### config

[`IExecConfig`](IExecConfig.md)

#### Returns

`IExecTaskModule`

#### Overrides

[`IExecModule`](IExecModule.md).[`fromConfig`](IExecModule.md#fromconfig)
