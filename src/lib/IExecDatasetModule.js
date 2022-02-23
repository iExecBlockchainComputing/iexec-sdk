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
      hub.deployDataset(await this.config.getContracts(), dataset);
    this.showDataset = async (address) =>
      hub.showDataset(await this.config.getContracts(), address);
    this.showUserDataset = async (index, userAddress) =>
      hub.showUserDataset(await this.config.getContracts(), index, userAddress);
    this.countUserDatasets = async (address) =>
      hub.countUserDatasets(await this.config.getContracts(), address);
    this.checkDatasetSecretExists = async (datasetAddress) =>
      secretMgtServ.checkWeb3SecretExists(
        await this.config.getContracts(),
        await this.config.getSmsURL(),
        datasetAddress,
      );
    this.pushDatasetSecret = async (datasetAddress, datasetSecret) =>
      secretMgtServ.pushWeb3Secret(
        await this.config.getContracts(),
        await this.config.getSmsURL(),
        datasetAddress,
        datasetSecret,
      );
  }
}

module.exports = IExecDatasetModule;
