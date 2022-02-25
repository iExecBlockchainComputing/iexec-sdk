const IExecModule = require('./IExecModule');
const ens = require('../common/modules/ens');

class IExecENSModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.getOwner = async (name) =>
      ens.getOwner(await this.config.resolveContractsClient(), name);
    this.resolveName = async (name) =>
      ens.resolveName(await this.config.resolveContractsClient(), name);
    this.lookupAddress = async (address) =>
      ens.lookupAddress(await this.config.resolveContractsClient(), address);
    this.claimName = async (label, domain) =>
      ens.registerFifsEns(
        await this.config.resolveContractsClient(),
        label,
        domain,
      );
    this.obsConfigureResolution = async (name, address) =>
      ens.obsConfigureResolution(
        await this.config.resolveContractsClient(),
        await this.config.resolveEnsPublicResolverAddress(),
        name,
        address,
      );
    this.configureResolution = async (name, address) =>
      ens.configureResolution(
        await this.config.resolveContractsClient(),
        await this.config.resolveEnsPublicResolverAddress(),
        name,
        address,
      );
  }
}

module.exports = IExecENSModule;
