const IExecModule = require('./IExecModule');
const { checkWeb2SecretExists } = require('../common/sms/check');
const { pushWeb2Secret } = require('../common/sms/push');
const { login: resultProxyLogin } = require('../common/storage/result-proxy');
const { getStorageTokenKeyName } = require('../common/utils/secrets-utils');

class IExecStorageModule extends IExecModule {
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

module.exports = IExecStorageModule;
