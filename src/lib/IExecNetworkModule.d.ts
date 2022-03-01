import IExecModule from './IExecModule';
import {
  Address,
  Addressish,
  App,
  BN,
  BNish,
  Bytes32,
  Category,
  Multiaddress,
  TxHash,
} from './types';

/**
 * module exposing network methods
 */
export default class IExecHubModule extends IExecModule {
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
}
