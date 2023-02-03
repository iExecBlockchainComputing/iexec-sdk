import IExecModule from './IExecModule';
import { checkRequesterSecretExists } from '../common/sms/check';
import { pushRequesterSecret } from '../common/sms/push';

export default class IExecSecretModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.checkRequesterSecretExists = async (
      address,
      secretName,
      { teeFramework } = {},
    ) =>
      checkRequesterSecretExists(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL({ teeFramework }),
        address,
        secretName,
      );
    this.pushRequesterSecret = async (
      secretName,
      secretValue,
      { teeFramework } = {},
    ) =>
      pushRequesterSecret(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL({ teeFramework }),
        secretName,
        secretValue,
      );
  }
}
