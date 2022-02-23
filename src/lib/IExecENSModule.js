const IExecModule = require('./IExecModule');
const ens = require('../common/modules/ens');

class IExecENSModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.getOwner = async (name) =>
      ens.getOwner(await this.config.getContracts(), name);
    this.resolveName = async (name) =>
      ens.resolveName(await this.config.getContracts(), name);
    this.lookupAddress = async (address) =>
      ens.lookupAddress(await this.config.getContracts(), address);
    this.claimName = async (label, domain) =>
      ens.registerFifsEns(await this.config.getContracts(), label, domain);
    this.obsConfigureResolution = async (name, address) =>
      ens.obsConfigureResolution(
        await this.config.getContracts(),
        await this.config.getEnsPublicResolverAddress(),
        name,
        address,
      );
    this.configureResolution = async (name, address) =>
      ens.configureResolution(
        await this.config.getContracts(),
        await this.config.getEnsPublicResolverAddress(),
        name,
        address,
      );
  }
}

module.exports = IExecENSModule;
