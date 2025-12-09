import IExecModule from './IExecModule.js';
import {
  deployApp,
  showApp,
  showUserApp,
  countUserApps,
  predictAppAddress,
  checkDeployedApp,
  transferApp,
} from '../common/protocol/registries.js';
import { checkAppSecretExists } from '../common/sms/check.js';
import { pushAppSecret } from '../common/sms/push.js';

export default class IExecAppModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.deployApp = async (app) =>
      deployApp(await this.config.resolveContractsClient(), app);
    this.showApp = async (address) =>
      showApp(await this.config.resolveContractsClient(), address);
    this.showUserApp = async (index, userAddress) =>
      showUserApp(
        await this.config.resolveContractsClient(),
        index,
        userAddress,
      );
    this.countUserApps = async (address) =>
      countUserApps(await this.config.resolveContractsClient(), address);
    this.checkAppSecretExists = async (appAddress) => {
      return checkAppSecretExists(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL(),
        appAddress,
      );
    };
    this.pushAppSecret = async (appAddress, appSecret) => {
      return pushAppSecret(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL(),
        appAddress,
        appSecret,
      );
    };
    this.predictAppAddress = async (app) =>
      predictAppAddress(await this.config.resolveContractsClient(), app);
    this.checkDeployedApp = async (address) =>
      checkDeployedApp(await this.config.resolveContractsClient(), address);
    this.transferApp = async (address, to) =>
      transferApp(await this.config.resolveContractsClient(), address, to);
  }
}
