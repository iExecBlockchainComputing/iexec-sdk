import IExecModule from './IExecModule';
import { Addressish, BN, NRLCAmount, TxHash } from './types';

/**
 * module exposing account methods
 */
export default class IExecAccountModule extends IExecModule {
  /**
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
   * check the account balance of specified address (stake is availlable nRLC, locked is escowed nRLC)
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
}
