const IExecModule = require('./IExecModule');
const hub = require('../common/modules/hub');
const {
  setWorkerpoolApiUrl,
  getWorkerpoolApiUrl,
} = require('../common/modules/workerpool');

class IExecWorkerpoolModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.deployWorkerpool = async (workerpool) =>
      hub.deployWorkerpool(
        await this.config.resolveContractsClient(),
        workerpool,
      );
    this.showWorkerpool = async (address) =>
      hub.showWorkerpool(await this.config.resolveContractsClient(), address);
    this.showUserWorkerpool = async (index, userAddress) =>
      hub.showUserWorkerpool(
        await this.config.resolveContractsClient(),
        index,
        userAddress,
      );
    this.countUserWorkerpools = async (address) =>
      hub.countUserWorkerpools(
        await this.config.resolveContractsClient(),
        address,
      );
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
