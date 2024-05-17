export type * from '../common/types.js';

import IExecConfig from './IExecConfig.js';
import IExecModule from './IExecModule.js';
import { Address, Addressish } from '../common/types.js';

/**
 * module exposing voucher methods
 */
export default class IExecVoucherModule extends IExecModule {
  /**
   * return the address of the voucher contract of the specified address when the addres owns one
   *
   * example:
   * ```js
   * const voucherAddress = await getVoucherAddress(ethAddress);
   * console.log('voucher contract address:', voucherAddress);
   * ```
   */
  getVoucherAddress(address: Addressish): Promise<Address | undefined>;
  /**
   * Create an IExecVoucherModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecNetworkModule;
}
