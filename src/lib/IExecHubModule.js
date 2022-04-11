const IExecModule = require('./IExecModule');
const hub = require('../common/modules/hub');

class IExecHubModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.createCategory = async (category) =>
      hub.createCategory(await this.config.resolveContractsClient(), category);
    this.showCategory = async (index) =>
      hub.showCategory(await this.config.resolveContractsClient(), index);
    this.countCategory = async () =>
      hub.countCategory(await this.config.resolveContractsClient());
    this.getTimeoutRatio = async () =>
      hub.getTimeoutRatio(await this.config.resolveContractsClient());
  }
}

module.exports = IExecHubModule;
