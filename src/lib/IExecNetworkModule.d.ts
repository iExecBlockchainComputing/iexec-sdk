export * from '../common/types.js';

import IExecConfig from './IExecConfig.js';
import IExecModule from './IExecModule.js';

/**
 * module exposing network methods
 */
export default class IExecNetworkModule extends IExecModule {
  /**
   * get info about the current iExec network
   *
   * _NB_: `isNative` is true when the iExec instance use the chain's native token for payment (otherwise the payment token is an ERC20)
   *
   * example:
   * ```js
   * const { chainId, isNative } = await getNetwork();
   * console.log(`working on chain ${chainId}, using native token: ${isNative}`);
   * ```
   */
  getNetwork(): Promise<{ chainId: number; isNative: boolean }>;
  /**
   * Create an IExecNetworkModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecNetworkModule;
}
