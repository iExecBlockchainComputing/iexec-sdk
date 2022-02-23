const IExecModule = require('./IExecModule');
const hub = require('../common/modules/hub');

class IExecHubModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.createCategory = async (category) =>
      hub.createCategory(await this.config.getContracts(), category);
    this.showCategory = async (index) =>
      hub.showCategory(await this.config.getContracts(), index);
    this.countCategory = async () =>
      hub.countCategory(await this.config.getContracts());
    this.getTimeoutRatio = async () =>
      hub.getTimeoutRatio(await this.config.getContracts());
  }
}

module.exports = IExecHubModule;
