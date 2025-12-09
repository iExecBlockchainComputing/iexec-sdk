import IExecModule from './IExecModule.js';
import { checkWeb2SecretExists } from '../common/sms/check.js';
import { pushWeb2Secret } from '../common/sms/push.js';
import { login as resultProxyLogin } from '../common/storage/result-proxy.js';
import { getStorageTokenKeyName } from '../common/utils/secrets-utils.js';

export default class IExecStorageModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.defaultStorageLogin = async () =>
      resultProxyLogin(
        await this.config.resolveContractsClient(),
        await this.config.resolveResultProxyURL(),
      );
    this.checkStorageTokenExists = async (address, { provider } = {}) =>
      checkWeb2SecretExists(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL(),
        address,
        getStorageTokenKeyName(provider),
      );

    this.pushStorageToken = async (
      token,
      { provider, forceUpdate = false } = {},
    ) =>
      pushWeb2Secret(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL(),
        getStorageTokenKeyName(provider),
        token,
        { forceUpdate },
      );
  }
}
