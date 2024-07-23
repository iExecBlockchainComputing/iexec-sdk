import IExecModule from './IExecModule.js';
import {
  deployApp,
  showApp,
  showUserApp,
  countUserApps,
  predictAppAddress,
  checkDeployedApp,
  resolveTeeFrameworkFromApp,
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
        userAddress
      );
    this.countUserApps = async (address) =>
      countUserApps(await this.config.resolveContractsClient(), address);
    this.checkAppSecretExists = async (appAddress, { teeFramework } = {}) => {
      let appTeeFramework = teeFramework;
      if (appTeeFramework === undefined) {
        const { app } = await showApp(
          await this.config.resolveContractsClient(),
          appAddress
        );
        appTeeFramework = await resolveTeeFrameworkFromApp(app);
      }
      return checkAppSecretExists(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL({ teeFramework: appTeeFramework }),
        appAddress
      );
    };
    this.pushAppSecret = async (
      appAddress,
      appSecret,
      { teeFramework } = {}
    ) => {
      let appTeeFramework = teeFramework;
      if (appTeeFramework === undefined) {
        const { app } = await showApp(
          await this.config.resolveContractsClient(),
          appAddress
        );
        appTeeFramework = await resolveTeeFrameworkFromApp(app);
      }
      return pushAppSecret(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL({ teeFramework: appTeeFramework }),
        appAddress,
        appSecret
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
