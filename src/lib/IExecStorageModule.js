import IExecModule from './IExecModule';
import { checkWeb2SecretExists } from '../common/sms/check';
import { pushWeb2Secret } from '../common/sms/push';
import { login as resultProxyLogin } from '../common/storage/result-proxy';
import { getStorageTokenKeyName } from '../common/utils/secrets-utils';

export default class IExecStorageModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.defaultStorageLogin = async () =>
      resultProxyLogin(
        await this.config.resolveContractsClient(),
        await this.config.resolveResultProxyURL(),
      );
    this.checkStorageTokenExists = async (
      address,
      { provider, teeFramework } = {},
    ) =>
      checkWeb2SecretExists(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL({ teeFramework }),
        address,
        getStorageTokenKeyName(provider),
      );

    this.pushStorageToken = async (
      token,
      { provider, teeFramework, forceUpdate = false } = {},
    ) =>
      pushWeb2Secret(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL({ teeFramework }),
        getStorageTokenKeyName(provider),
        token,
        { forceUpdate },
      );
  }
}
