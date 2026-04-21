export type * from '../common/types.js';
export type * from './IExecConfig.js';

import IExecConfig from './IExecConfig.js';
import IExecModule from './IExecModule.js';
import {
  Address,
  Addressish,
  NRLCAmount,
  TxHash,
  WeiAmount,
  BN,
} from '../common/types.js';
import { Observable } from '../common/utils/reactive.js';

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
  checkBalances(address: Addressish): Promise<{
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
  sendETH(WeiAmount: WeiAmount, to: Addressish): Promise<TxHash>;
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
  sendRLC(nRLCAmount: NRLCAmount, to: Addressish): Promise<TxHash>;
  /**
   * **SIGNER REQUIRED**
   *
   * send all the iExec token and the native token owned by the wallet to the specified address
   *
   * example:
   * ```js
   * const { sendERC20TxHash, sendNativeTxHash } = await sweep(receiverAddress);
   * console.log('sweep RLC transaction hash:', sendERC20TxHash);
   * console.log('sweep ether transaction hash:', sendNativeTxHash);
   * ```
   */
  sweep(
    to: Addressish,
  ): Promise<{ sendERC20TxHash: TxHash; sendNativeTxHash: TxHash }>;
  /**
   * Create an IExecWalletModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecWalletModule;
}
