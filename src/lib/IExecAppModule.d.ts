export * from '../common/types.js';

import IExecConfig from './IExecConfig.js';
import IExecModule from './IExecModule.js';
import {
  Address,
  Addressish,
  BN,
  BNish,
  Bytes32,
  Multiaddress,
  TeeFramework,
  TxHash,
} from '../common/types.js';

export interface AppDeploymentArgs {
  /**
   * the app owner
   */
  owner: Addressish;
  /**
   * a name for the app
   */
  name: string;
  /**
   * only 'DOCKER' is supported
   */
  type: string;
  /**
   * app image address
   */
  multiaddr: Multiaddress;
  /**
   * app image digest
   */
  checksum: Bytes32;
  /**
   * optional for TEE apps only, specify the TEE protocol to use
   */
  mrenclave?: {
    /**
     * TEE framework name
     */
    framework: TeeFramework;
    /**
     * framework's protocol version
     */
    version: string;
    /**
     * app entrypoint path
     */
    entrypoint: string;
    /**
     * dedicated memory in bytes
     */
    heapSize: number;
    /**
     * app tee fingerprint
     */
    fingerprint: string;
  };
}
/**
 * IExec app
 */
export interface App {
  /**
   * the app owner
   */
  owner: Address;
  /**
   * a name for the app
   */
  appName: string;
  /**
   * only 'DOCKER' is supported
   */
  appType: string;
  /**
   * app image address
   */
  appMultiaddr: Multiaddress;
  /**
   * app image digest
   */
  appChecksum: Bytes32;
  /**
   * for TEE apps only, specify the TEE protocol to use
   */
  appMrenclave: string;
  /**
   * app registry address
   */
  registry: Address;
}

/**
 * module exposing app methods
 */
export default class IExecAppModule extends IExecModule {
  /**
   * **SIGNER REQUIRED**
   *
   * deploy an app contract on the blockchain
   *
   * example:
   * ```js
   * const { address } = await deployApp({
   *  owner: address,
   *  name: 'My app',
   *  type: 'DOCKER',
   *  multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
   *  checksum: '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
   * });
   * console.log('deployed at', address);
   * ```
   */
  deployApp(
    app: AppDeploymentArgs,
  ): Promise<{ address: Address; txHash: TxHash }>;
  /**
   * predict the app contract address given the app deployment arguments
   *
   * example:
   * ```js
   * const address = await predictAppAddress({
   *  owner: address,
   *  name: 'My app',
   *  type: 'DOCKER',
   *  multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
   *  checksum: '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
   * });
   * console.log('address', address);
   * ```
   */
  predictAppAddress(app: AppDeploymentArgs): Promise<Address>;
  /**
   * check if an app is deployed at a given address
   *
   * example:
   * ```js
   * const isDeployed = await checkDeployedApp(address);
   * console.log('app deployed', isDeployed);
   * ```
   */
  checkDeployedApp(appAddress: Addressish): Promise<Boolean>;
  /**
   * show a deployed app details
   *
   * example:
   * ```js
   * const { app } = await showApp('0xb9b56f1c78f39504263835342e7affe96536d1ea');
   * console.log('app:', app);
   * ```
   */
  showApp(appAddress: Addressish): Promise<{ objAddress: Address; app: App }>;
  /**
   * count the apps owned by an address.
   *
   * example:
   * ```js
   * const count = await countUserApps(userAddress);
   * console.log('app count:', count);
   * ```
   */
  countUserApps(userAddress: Addressish): Promise<BN>;
  /**
   * show deployed app details by index for specified user user
   *
   * example:
   * ```js
   * const { app } = await showUserApp(0, userAddress);
   * console.log('app:', app);
   * ```
   */
  showUserApp(
    index: BNish,
    address: Addressish,
  ): Promise<{ objAddress: Address; app: App }>;
  /**
   * check if a secret exists for the app in the Secret Management Service
   *
   * example:
   * ```js
   * const isSecretSet = await checkAppSecretExists(appAddress);
   * console.log('app secret set:', isSecretSet);
   * ```
   * _NB_:
   * - each TEE framework comes with a distinct Secret Management Service, if not specified the TEE framework is inferred from the app
   *
   */
  checkAppSecretExists(
    appAddress: Addressish,
    options?: { teeFramework?: TeeFramework },
  ): Promise<boolean>;
  /**
   * **SIGNER REQUIRED, ONLY APP OWNER**
   *
   * push an application secret to the Secret Management Service
   *
   * _NB_:
   * - pushed secret will be available for the app in `tee` tasks.
   * - once pushed a secret can not be updated
   * - each TEE framework comes with a distinct Secret Management Service, if not specified the TEE framework is inferred from the app
   *
   * example:
   * ```js
   * const isPushed = await pushAppSecret(appAddress, "passw0rd");
   * console.log('pushed App secret:', isPushed);
   * ```
   */
  pushAppSecret(
    appAddress: Addressish,
    secretValue: String,
    options?: { teeFramework?: TeeFramework },
  ): Promise<boolean>;
  /**
   * Create an IExecAppModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecAppModule;
}
