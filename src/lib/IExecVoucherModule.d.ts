export type * from '../common/types.js';

import IExecConfig from './IExecConfig.js';
import IExecModule from './IExecModule.js';
import { Address, Addressish, TxHash } from '../common/types.js';

/**
 * module exposing voucher methods
 */
export default class IExecVoucherModule extends IExecModule {
  /**
   * returns the address of the voucher contract for the specified address if the address owns a voucher
   *
   * example:
   * ```js
   * const voucherAddress = await getVoucherAddress(ownerAddress);
   * console.log('voucher contract address:', voucherAddress);
   * ```
   */
  getVoucherAddress(owner: Addressish): Promise<Address | undefined>;

  /**
   * **SIGNER REQUIRED**
   *
   * authorize a requester to use the voucher
   *
   * example:
   * ```js
   * const txHash = await authorizeRequester(requesterAddress);
   * console.log('tx:', txHash);
   * ```
   */
  authorizeRequester(requester: Addressish): Promise<TxHash>;

  /**
   * **SIGNER REQUIRED**
   *
   * revoke the authorization previously granted to a requester to use the voucher
   *
   * example:
   * ```js
   * const txHash = await revokeRequesterAuthorization(requesterAddress);
   * console.log('tx:', txHash);
   * ```
   */
  revokeRequesterAuthorization(requester: Addressish): Promise<TxHash>;

  /**
   * Create an IExecVoucherModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecNetworkModule;
}
