const IExecModule = require('./IExecModule');
const hub = require('../common/modules/hub');

class IExecAppModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.deployApp = async (app) =>
      hub.deployApp(await this.config.getContracts(), app);
    this.showApp = async (address) =>
      hub.showApp(await this.config.getContracts(), address);
    this.showUserApp = async (index, userAddress) =>
      hub.showUserApp(await this.config.getContracts(), index, userAddress);
    this.countUserApps = async (address) =>
      hub.countUserApps(await this.config.getContracts(), address);
  }
}

module.exports = IExecAppModule;
