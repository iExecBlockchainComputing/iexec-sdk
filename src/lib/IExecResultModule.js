const IExecModule = require('./IExecModule');
const { checkWeb2SecretExists } = require('../common/sms/check');
const { pushWeb2Secret } = require('../common/sms/push');
const { getResultEncryptionKeyName } = require('../common/utils/secrets-utils');

class IExecResultModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.checkResultEncryptionKeyExists = async (
      address,
      { teeFramework } = {},
    ) =>
      checkWeb2SecretExists(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL({ teeFramework }),
        address,
        getResultEncryptionKeyName(),
      );
    this.pushResultEncryptionKey = async (
      publicKey,
      { forceUpdate = false, teeFramework } = {},
    ) =>
      pushWeb2Secret(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL({ teeFramework }),
        getResultEncryptionKeyName(),
        publicKey,
        { forceUpdate },
      );
  }
}

module.exports = IExecResultModule;
