const IExecModule = require('./IExecModule');
const { checkRequesterSecretExists } = require('../common/sms/check');
const { pushRequesterSecret } = require('../common/sms/push');

class IExecSecretModule extends IExecModule {
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

module.exports = IExecSecretModule;
