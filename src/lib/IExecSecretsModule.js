import IExecModule from './IExecModule.js';
import { checkRequesterSecretExists } from '../common/sms/check.js';
import { pushRequesterSecret } from '../common/sms/push.js';

export default class IExecSecretModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.checkRequesterSecretExists = async (address, secretName) =>
      checkRequesterSecretExists(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL(),
        address,
        secretName,
      );
    this.pushRequesterSecret = async (secretName, secretValue) =>
      pushRequesterSecret(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL(),
        secretName,
        secretValue,
      );
  }
}
