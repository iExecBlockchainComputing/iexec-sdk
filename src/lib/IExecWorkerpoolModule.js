const IExecModule = require('./IExecModule');
const {
  deployWorkerpool,
  showWorkerpool,
  showUserWorkerpool,
  countUserWorkerpools,
} = require('../common/protocol/registries');
const {
  setWorkerpoolApiUrl,
  getWorkerpoolApiUrl,
} = require('../common/execution/workerpool');

class IExecWorkerpoolModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.deployWorkerpool = async (workerpool) =>
      deployWorkerpool(await this.config.resolveContractsClient(), workerpool);
    this.showWorkerpool = async (address) =>
      showWorkerpool(await this.config.resolveContractsClient(), address);
    this.showUserWorkerpool = async (index, userAddress) =>
      showUserWorkerpool(
        await this.config.resolveContractsClient(),
        index,
        userAddress,
      );
    this.countUserWorkerpools = async (address) =>
      countUserWorkerpools(await this.config.resolveContractsClient(), address);
    this.setWorkerpoolApiUrl = async (workerpoolAddress, url) =>
      setWorkerpoolApiUrl(
        await this.config.resolveContractsClient(),
        workerpoolAddress,
        url,
      );
    this.getWorkerpoolApiUrl = async (workerpoolAddress) =>
      getWorkerpoolApiUrl(
        await this.config.resolveContractsClient(),
        workerpoolAddress,
      );
  }
}

module.exports = IExecWorkerpoolModule;
