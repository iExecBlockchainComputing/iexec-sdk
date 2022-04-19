const IExecModule = require('./IExecModule');
const {
  getOwner,
  resolveName,
  lookupAddress,
} = require('../common/ens/resolution');
const {
  registerFifsEns,
  obsConfigureResolution,
  configureResolution,
} = require('../common/ens/registration');
const { setTextRecord, readTextRecord } = require('../common/ens/text-record');

class IExecENSModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.getOwner = async (name) =>
      getOwner(await this.config.resolveContractsClient(), name);
    this.resolveName = async (name) =>
      resolveName(await this.config.resolveContractsClient(), name);
    this.lookupAddress = async (address) =>
      lookupAddress(await this.config.resolveContractsClient(), address);
    this.claimName = async (label, domain) =>
      registerFifsEns(
        await this.config.resolveContractsClient(),
        label,
        domain,
      );
    this.obsConfigureResolution = async (name, address) =>
      obsConfigureResolution(
        await this.config.resolveContractsClient(),
        await this.config.resolveEnsPublicResolverAddress(),
        name,
        address,
      );
    this.configureResolution = async (name, address) =>
      configureResolution(
        await this.config.resolveContractsClient(),
        await this.config.resolveEnsPublicResolverAddress(),
        name,
        address,
      );
    this.setTextRecord = async (name, key, value) =>
      setTextRecord(
        await this.config.resolveContractsClient(),
        name,
        key,
        value,
      );
    this.readTextRecord = async (name, key) =>
      readTextRecord(await this.config.resolveContractsClient(), name, key);
  }
}

module.exports = IExecENSModule;
