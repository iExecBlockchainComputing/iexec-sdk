import IExecConfig from './IExecConfig';
import IExecModule from './IExecModule';
import { Observable } from '../common/utils/reactive';
import { Address, BN, Bytes, Bytes32, Dealid, Taskid, TxHash } from './types';

declare class TaskObservable extends Observable {
  /**
   * subscribe to task updates via an Observer until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the retruned unsubscribe method.
   *
   * return the `unsubscribe: () => void` method.
   *
   * data:
   * | message | comment |
   * | --- | --- |
   * | `TASK_UPDATED` | sent with every time the task status changes |
   * | `TASK_COMPLETED` | sent once when the task is completed |
   * | `TASK_TIMEDOUT` | sent once when the deadline is reached before completion|
   * | `TASK_FAILED` | sent once when the task is claimed after a timeout |
   */
  subscribe(callbacks: {
    /**
     * callback fired with initial task status and after every task status update
     *
     * data:
     * | message | comment |
     * | --- | --- |
     * | `TASK_UPDATED` | sent with every time the task status changes |
     * | `TASK_COMPLETED` | sent once when the task is completed |
     * | `TASK_TIMEDOUT` | sent once when the deadline is reached before completion|
     * | `TASK_FAILED` | sent once when the task is claimed after a timeout |
     */
    next: (data: { message: string }) => any;
    /**
     * callback fired once when the task is completed or when the deadline is reached
     *
     * no other callback is fired after firing `complete()`
     */
    complete: () => any;
    /**
     * callback fired once when an error occurs
     *
     * no other callback is fired after firing `error(error: Error)`
     */
    error: (error: Error) => any;
  }): /**
   * `unsubscribe: () => void` method, calling this method cancels the subscribtion
   *
   * no callback is fired after calling this method
   */
  () => void;
}

/**
 * module exposing task methods
 */
export default class IExecTaskModule extends IExecModule {
  /**
   * show the details of a task.
   *
   * example:
   * ```js
   * const task = await show(
   *  '0xec8045dfb0235d46c2d7ece1eadfe7741728754aed8b7efb716e9890cf3e9a8d',
   * );
   * console.log('task:', task);
   * ```
   */
  show(taskid: Taskid): Promise<{
    taskid: Taskid;
    idx: BN;
    dealid: Dealid;
    status: number;
    statusName: string;
    taskTimedOut: boolean;
    contributionDeadline: BN;
    revealDeadline: BN;
    finalDeadline: BN;
    consensusValue: Bytes32 | Bytes;
    revealCounter: BN;
    winnerCounter: BN;
    contributors: Address[];
    resultDigest: Bytes32 | Bytes;
    results: { storage: string; location?: string } | Bytes;
    resultsTimestamp: BN;
    resultsCallback: Bytes;
  }>;
  /**
   * return an Observable with a `subscribe` method to monitor the task status changes.
   *
   * _NB_: specify the `dealid` of the task to allow task monitoring when the task is not yet initialized (ACTIVE)
   *
   * example:
   * - monitor task updates
   * ```js
   * const taskObservable = await obsTask('0xec8045dfb0235d46c2d7ece1eadfe7741728754aed8b7efb716e9890cf3e9a8d');
   * const unsubscribe = taskObservable.subscribe({
   *  next: ({ message, task }) => console.log(message, task.statusName),
   *  error: (e) => console.error(e),
   *  complete: () => console.log('final state reached'),
   * });
   * // call unsubscribe() to unsubscribe from taskObservable
   * ```
   * - wait for task completion
   * ```js
   * const waitFinalState = (taskid, dealid) =>
   *   new Promise((resolve, reject) => {
   *     let taskState;
   *     iexec.task.obsTask(taskid, { dealid }).subscribe({
   *       next ({task}) => taskState = task,
   *       error: e => reject(e),
   *       complete: () => resolve(taskState),
   *     });
   *   });
   * const task = await waitFinalState(
   *   '0xec8045dfb0235d46c2d7ece1eadfe7741728754aed8b7efb716e9890cf3e9a8d',
   *   '0x4246d0ddf4c4c728cedd850890ee9a6781a88e5d3c46098c0774af3b7963879b',
   * );
   * ```
   */
  obsTask(
    taskid: Taskid,
    optional?: { dealid?: Dealid },
  ): Promise<TaskObservable>;
  /**
   * **SIGNER REQUIRED**
   *
   * claim a task not completed after the final deadline (proceed to refunds).
   *
   * example:
   * ```js
   * const claimTxHash = await claim(taskid);
   * console.log('task claimed:', claimTxHash);
   * ```
   */
  claim(taskid: Taskid): Promise<TxHash>;
  /**
   * **IPFS stored results only**
   *
   * download the specified task result.
   *
   * example:
   * ```js
   * const response = await fetchResults('0x668cb3e53ebbcc9999997709586c5af07f502f6120906fa3506ce1f531cedc81');
   * cosnt binary = await response.blob();
   * ```
   */
  fetchResults(taskid: Taskid): Promise<Response>;
  /**
   * Create an IExecTaskModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecTaskModule;
}
