const IExecModule = require('./IExecModule');
const secretMgtServ = require('../common/modules/sms');
const { getResultEncryptionKeyName } = require('../common/utils/secrets-utils');

class IExecResultModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.checkResultEncryptionKeyExists = async (address) =>
      secretMgtServ.checkWeb2SecretExists(
        await this.config.getContracts(),
        await this.config.getSmsURL(),
        address,
        getResultEncryptionKeyName(),
      );
    this.pushResultEncryptionKey = async (
      publicKey,
      { forceUpdate = false } = {},
    ) =>
      secretMgtServ.pushWeb2Secret(
        await this.config.getContracts(),
        await this.config.getSmsURL(),
        getResultEncryptionKeyName(),
        publicKey,
        { forceUpdate },
      );
  }
}

module.exports = IExecResultModule;
