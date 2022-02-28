import IExecModule from './IExecModule';
import {
  Address,
  Addressish,
  App,
  BN,
  BNish,
  Bytes32,
  Multiaddress,
  TxHash,
} from './types';

/**
 * module exposing app methods
 */
export default class IExecAppModule extends IExecModule {
  /**
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
  deployApp(app: {
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
       * only "SCONE" is supported
       */
      provider: string;
      /**
       * provider's protocol version
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
  }): Promise<{ address: Address; txHash: TxHash }>;
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
}
