export type * from '../common/types.js';
export type * from './IExecConfig.js';

import IExecConfig from './IExecConfig.js';
import IExecModule from './IExecModule.js';
import { Address, NRLCAmount, TxHash, WeiAmount, BN } from '../common/types.js';

/**
 * module exposing wallet methods
 */
export default class IExecWalletModule extends IExecModule {
  /**
   * **SIGNER REQUIRED**
   *
   * get the connected wallet address
   *
   * example:
   * ```js
   * const userAddress = await getAddress();
   * console.log('user address:', userAddress);
   * ```
   */
  getAddress(): Promise<Address>;
  /**
   * check the wallet balances (native and iExec token) of specified address
   *
   * example:
   * ```js
   * const { wei, nRLC } = await checkBalances(address);
   * console.log('iExec nano RLC:', nRLC.toString());
   * console.log('ethereum wei:', wei.toString());
   * ```
   */
  checkBalances(address: Address): Promise<{
    wei: BN;
    nRLC: BN;
  }>;
  /**
   * **SIGNER REQUIRED**
   *
   * send some wei to the specified address
   *
   * example:
   * ```js
   * const txHash = await sendETH(amount, receiverAddress);
   * console.log('transaction hash:', txHash);
   * ```
   */
  sendETH(weiAmount: WeiAmount, to: Address): Promise<TxHash>;
  /**
   * **SIGNER REQUIRED**
   *
   * send some nRLC to the specified address
   *
   * example:
   * ```js
   * const txHash = await sendRLC(amount, receiverAddress);
   * console.log('transaction hash:', txHash);
   * ```
   */
  sendRLC(nRLCAmount: NRLCAmount, to: Address): Promise<TxHash>;
  /**
   * **SIGNER REQUIRED**
   *
   * send all the iExec token and the native token owned by the wallet to the specified address
   *
   * _NB_: if the native token transfer fails, the method does not throw, the failure is reported in `errors` instead
   *
   * example:
   * ```js
   * const { sendERC20TxHash, sendNativeTxHash, errors } =
   *   await sweep(receiverAddress);
   * console.log('sweep RLC transaction hash:', sendERC20TxHash);
   * console.log('sweep ether transaction hash:', sendNativeTxHash);
   * if (errors) console.warn('sweep errors:', errors);
   * ```
   */
  sweep(to: Address): Promise<{
    /**
     * iExec token transfer tx hash (not set when the wallet has no iExec token)
     */
    sendERC20TxHash?: TxHash;
    /**
     * native token transfer tx hash (not set when the native token transfer failed)
     */
    sendNativeTxHash?: TxHash;
    /**
     * errors encountered during the sweep (not set when no error occurred)
     */
    errors?: string[];
  }>;
  /**
   * Create an IExecWalletModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecWalletModule;
}
