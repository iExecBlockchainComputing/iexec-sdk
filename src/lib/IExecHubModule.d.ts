import IExecModule from './IExecModule';
import { BN, BNish, Category, TxHash } from './types';

/**
 * module exposing hub methods
 */
export default class IExecHubModule extends IExecModule {
  /**
   * **ONLY OWNER**
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
   * get the current `TimoutRatio`
   *
   * `TimoutRatio` is used with the category `workClockTimeRef` to determine the tasks duration (task max duration = TimoutRatio * workClockTimeRef)
   *
   * example:
   * ```js
   * const timoutRatio = await getTimeoutRatio();
   * console.log('timoutRatio:', timoutRatio);
   * ```
   */
  getTimeoutRatio(): Promise<BN>;
}
