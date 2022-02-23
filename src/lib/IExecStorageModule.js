const IExecModule = require('./IExecModule');
const secretMgtServ = require('../common/modules/sms');
const resultProxyServ = require('../common/modules/result-proxy');
const { getStorageTokenKeyName } = require('../common/utils/secrets-utils');

class IExecStorageModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.defaultStorageLogin = async () =>
      resultProxyServ.login(
        await this.config.getContracts(),
        await this.config.getResultProxyURL(),
      );
    this.checkStorageTokenExists = async (address, { provider } = {}) =>
      secretMgtServ.checkWeb2SecretExists(
        await this.config.getContracts(),
        await this.config.getSmsURL(),
        address,
        getStorageTokenKeyName(provider),
      );
    this.pushStorageToken = async (
      token,
      { provider, forceUpdate = false } = {},
    ) =>
      secretMgtServ.pushWeb2Secret(
        await this.config.getContracts(),
        await this.config.getSmsURL(),
        getStorageTokenKeyName(provider),
        token,
        { forceUpdate },
      );
  }
}

module.exports = IExecStorageModule;
