const IExecModule = require('./IExecModule');
const hub = require('../common/modules/hub');

class IExecWorkerpoolModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.deployWorkerpool = async (workerpool) =>
      hub.deployWorkerpool(await this.config.getContracts(), workerpool);
    this.showWorkerpool = async (address) =>
      hub.showWorkerpool(await this.config.getContracts(), address);
    this.showUserWorkerpool = async (index, userAddress) =>
      hub.showUserWorkerpool(
        await this.config.getContracts(),
        index,
        userAddress,
      );
    this.countUserWorkerpools = async (address) =>
      hub.countUserWorkerpools(await this.config.getContracts(), address);
  }
}

module.exports = IExecWorkerpoolModule;
