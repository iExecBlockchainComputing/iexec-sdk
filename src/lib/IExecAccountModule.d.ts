export * from '../common/types.js';

import IExecConfig from './IExecConfig.js';
import IExecModule from './IExecModule.js';
import { Addressish, BN, NRLCAmount, TxHash } from '../common/types.js';

/**
 * module exposing account methods
 */
export default class IExecAccountModule extends IExecModule {
  /**
   * **SIGNER REQUIRED**
   *
   * approves the spender to use the account up to a specified amount, denoted in nRLC (1 nRLC = 1*10^-9 RLC).
   *
   * example:
   * ```js
   * const txHash = await approve(amount, spenderAddress);
   * console.log('tx:', txHash);
   * ```
   */
  approve(amount: NRLCAmount, spenderAddress: Addressish): Promise<TxHash>; /**
   * **SIGNER REQUIRED**
   *
   * deposit some nRLC (1 nRLC = 1*10^-9 RLC) from user wallet to user account
   *
   * example:
   * ```js
   * const { amount, txHash } = await deposit('1000000000');
   * console.log('Deposited:', amount);
   * console.log('tx:', txHash);
   * ```
   */
  deposit(amount: NRLCAmount): Promise<{ amount: BN; txHash: TxHash }>;
  /**
   * **SIGNER REQUIRED**
   *
   * withdraw some nRLC (1 nRLC = 1*10^-9 RLC) from user account to user wallet
   *
   * example:
   * ```js
   * const { amount, txHash } = await iexec.account.withdraw('1000000000');
   * console.log('Withdrawn:', amount);
   * console.log('tx:', txHash);
   * ```
   */
  withdraw(amount: NRLCAmount): Promise<{ amount: BN; txHash: TxHash }>;
  /**
   * check the account balance of specified address (stake is available nRLC, locked is escrowed nRLC)
   *
   * example:
   * ```js
   * const balance = await checkBalance(ethAddress);
   * console.log('Nano RLC staked:', balance.stake.toString());
   * console.log('Nano RLC locked:', balance.locked.toString());
   * ```
   */
  checkBalance(address: Addressish): Promise<{ stake: BN; locked: BN }>;
  /**
   * check the account balance on bridged chain of specified address ie: when connected to mainnet, check the account ballance on bellecour
   * example:
   * ```js
   * const balance = await checkBridgedBalance(ethAddress);
   * console.log('Nano RLC staked:', balance.stake.toString());
   * console.log('Nano RLC locked:', balance.locked.toString());
   * ```
   */
  checkBridgedBalance(address: Addressish): Promise<{ stake: BN; locked: BN }>;
  /**
   * Create an IExecAccountModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecAccountModule;
}
