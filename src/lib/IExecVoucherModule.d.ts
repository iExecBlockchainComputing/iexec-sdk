export type * from '../common/types.js';

import IExecConfig from './IExecConfig.js';
import IExecModule from './IExecModule.js';
import { Address, Addressish, BN, TxHash } from '../common/types.js';

interface VoucherInfo {
  owner: Address;
  address: Address;
  type: BN;
  balance: BN;
  expirationTimestamp: BN;
  sponsoredApps: Address[];
  sponsoredDatasets: Address[];
  sponsoredWorkerpools: Address[];
  allowanceAmount: BN;
  authorizedAccounts: Address[];
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
   * const voucherAddress = await getVoucherAddress(ownerAddress);
   * console.log('voucher contract address:', voucherAddress);
   * ```
   */
  getVoucherAddress(owner: Addressish): Promise<Address | null>;

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
   * returns the user voucher information
   *
   * example:
   * ```js
   * const userVoucher = await showUserVoucher(userAddress);
   * console.log('address:', userVoucher.address);
   * console.log('balance:', userVoucher.balance);
   * console.log('expiration:', userVoucher.expirationTimestamp);
   * console.log('sponsored apps:', userVoucher.sponsoredApps);
   * console.log('sponsored datasets:', userVoucher.sponsoredDatasets);
   * console.log('sponsored workerpools:', userVoucher.sponsoredWorkerpools);
   * console.log('allowance on user account:', userVoucher.allowanceAmount);
   * console.log('authorized accounts:', userVoucher.authorizedAccounts);
   * ```
   */
  showUserVoucher(owner: Addressish): Promise<VoucherInfo>;

  /* **SIGNER REQUIRED**
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
  static fromConfig(config: IExecConfig): IExecVoucherModule;
}
