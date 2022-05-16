const IExecModule = require('./IExecModule');
const {
  deployApp,
  showApp,
  showUserApp,
  countUserApps,
} = require('../common/protocol/registries');
const { checkAppSecretExists } = require('../common/sms/check');
const { pushAppSecret } = require('../common/sms/push');

class IExecAppModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.deployApp = async (app) =>
      deployApp(await this.config.resolveContractsClient(), app);
    this.showApp = async (address) =>
      showApp(await this.config.resolveContractsClient(), address);
    this.showUserApp = async (index, userAddress) =>
      showUserApp(
        await this.config.resolveContractsClient(),
        index,
        userAddress,
      );
    this.countUserApps = async (address) =>
      countUserApps(await this.config.resolveContractsClient(), address);
    this.checkAppSecretExists = async (appAddress) =>
      checkAppSecretExists(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL(),
        appAddress,
      );
    this.pushAppSecret = async (appAddress, appSecret) =>
      pushAppSecret(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL(),
        appAddress,
        appSecret,
      );
  }
}

module.exports = IExecAppModule;
