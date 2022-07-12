const IExecModule = require('./IExecModule');
const { checkWeb2SecretExists } = require('../common/sms/check');
const { pushWeb2Secret } = require('../common/sms/push');
const { getResultEncryptionKeyName } = require('../common/utils/secrets-utils');

class IExecResultModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.checkResultEncryptionKeyExists = async (address) =>
      checkWeb2SecretExists(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL(),
        address,
        getResultEncryptionKeyName(),
      );
    this.pushResultEncryptionKey = async (
      publicKey,
      { forceUpdate = false } = {},
    ) =>
      pushWeb2Secret(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL(),
        getResultEncryptionKeyName(),
        publicKey,
        { forceUpdate },
      );
  }
}

module.exports = IExecResultModule;
