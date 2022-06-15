import IExecConfig from './IExecConfig';
import IExecModule from './IExecModule';
import { Addressish } from './types';

/**
 * module exposing secrets methods
 */
export default class IExecSecretsModule extends IExecModule {
  /**
   * check if a named secret exists for the requester in the Secret Management Service
   *
   * example:
   * ```js
   * const isSecretSet = await checkRequesterSecretExists(requesterAddress, "my-password");
   * console.log('secret "my-password" set:', isSecretSet);
   * ```
   */
  checkRequesterSecretExists(
    requesterAddress: Addressish,
    secretName: String,
  ): Promise<boolean>;
  /**
   * **SIGNER REQUIRED, ONLY REQUESTER**
   *
   * push a named secret to the Secret Management Service
   *
   * _NB_:
   * - pushed secrets can be used in `tee` tasks by specifying `iexec_secrets` in the requestorder params.
   * - once pushed a secret can not be updated
   *
   * example:
   * ```js
   * const { isPushed } = await pushRequesterSecret("my-password", "passw0rd");
   * console.log('pushed secret "my-password":', isPushed);
   * ```
   */
  pushRequesterSecret(
    secretName: String,
    secretValue: String,
  ): Promise<{ isPushed: boolean }>;
  /**
   * Create an IExecSecretsModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecSecretsModule;
}
