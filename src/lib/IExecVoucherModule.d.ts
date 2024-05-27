export type * from '../common/types.js';

import IExecConfig from './IExecConfig.js';
import IExecModule from './IExecModule.js';
import { Address, Addressish, BN, TxHash } from '../common/types.js';

interface Voucher {
  owner: Address;
  address: Address;
  type: BN;
  balance: BN;
  expirationTimestamp: BN;
  sponsoredApps: Address[];
  sponsoredDatasets: Address[];
  sponsoredWorkerpools: Address[];
  allowanceAmount: BN;
  authorizedAccounts: AuthorizedAccount[];
}
interface AuthorizedAccount {
  id: Address;
}

/**
 * module exposing voucher methods
 */
export default class IExecVoucherModule extends IExecModule {
  /**
   * returns the address of the voucher contract for the specified address if the address owns a voucher
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
   * returns the user voucher information
   *
   * example:
   * ```js
   * const userVoucher = await showUserVoucher(userAddress);
   * console.log('address:', userVoucher.address);
   * console.log('balance:', userVoucher.balance);
   * ```
   */
  showUserVoucher(owner: Addressish): Promise<Voucher>;

  /**
   * Create an IExecVoucherModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecNetworkModule;
}
