const IExecModule = require('./IExecModule');
const hub = require('../common/modules/hub');
const secretMgtServ = require('../common/modules/sms');
const {
  generateAes256Key,
  encryptAes256Cbc,
  sha256Sum,
} = require('../common/utils/encryption-utils');

class IExecDatasetModule extends IExecModule {
  constructor(...args) {
    super(...args);

    this.generateEncryptionKey = () => generateAes256Key();
    this.encrypt = (datasetFile, encryptionKey) =>
      encryptAes256Cbc(datasetFile, encryptionKey);
    this.computeEncryptedFileChecksum = (encryptedFile) =>
      sha256Sum(encryptedFile);
    this.deployDataset = async (dataset) =>
      hub.deployDataset(await this.config.resolveContractsClient(), dataset);
    this.showDataset = async (address) =>
      hub.showDataset(await this.config.resolveContractsClient(), address);
    this.showUserDataset = async (index, userAddress) =>
      hub.showUserDataset(
        await this.config.resolveContractsClient(),
        index,
        userAddress,
      );
    this.countUserDatasets = async (address) =>
      hub.countUserDatasets(
        await this.config.resolveContractsClient(),
        address,
      );
    this.checkDatasetSecretExists = async (datasetAddress) =>
      secretMgtServ.checkWeb3SecretExists(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL(),
        datasetAddress,
      );
    this.pushDatasetSecret = async (datasetAddress, datasetSecret) =>
      secretMgtServ.pushWeb3Secret(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL(),
        datasetAddress,
        datasetSecret,
      );
  }
}

module.exports = IExecDatasetModule;
