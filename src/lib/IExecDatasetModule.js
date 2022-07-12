const IExecModule = require('./IExecModule');
const {
  deployDataset,
  showDataset,
  showUserDataset,
  countUserDatasets,
  predictDatasetAddress,
  checkDeployedDataset,
} = require('../common/protocol/registries');
const { checkWeb3SecretExists } = require('../common/sms/check');
const { pushWeb3Secret } = require('../common/sms/push');
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
      deployDataset(await this.config.resolveContractsClient(), dataset);
    this.showDataset = async (address) =>
      showDataset(await this.config.resolveContractsClient(), address);
    this.showUserDataset = async (index, userAddress) =>
      showUserDataset(
        await this.config.resolveContractsClient(),
        index,
        userAddress,
      );
    this.countUserDatasets = async (address) =>
      countUserDatasets(await this.config.resolveContractsClient(), address);
    this.checkDatasetSecretExists = async (datasetAddress) =>
      checkWeb3SecretExists(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL(),
        datasetAddress,
      );
    this.pushDatasetSecret = async (datasetAddress, datasetSecret) =>
      pushWeb3Secret(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL(),
        datasetAddress,
        datasetSecret,
      );
    this.predictDatasetAddress = async (dataset) =>
      predictDatasetAddress(
        await this.config.resolveContractsClient(),
        dataset,
      );
    this.checkDeployedDataset = async (address) =>
      checkDeployedDataset(await this.config.resolveContractsClient(), address);
  }
}

module.exports = IExecDatasetModule;
