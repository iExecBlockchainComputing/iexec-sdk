export type * from '../common/types.js';
export type * from './IExecConfig.js';

import IExecConfig from './IExecConfig.js';
import IExecModule from './IExecModule.js';
import { Address } from '../common/types.js';

/**
 * module exposing storage methods
 */
export default class IExecStorageModule extends IExecModule {
  /**
   * check if a storage access token exists for the beneficiary in the Secret Management Service
   *
   * _NB_: currently only 'dropbox' storage provider authentication is supported.
   *
   * example:
   * ```js
   * const isStorageInitialized = await checkStorageTokenExists(userAddress, 'dropbox');
   * console.log('Dropbox storage initialized:', isStorageInitialized);
   * ```
   */
  checkStorageTokenExists(
    beneficiaryAddress: Address,
    storageProvider: string,
  ): Promise<boolean>;
  /**
   * **SIGNER REQUIRED, ONLY BENEFICIARY**
   *
   * push a storage access token to the Secret Management Service to allow result archive upload
   * supported storage provider 'dropbox'.
   *
   * _NB_:
   * - currently only 'dropbox' storage provider authentication is supported.
   * - this method will throw an error if a token already exists for the target storage provider in the Secret Management Service unless the option `forceUpdate: true` is used.
   *
   * example:
   * - init Dropbox storage
   * ```js
   * const { isPushed } = await pushStorageToken(dropboxApiToken, 'dropbox');
   * console.log('Dropbox storage initialized:', isPushed);
   * ```
   */
  pushStorageToken(
    token: string,
    storageProvider: string,
    options?: {
      forceUpdate?: boolean;
    },
  ): Promise<{ isPushed: boolean; isUpdated: boolean }>;
  /**
   * Create an IExecStorageModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecStorageModule;
}
