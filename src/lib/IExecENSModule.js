import IExecModule from './IExecModule';
import { getOwner, resolveName, lookupAddress } from '../common/ens/resolution';
import {
  registerFifsEns,
  obsConfigureResolution,
  configureResolution,
  getDefaultDomain,
} from '../common/ens/registration';
import { setTextRecord, readTextRecord } from '../common/ens/text-record';

export default class IExecENSModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.getOwner = async (name) =>
      getOwner(await this.config.resolveContractsClient(), name);
    this.resolveName = async (name) =>
      resolveName(await this.config.resolveContractsClient(), name);
    this.lookupAddress = async (address) =>
      lookupAddress(await this.config.resolveContractsClient(), address);
    this.getDefaultDomain = async (address) =>
      getDefaultDomain(await this.config.resolveContractsClient(), address);
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
