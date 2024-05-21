export type * from '../common/types.js';

import IExecConfig from './IExecConfig.js';
import IExecModule from './IExecModule.js';
import { Address, Addressish, TxHash } from '../common/types.js';

/**
 * module exposing voucher methods
 */
export default class IExecVoucherModule extends IExecModule {
  /**
   * return the address of the voucher contract of the specified address when the address owns one
   *
   * example:
   * ```js
   * const voucherAddress = await getVoucherAddress(ethAddress);
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
   * const txHash = await authorizeRequester(ethAddress);
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
   * const txHash = await revokeRequesterAuthorization(ethAddress);
   * console.log('tx:', txHash);
   * ```
   */
  revokeRequesterAuthorization(requester: Addressish): Promise<TxHash>;

  /**
   * Create an IExecVoucherModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecNetworkModule;
}
