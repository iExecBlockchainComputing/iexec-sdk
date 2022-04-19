const IExecModule = require('./IExecModule');
const {
  createCategory,
  showCategory,
  countCategory,
} = require('../common/hub/category');
const { getTimeoutRatio } = require('../common/hub/protocol');

class IExecHubModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.createCategory = async (category) =>
      createCategory(await this.config.resolveContractsClient(), category);
    this.showCategory = async (index) =>
      showCategory(await this.config.resolveContractsClient(), index);
    this.countCategory = async () =>
      countCategory(await this.config.resolveContractsClient());
    this.getTimeoutRatio = async () =>
      getTimeoutRatio(await this.config.resolveContractsClient());
  }
}

module.exports = IExecHubModule;
