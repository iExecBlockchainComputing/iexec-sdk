export type * from '../common/types.js';
export type * from './IExecConfig.js';

import IExecConfig from './IExecConfig.js';
import IExecModule from './IExecModule.js';
import { BN, BNish, TxHash } from '../common/types.js';

/**
 * IExec category
 */
export interface Category {
  /**
   * a name for the category
   */
  name: string;
  /**
   * a description of the category
   */
  description: string;
  /**
   * time base (in sec) for the category (tasks of this category must be completed under 10 * workClockTimeRef)
   */
  workClockTimeRef: BNish;
}

/**
 * module exposing hub methods
 */
export default class IExecHubModule extends IExecModule {
  /**
   * **SIGNER REQUIRED, ONLY IEXEC OWNER**
   *
   * create a computation category on the iExec contract
   *
   * example:
   * ```js
   * const { catid } = await createCategory({
   *  name: 'Small',
   *  description: '5 min',
   *  workClockTimeRef: 300,
   * });
   * console.log('deployed with catid', catid);
   * ```
   */
  createCategory(category: {
    name: string;
    description: string;
    workClockTimeRef: BNish;
  }): Promise<{ catid: BN; txHash: TxHash }>;
  /**
   * show category with specified catid.
   *
   * example:
   * ```js
   * const category = await showCategory(0);
   * console.log('category:', category);
   * ```
   */
  showCategory(catid: BNish): Promise<Category>;
  /**
   * count the created categories.
   *
   * example:
   * ```js
   * const count = await countCategory();
   * console.log('category count:', count);
   * ```
   */
  countCategory(): Promise<BN>;
  /**
   * get the current `TimeoutRatio`
   *
   * `TimeoutRatio` is used with the category `workClockTimeRef` to determine the tasks duration (task max duration = TimeoutRatio * workClockTimeRef)
   *
   * example:
   * ```js
   * const timeoutRatio = await getTimeoutRatio();
   * console.log('timeoutRatio:', timeoutRatio);
   * ```
   */
  getTimeoutRatio(): Promise<BN>;
  /**
   * Create an IExecHubModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecHubModule;
}
