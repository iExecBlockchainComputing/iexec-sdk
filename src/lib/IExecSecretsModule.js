const IExecModule = require('./IExecModule');
const { checkRequesterSecretExists } = require('../common/sms/check');
const { pushRequesterSecret } = require('../common/sms/push');

class IExecSecretModule extends IExecModule {
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

module.exports = IExecSecretModule;
