import IExecConfig from './IExecConfig';
import { Observable } from '../common/utils/reactive';
import IExecModule from './IExecModule';
import {
  Address,
  Addressish,
  BN,
  BNish,
  Bytes,
  Bytes32,
  Dealid,
  OrderHash,
  Taskid,
  TaskIndex,
  TxHash,
} from './types';

declare class DealObservable extends Observable {
  /**
   * subscribe to deal updates via an Observer until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the retruned unsubscribe method.
   *
   * return the `unsubscribe: () => void` method.
   *
   * data:
   * | message | comment |
   * | --- | --- |
   * | `DEAL_UPDATED` | sent every time a task status changes |
   * | `DEAL_COMPLETED` | sent once all tasks are complteted |
   * | `DEAL_TIMEDOUT` | sent once the timeout is reached before all tasks completion |
   */
  subscribe(callbacks: {
    /**
     * callback fired with initial deal status and after every deal status update
     *
     * data:
     * | message | comment |
     * | --- | --- |
     * | `DEAL_UPDATED` | sent every time a task status changes |
     * | `DEAL_COMPLETED` | sent once all tasks are complteted |
     * | `DEAL_TIMEDOUT` | sent once the timeout is reached before all tasks completion |
     */
    next: (data: {
      message: string;
      taskCount: number;
      completedTasksCount: number;
      failedTaksCount: number;
      deal: {
        dealid: Dealid;
        app: { pointer: Address; owner: Address; price: BN };
        dataset: { pointer: Address; owner: Address; price: BN };
        workerpool: { pointer: Address; owner: Address; price: BN };
        trust: BN;
        category: BN;
        tag: Bytes32;
        requester: Address;
        beneficiary: Address;
        callback: Address;
        params: string;
        startTime: BN;
        botFirst: BN;
        botSize: BN;
        workerStake: BN;
        schedulerRewardRatio: BN;
        finalTime: BN;
        deadlineReached: boolean;
        tasks: Taskid[];
      };
      tasks: {
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
      }[];
    }) => any;
    /**
     * callback fired once when all the tasks are completed or when the deadline is reached
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

interface PaginableDeals {
  /**
   * deal page (this may be a partial result)
   */
  deals: {
    app: { pointer: Address; owner: Address; price: number };
    dataset: { pointer: Address; owner: Address; price: number };
    workerpool: { pointer: Address; owner: Address; price: number };
    dealid: Dealid;
    appHash: OrderHash;
    datasetHash: OrderHash;
    workerpoolHash: OrderHash;
    requestHash: OrderHash;
    trust: number;
    category: number;
    tag: Bytes32;
    requester: Address;
    beneficiary: Address;
    callback: Address;
    params: string;
    startTime: number;
    botFirst: number;
    botSize: number;
    workerStake: number;
    schedulerRewardRatio: number;
  }[];
  /**
   * total count
   */
  count: number;
  /**
   * when a partial result is returned, `more()` can be called to get the next page.
   */
  more?: () => Promise<PaginableDeals>;
}

/**
 * module exposing deal methods
 */
export default class IExecDealModule extends IExecModule {
  /**
   * show the details of a deal.
   *
   * example:
   * ```js
   * const deal = await show(
   *  '0x4246d0ddf4c4c728cedd850890ee9a6781a88e5d3c46098c0774af3b7963879b',
   * );
   * console.log('deal:', deal);
   * ```
   */
  show(dealid: Dealid): Promise<{
    dealid: Dealid;
    app: { pointer: Address; owner: Address; price: BN };
    dataset: { pointer: Address; owner: Address; price: BN };
    workerpool: { pointer: Address; owner: Address; price: BN };
    trust: BN;
    category: BN;
    tag: Bytes32;
    requester: Address;
    beneficiary: Address;
    callback: Address;
    params: string;
    startTime: BN;
    botFirst: BN;
    botSize: BN;
    workerStake: BN;
    schedulerRewardRatio: BN;
    finalTime: BN;
    deadlineReached: boolean;
    tasks: Record<TaskIndex, Taskid>;
  }>;
  /**
   * return an Observable with a `subscribe` method to monitor the deal status changes.
   *
   * example:
   * ```js
   * const dealObservable = await obsDeal('0x4246d0ddf4c4c728cedd850890ee9a6781a88e5d3c46098c0774af3b7963879b');
   * const unsubscribe = dealObservable.subscribe({
   *  next: (data) =>
   *    console.log(
   *      data.message,
   *      `completed tasks ${data.completedTasksCount}/${data.tasksCount}`,
   *    ),
   *  error: (e) => console.error(e),
   *  complete: () => console.log('final state reached'),
   * });
   * // call unsubscribe() to unsubscribe from dealObservable
   * ```
   */
  obsDeal(dealid: Dealid): Promise<DealObservable>;
  /**
   * compute the taskid of the task at specified index of specified deal.
   *
   * example:
   * ```js
   * const taskid = await computeTaskId('0x4246d0ddf4c4c728cedd850890ee9a6781a88e5d3c46098c0774af3b7963879b', 0);
   * console.log('taskid:', taskid)
   * ```
   */
  computeTaskId(dealid: Dealid, taskIdx: BNish): Promise<Taskid>;
  /**
   * claim all the failed task from a deal
   *
   * depending the number and the status of task to claim, this may involve several transactions in order to fit in the blockchain gasLimit per block. (for example a 10_000_000 gas block size allows to claim 180 initialized task or 40 non-initialized tasks in one block)
   *
   * example:
   * ```js
   * const { claimed, transactions } = await claim(dealid);
   * console.log(`transaction count ${transactions.length}`);
   * Object.entries(claimed).forEach(([idx, taskid]) => {
   *  console.log(`claimed task: idx ${idx} taskid ${taskid}`);
   * });
   * ```
   */
  claim(dealid: Dealid): Promise<{
    transactions: {
      txHash: TxHash;
      type: string;
    }[];
    claimed: Record<TaskIndex, Taskid>;
  }>;
  /**
   * fetch the latest deals of the requester optionaly filtered by specified filters.
   *
   * _NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.
   *
   * example:
   * ```js
   * const { deals, count } = await fetchRequesterDeals(userAddress);
   * console.log('deals count:', count);
   * console.log('last deal:', deals[0]);
   * ```
   */
  fetchRequesterDeals(
    requesterAddress: Addressish,
    filters?: {
      appAddress?: Addressish;
      datasetAddress?: Addressish;
      workerpoolAddress?: Addressish;
    },
  ): Promise<PaginableDeals>;
  /**
   * fetch the latest deals sealed with a specified apporder.
   *
   * _NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.
   *
   * example:
   * ```js
   * const { deals, count } = await fetchDealsByApporder('0x7fbbbf7ab1c4571111db8d4e3f7ba3fe29c1eb916453f9fbdce4b426e05cbbfb');
   * console.log('deals count:', count);
   * console.log('last deal:', deals[0]);
   * ```
   */
  fetchDealsByApporder(apporderHash: OrderHash): Promise<PaginableDeals>;
  /**
   * fetch the latest deals sealed with a specified datasetorder.
   *
   * _NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.
   *
   * example:
   * ```js
   * const { deals, count } = await fetchDealsByDatasetorder('0x60a810f4876fc9173bac74f7cff3c4cdc86f4aff66a72c2011f6e33e0dc8d3d0');
   * console.log('deals count:', count);
   * console.log('last deal:', deals[0]);
   * ```
   */
  fetchDealsByDatasetorder(
    datasetorderHash: OrderHash,
  ): Promise<PaginableDeals>;
  /**
   * fetch the latest deals sealed with a specified workerpoolorder.
   *
   * _NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.
   *
   * example:
   * ```js
   * const { deals, count } = await fetchDealsByWorkerpoolorder('0x2887965ec57500471593852e10e97e9e99ea81a9a0402be68a24683d6cd2b697');
   * console.log('deals count:', count);
   * console.log('last deal:', deals[0]);
   * ```
   */
  fetchDealsByWorkerpoolorder(
    workerpoolorderHash: OrderHash,
  ): Promise<PaginableDeals>;
  /**
   * fetch the latest deals sealed with a specified requestorder.
   *
   * _NB_: this method can return a subset of the complete result set, in this case, a `more()` method is also returned and enable getting the next subset.
   *
   * example:
   * ```js
   * const { deals, count } = await fetchDealsByRequestorder('0x5de0bc9e5604685e96e4031e3815dac55648254fd7b033b59b78c49de8b384b0');
   * console.log('deals count:', count);
   * console.log('last deal:', deals[0]);
   * ```
   */
  fetchDealsByRequestorder(
    requestorderHash: OrderHash,
  ): Promise<PaginableDeals>;
  /**
   * Create an IExecDealModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecDealModule;
}
