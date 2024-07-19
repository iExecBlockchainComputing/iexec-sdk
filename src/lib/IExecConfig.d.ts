export type * from '../common/types.js';
export type * from './IExecConfig.js';

import IExecContractsClient from '../common/utils/IExecContractsClient.js';
import { EnhancedWallet } from '../common/utils/signers.js';
import { AnyRecord, ProviderOptions, TeeFramework } from '../common/types.js';
import { AbstractProvider, AbstractSigner } from 'ethers';
import { BrowserProvider } from 'ethers';

export interface Eip1193Provider {
  request(request: {
    method: string;
    params?: Array<any> | Record<string, any>;
  }): Promise<any>;
}
export interface IExecConfigArgs {
  /**
   * A web3 Eth provider, network name or chain id or an ethers provider
   *
   * read-only provider examples:
   * - `"mainnet"` or `1` or `"1"` for ethereum mainnet provider
   * - `"bellecour"` or `134` or `"134"` for iExec sidechain
   * - `"http://localhost:8545"` for local chain
   * - `new ethers.JsonRpcProvider("https://bellecour.iex.ec")` ethers provider connected to bellecour
   *
   * signer provider examples:
   * - `window.ethereum` for browser injected wallet provider
   * - `utils.getSignerFromPrivateKey('bellecour', PRIVATE_KEY)` signer connected to bellecour
   * - `new ethers.Wallet(PRIVATE_KEY, new ethers.JsonRpcProvider("https://bellecour.iex.ec"))` ethers wallet connected to bellecour
   */
  ethProvider:
    | Eip1193Provider
    | AbstractProvider
    | AbstractSigner
    | BrowserProvider
    | string
    | number;
  /**
   * flavour to use (default standard)
   */
  flavour?: string;
}

export interface IExecConfigOptions {
  /**
   * true if IExec contract use the chain native token (default false)
   */
  isNative?: boolean;
  /**
   * if false set the gasPrice to 0 (default true)
   */
  useGas?: boolean;
  /**
   * override the IExec contract address to target a custom instance
   */
  hubAddress?: string;
  /**
   * override the ENS public resolver contract address to target a custom instance
   */
  ensPublicResolverAddress?: string;
  /**
   * override the bridge contract address to target a custom instance
   */
  bridgeAddress?: string;
  /**
   * override the bridged network configuration
   */
  bridgedNetworkConf?: {
    /**
     * bridged network chainId
     */
    chainId?: number | string;
    /**
     * bridged network node url
     */
    rpcURL?: string;
    /**
     * IExec contract address on bridged network
     */
    hubAddress?: string;
    /**
     * bridge contract address on bridged network
     */
    bridgeAddress?: string;
  };
  /**
   * override the enterprise configuration
   */
  enterpriseSwapConf?: {
    /**
     * IExec enterprise contract address
     */
    hubAddress?: string;
  };
  /**
   * override the result proxy URL to target a custom instance
   */
  resultProxyURL?: string;
  /**
   * override the SMS URL to target a custom instance
   */
  smsURL?: Record<TeeFramework, string> | string;
  /**
   * override the TEE framework to use when as default
   */
  defaultTeeFramework?: TeeFramework;
  /**
   * override the IPFS gateway URL to target a custom instance
   */
  ipfsGatewayURL?: string;
  /**
   * override the IExec market URL to target a custom instance
   */
  iexecGatewayURL?: string;
  /**
   * number of block to wait for transactions confirmation (default 1)
   */
  confirms?: number;
  /**
   * [ethers default provider](https://docs.ethers.io/v5/api/providers/#providers-getDefaultProvider) options
   */
  providerOptions?: ProviderOptions | AnyRecord;
}

/**
 * configuration for IExecModule
 *
 * example:
 * ```js
 * // create the configuration
 * const config = new IExecConfig({ ethProvider: window.ethereum });
 *
 * // instantiate iExec SDK
 * const iexec = IExec.fromConfig(config);
 *
 * // or instantiate IExecModules sharing the same configuration
 * const account = IExecAccountModule.fromConfig(config);
 * const wallet = IExecWalletModule.fromConfig(config);
 * ```
 */
export default class IExecConfig {
  /**
   * Create an IExecConfig instance consumable by IExecModules
   *
   * example:
   *
   * - using injected provider client side
   *
   * ```js
   * const config = new IExecConfig({ ethProvider: window.ethereum });
   * ```
   *
   * - using a private key server side
   *
   * ```js
   * import { getSignerFromPrivateKey } from 'iexec/utils';
   * const config = new IExecConfig({ ethProvider: getSignerFromPrivateKey('mainnet', privateKey) });
   * ```
   */
  constructor(args: IExecConfigArgs, options?: IExecConfigOptions);
  /**
   * resolve the current chainId
   */
  resolveChainId(): Promise<number>;
  /**
   * resolve the current IExecContractsClient
   */
  resolveContractsClient(): Promise<IExecContractsClient>;
  /**
   * resolve the current bridged IExecContractsClient
   */
  resolveBridgedContractsClient(): Promise<IExecContractsClient>;
  /**
   * resolve the current standard IExecContractsClient
   */
  resolveStandardContractsClient(): Promise<IExecContractsClient>;
  /**
   * resolve the current enterprise IExecContractsClient
   */
  resolveEnterpriseContractsClient(): Promise<IExecContractsClient>;
  /**
   * resolve the current SMS URL
   */
  resolveSmsURL(options?: { teeFramework?: TeeFramework }): Promise<string>;
  /**
   * resolve the current result proxy URL
   */
  resolveResultProxyURL(): Promise<string>;
  /**
   * resolve the current IExec market URL
   */
  resolveIexecGatewayURL(): Promise<string>;
  /**
   * resolve the current IPFS gateway URL
   */
  resolveIpfsGatewayURL(): Promise<string>;
  /**
   * resolve the current bridge contract address
   */
  resolveBridgeAddress(): Promise<string>;
  /**
   * resolve the bridge contract address on bridged chain
   */
  resolveBridgeBackAddress(): Promise<string>;
  /**
   * resolve the current ENS public resolver contract address
   */
  resolveEnsPublicResolverAddress(): Promise<string>;
}
