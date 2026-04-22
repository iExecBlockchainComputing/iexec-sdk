export type * from '../common/types.js';
export type * from './IExecConfig.js';

import IExecConfig from './IExecConfig.js';
import IExecModule from './IExecModule.js';

/**
 * module exposing network methods
 */
export default class IExecNetworkModule extends IExecModule {
  /**
   * get info about the current iExec network
   *
   * example:
   * ```js
   * const { chainId } = await getNetwork();
   * console.log(`working on chain ${chainId}`);
   * ```
   */
  getNetwork(): Promise<{ chainId: string }>;
  /**
   * Create an IExecNetworkModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecNetworkModule;
}
