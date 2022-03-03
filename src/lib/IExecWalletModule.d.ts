import BN from 'bn.js';
import IExecModule from './IExecModule';
import { Address, Addressish, NRLCAmount, TxHash, WeiAmount } from './types';

declare class BrigdeObservable extends Observable {
  /**
   * subscribe and start the bridge process to transfer tokens from one chain to another until either `complete()` or `error(error: Error)` is called on the Observer or the subscribtion is canceled by calling the retruned cancel method.
   *
   * return the `cancel: () => void` method.
   *
   * data:
   * | message | comment | additional entries |
   * | --- | --- | --- |
   * | `CHECK_BRIDGE_POLICY` | sent once | |
   * | `BRIDGE_POLICY_CHECKED` | sent once | `minPerTx`,`maxPerTx`,`dailyLimit` |
   * | `CHECK_BRIDGE_LIMIT` | sent once |  |
   * | `BRIDGE_LIMIT_CHECKED` | sent once | `totalSpentPerDay` |
   * | `SEND_TO_BRIDGE_TX_REQUEST` | sent once | `bridgeAddress` |
   * | `SEND_TO_BRIDGE_TX_SUCCESS` | sent once | `txHash` |
   * | `WAIT_RECEIVE_TX` | sent once if the bridged chain is configured | `bridgeAddress` |
   * | `RECEIVE_TX_SUCCESS` | sent once if the bridged chain is configured | `txHash` |
   */
  subscribe(callbacks: {
    /**
     * callback fired at every configuration step
     *
     * data:
     * | message | comment | additional entries |
     * | --- | --- | --- |
     * | `CHECK_BRIDGE_POLICY` | sent once | |
     * | `BRIDGE_POLICY_CHECKED` | sent once | `minPerTx`,`maxPerTx`,`dailyLimit` |
     * | `CHECK_BRIDGE_LIMIT` | sent once |  |
     * | `BRIDGE_LIMIT_CHECKED` | sent once | `totalSpentPerDay` |
     * | `SEND_TO_BRIDGE_TX_REQUEST` | sent once | `bridgeAddress` |
     * | `SEND_TO_BRIDGE_TX_SUCCESS` | sent once | `txHash` |
     * | `WAIT_RECEIVE_TX` | sent once if the bridged chain is configured | `bridgeAddress` |
     * | `RECEIVE_TX_SUCCESS` | sent once if the bridged chain is configured | `txHash` |
     */
    next: (data: {
      message: string;
      minPerTx?: BN;
      maxPerTx?: BN;
      dailyLimit?: BN;
      totalSpentPerDay?: BN;
      bridgeAddress?: Address;
      txHash?: TxHash;
    }) => any;
    /**
     * callback fired once when the bridge process is completed
     *
     * no other callback is fired after firing `complete()`
     */
    complete: () => any;
    /**
     * callback fired once when an error occurs
     *
     * no other callback is fired after firing `error(error: Error)`
     */
    error: (error: Error) => any;
  }): /**
   * `cancel: () => void` method, calling this method cancels the subscribtion
   *
   * no callback is fired after calling this method
   */
  () => void;
}

/**
 * module exposing wallet methods
 */
export default class IExecWalletModule extends IExecModule {
  /**
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
   * check the wallet balances (native and iExec token) of specified address on bridged chain
   *
   * example:
   * ```js
   * const { wei, nRLC } = await checkBalances(address);
   * console.log('iExec nano RLC:', nRLC.toString());
   * console.log('ethereum wei:', wei.toString());
   * ```
   */
  checkBridgedBalances(address: Addressish): Promise<{
    wei: BN;
    nRLC: BN;
  }>;
  /**
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
   * send some nRLC to the sidechain
   *
   * _NB_:
   * - RLC is send to the mainchain bridge smart contract on mainchain then credited on sidechain by the sidechain bridge smart contract
   * - the reception of the value on the sidechain (`receiveTxHash`) will not be monitored if the bridged network configuration is missing
   *
   * example:
   * ```js
   * const { sendTxHash, receiveTxHash } = await bridgeToSidechain('1000000000');
   * console.log(`sent RLC on mainchain (tx: ${sendTxHash}), wallet credited on sidechain (tx: ${receiveTxHash})`);
   * ```
   */
  bridgeToSidechain(
    nRLCAmount: NRLCAmount,
  ): Promise<{ sendTxHash: TxHash; receiveTxHash?: TxHash }>;
  /**
   * send some nRLC to the mainchain
   *
   * _NB_:
   * - RLC is send to the sidechain bridge smart contract on sidechain then credited on mainchain by the mainchain bridge smart contract
   * - the reception of the value on the mainchain (`receiveTxHash`) will not be monitored if the bridged network configuration is missing
   *
   * example:
   * ```js
   * const { sendTxHash, receiveTxHash } = await bridgeToSidechain('1000000000');
   * console.log(`sent RLC on sidechain (tx: ${sendTxHash}), wallet credited on mainchain (tx: ${receiveTxHash})`);
   * ```
   */
  bridgeToMainchain(
    nRLCAmount: NRLCAmount,
  ): Promise<{ sendTxHash: TxHash; receiveTxHash?: TxHash }>;
  /*
   * return an Observable with a subscribe method to start and monitor the bridge to sidechain process
   *
   * example:
   * ```js
   * const bridgeObservable = await obsBridgeToSidechain('1000000000');
   * const cancel = bridgeObservable.subscribe({
   *   next: ({message, ...rest}) => console.log(message, ...rest),
   *   error: (err) => console.error(err),
   *   complete: () => console.log('completed'),
   * });
   * ```
   */
  obsBridgeToSidechain(nRLCAmount: NRLCAmount): Promise<BrigdeObservable>;
  /*
   * return an Observable with a subscribe method to start and monitor the bridge to mainchain process
   *
   * example:
   * ```js
   * const bridgeObservable = await obsBridgeToMainchain('1000000000');
   * const cancel = bridgeObservable.subscribe({
   *   next: ({message, ...rest}) => console.log(message, ...rest),
   *   error: (err) => console.error(err),
   *   complete: () => console.log('completed'),
   * });
   * ```
   */
  obsBridgeToMainchain(nRLCAmount: NRLCAmount): Promise<BrigdeObservable>;
  /**
   * **ONLY ERLC WHITELISTED ACCOUNTS**
   *
   * wrap some nRLC into neRLC (enterprise nRLC)
   *
   * example:
   * ```js
   * const txHash = await wrapEnterpriseRLC(amount);
   * console.log(`wrapped ${amount} nRLC into neRLC (tx: ${txHash})`);
   * ```
   */
  wrapEnterpriseRLC(nRLCAmount: NRLCAmount): Promise<TxHash>;
  /**
   * **ONLY ERLC WHITELISTED ACCOUNTS**
   *
   * unwrap some neRLC (enterprise nRLC) into nRLC
   *
   * example:
   * ```js
   * const txHash = await unwrapEnterpriseRLC(amount);
   * console.log(`unwrapped ${amount} neRLC into nRLC (tx: ${txHash})`);
   * ```
   */
  unwrapEnterpriseRLC(nRLCAmount: NRLCAmount): Promise<TxHash>;
}
