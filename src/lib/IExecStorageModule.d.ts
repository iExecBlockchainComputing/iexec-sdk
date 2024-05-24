export type * from '../common/types.js';
export type * from './IExecConfig.js';

import IExecConfig from './IExecConfig.js';
import IExecModule from './IExecModule.js';
import { Addressish, TeeFramework } from '../common/types.js';

/**
 * module exposing storage methods
 */
export default class IExecStorageModule extends IExecModule {
  /**
   * check if a storage token exists for the beneficiary in the Secret Management Service
   *
   * _NB_: specify the storage provider with the option `provider` (supported values `'ipfs'`|`'dropbox'` default `'ipfs'`)
   *
   * example:
   * ```js
   * const isIpfsStorageInitialized = await checkStorageTokenExists(userAddress);
   * console.log('IPFS storage initialized:', isIpfsStorageInitialized);
   * ```
   */
  checkStorageTokenExists(
    beneficiaryAddress: Addressish,
    options?: {
      provider?: string;
      teeFramework?: TeeFramework;
    },
  ): Promise<boolean>;
  /**
   * **SIGNER REQUIRED, ONLY BENEFICIARY**
   *
   * get an authorization token from the default IPFS based remote storage
   *
   * example:
   * ```js
   * const token = await defaultStorageLogin();
   * const { isPushed } = await pushStorageToken(token);
   * console.log('default storage initialized:', isPushed);
   * ```
   */
  defaultStorageLogin(): Promise<string>;
  /**
   * **SIGNER REQUIRED, ONLY BENEFICIARY**
   *
   * push a personal storage token to the Secret Management Service to allow result archive upload
   *
   * _NB_:
   * - specify the storage provider with the option `provider` (supported values `'ipfs'`|`'dropbox'` default `'ipfs'`)
   * - this method will throw an error if a token already exists for the target storage provider in the Secret Management Service unless the option `forceUpdate: true` is used.
   *
   * example:
   * - init default storage
   * ```js
   * const token = await defaultStorageLogin();
   * const { isPushed } = await pushStorageToken(token);
   * console.log('default storage initialized:', isPushed);
   * ```
   * - init dropbox storage
   * ```js
   * const { isPushed } = await pushStorageToken(dropboxApiToken, {provider: 'dropbox'});
   * console.log('dropbox storage initialized:', isPushed);
   * ```
   */
  pushStorageToken(
    token: string,
    options?: {
      provider?: string;
      teeFramework?: TeeFramework;
      forceUpdate?: boolean;
    },
  ): Promise<{ isPushed: boolean; isUpdated: boolean }>;
  /**
   * Create an IExecStorageModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecStorageModule;
}
