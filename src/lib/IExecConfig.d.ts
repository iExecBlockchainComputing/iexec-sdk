import IExecContractsClient from '../common/utils/IExecContractsClient';
import { EnhancedWallet } from '../common/utils/signers';
import { ExternalProvider } from '@ethersproject/providers';

export interface IExecConfigArgs {
  /**
   * A web3 Eth provider
   */
  ethProvider: ExternalProvider | EnhancedWallet;
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
   * override the ENS registry contract address to target a custom instance
   */
  ensRegistryAddress?: string;
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
     * IExec contract address on bridgde network
     */
    hubAddress?: string;
    /**
     * bridge contract address on bridgde network
     */
    bridgeAddress?: string;
  };
  /**
   * override the enterprise configuration
   */
  enterpriseSwapConf?: {
    /**
     * IExec enerprise contract address
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
  smsURL?: string;
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
  confirms?: boolean;
}

/**
 * configuration for IExecModule
 *
 * example:
 * ```js
 * // create the configuration
 * const config = new IExecConfig({ ethProvider: window.ethereum });
 *
 * // instanciate iExec SDK
 * const iexec = IExec.fromConfig(config);
 *
 * // or instanciate IExecModules sharing the same configuration
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
   * const { getSignerFromPrivateKey } = require('iexec/utils');
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
  resolveSmsURL(): Promise<string>;
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
   * resolve the current ENS public resolver contract address
   */
  resolveEnsPublicResolverAddress(): Promise<string>;
}
