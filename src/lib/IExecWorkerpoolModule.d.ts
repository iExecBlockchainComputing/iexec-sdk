import IExecModule from './IExecModule';
import { Address, Addressish, Workerpool, BN, BNish, TxHash } from './types';

/**
 * module exposing workerpool methods
 */
export default class IExecWorkerpoolModule extends IExecModule {
  /**
   * deploy a workerpool contract on the blockchain
   *
   * example:
   * ```js
   * const { address } = await deployWorkerpool({
   *  owner: address,
   *  description: 'My workerpool',
   * });
   * console.log('deployed at', address);
   * ```
   */
  deployWorkerpool(workerpool: {
    /**
     * the workerpool owner
     */
    owner: Addressish;
    /**
     * a description for the workerpool
     */
    description: string;
  }): Promise<{ address: Address; txHash: TxHash }>;
  /**
   * show a deployed workerpool details
   *
   * example:
   * ```js
   * const { workerpool } = await showWorkerpool('0x86F2102532d9d01DA8084c96c1D1Bdb90e12Bf07');
   * console.log('workerpool:', workerpool);
   * ```
   */
  showWorkerpool(
    workerpoolAddress: Addressish,
  ): Promise<{ objAddress: Address; workerpool: Workerpool }>;
  /**
   * count the workerpools owned by an address.
   *
   * example:
   * ```js
   * const count = await countUserWorkerpools(userAddress);
   * console.log('workerpool count:', count);
   * ```
   */
  countUserWorkerpools(userAddress: Addressish): Promise<BN>;
  /**
   * show deployed workerpool details by index for specified user user
   *
   * example:
   * ```js
   * const { workerpool } = await showUserWorkerpool(0, userAddress);
   * console.log('workerpool:', workerpool);
   * ```
   */
  showUserWorkerpool(
    index: BNish,
    address: Addressish,
  ): Promise<{ objAddress: Address; workerpool: Workerpool }>;
}
