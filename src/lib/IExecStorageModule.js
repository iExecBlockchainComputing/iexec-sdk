const IExecModule = require('./IExecModule');
const secretMgtServ = require('../common/modules/sms');
const resultProxyServ = require('../common/modules/result-proxy');
const { getStorageTokenKeyName } = require('../common/utils/secrets-utils');

class IExecStorageModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.defaultStorageLogin = async () =>
      resultProxyServ.login(
        await this.config.resolveContractsClient(),
        await this.config.resolveResultProxyURL(),
      );
    this.checkStorageTokenExists = async (address, { provider } = {}) =>
      secretMgtServ.checkWeb2SecretExists(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL(),
        address,
        getStorageTokenKeyName(provider),
      );
    this.pushStorageToken = async (
      token,
      { provider, forceUpdate = false } = {},
    ) =>
      secretMgtServ.pushWeb2Secret(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL(),
        getStorageTokenKeyName(provider),
        token,
        { forceUpdate },
      );
  }
}

module.exports = IExecStorageModule;
