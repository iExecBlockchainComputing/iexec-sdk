import IExecModule from './IExecModule';
import {
  deployDataset,
  showDataset,
  showUserDataset,
  countUserDatasets,
  predictDatasetAddress,
  checkDeployedDataset,
} from '../common/protocol/registries';
import { checkWeb3SecretExists } from '../common/sms/check';
import { pushWeb3Secret } from '../common/sms/push';
import {
  generateAes256Key,
  encryptAes256Cbc,
  sha256Sum,
} from '../common/utils/encryption-utils';

export default class IExecDatasetModule extends IExecModule {
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
    this.checkDatasetSecretExists = async (
      datasetAddress,
      { teeFramework } = {},
    ) =>
      checkWeb3SecretExists(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL({ teeFramework }),
        datasetAddress,
      );
    this.pushDatasetSecret = async (
      datasetAddress,
      datasetSecret,
      { teeFramework } = {},
    ) =>
      pushWeb3Secret(
        await this.config.resolveContractsClient(),
        await this.config.resolveSmsURL({ teeFramework }),
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
