import IExecConfig from './IExecConfig';
import IExecModule from './IExecModule';
import {
  Address,
  Addressish,
  BN,
  BNish,
  Bytes32,
  Multiaddress,
  TxHash,
  TeeFramework,
} from './types';

export interface DatasetDeploymentArgs {
  /**
   * the dataset owner
   */
  owner: Addressish;
  /**
   * a name for the dataset
   */
  name: string;
  /**
   * dataset file download address
   */
  multiaddr: Multiaddress;
  /**
   * sha256sum of the file
   */
  checksum: Bytes32;
}

/**
 * IExec dataset
 */
export interface Dataset {
  /**
   * the dataset owner
   */
  owner: Address;
  /**
   * a name for the dataset
   */
  datasetName: string;
  /**
   * dataset file download address
   */
  datasetMultiaddr: Multiaddress;
  /**
   * sha256sum of the file
   */
  datasetChecksum: Bytes32;
  /**
   * dataset registry address
   */
  registry: Address;
}

/**
 * module exposing dataset methods
 */
export default class IExecDatasetModule extends IExecModule {
  /**
   * **SIGNER REQUIRED**
   *
   * deploy a dataset contract on the blockchain
   *
   * example:
   * ```js
   * const { address } = await deployDataset({
   *  owner: address,
   *  name: 'cat.jpeg',
   *  multiaddr: '/ipfs/Qmd286K6pohQcTKYqnS1YhWrCiS4gz7Xi34sdwMe9USZ7u',
   *  checksum: '0x84a3f860d54f3f5f65e91df081c8d776e8bcfb5fbc234afce2f0d7e9d26e160d',
   * });
   * console.log('deployed at', address);
   * ```
   */
  deployDataset(
    dataset: DatasetDeploymentArgs,
  ): Promise<{ address: Address; txHash: TxHash }>;
  /**
   * predict the dataset contract address given the dataset deployment arguments
   *
   * example:
   * ```js
   * const address = await predictDatasetAddress({
   *  owner: address,
   *  name: 'cat.jpeg',
   *  multiaddr: '/ipfs/Qmd286K6pohQcTKYqnS1YhWrCiS4gz7Xi34sdwMe9USZ7u',
   *  checksum: '0x84a3f860d54f3f5f65e91df081c8d776e8bcfb5fbc234afce2f0d7e9d26e160d',
   * });
   * console.log('address', address);
   * ```
   */
  predictDatasetAddress(dataset: DatasetDeploymentArgs): Promise<Address>;
  /**
   * check if an dataset is deployed at a given address
   *
   * example:
   * ```js
   * const isDeployed = await checkDeployedDataset(address);
   * console.log('dataset deployed', isDeployed);
   * ```
   */
  checkDeployedDataset(datasetAddress: Addressish): Promise<Boolean>;
  /**
   * show a deployed dataset details
   *
   * example:
   * ```js
   * const { dataset } = await showDataset('0xb9b56f1c78f39504263835342e7affe96536d1ea');
   * console.log('dataset:', dataset);
   * ```
   */
  showDataset(
    datasetAddress: Addressish,
  ): Promise<{ objAddress: Address; dataset: Dataset }>;
  /**
   * count the datasets owned by an address.
   *
   * example:
   * ```js
   * const count = await countUserDatasets(userAddress);
   * console.log('dataset count:', count);
   * ```
   */
  countUserDatasets(userAddress: Addressish): Promise<BN>;
  /**
   * show deployed dataset details by index for specified user user
   *
   * example:
   * ```js
   * const { dataset } = await showUserDataset(0, userAddress);
   * console.log('dataset:', dataset);
   * ```
   */
  showUserDataset(
    index: BNish,
    address: Addressish,
  ): Promise<{ objAddress: Address; dataset: Dataset }>;
  /**
   * generate an encryption key to encrypt a dataset
   *
   * _NB_: this method returns a base64 encoded 256 bits key
   *
   * example:
   * ```js
   * const encryptionKey = generateEncryptionKey();
   * console.log('encryption key:', encryptionKey);
   * ```
   */
  generateEncryptionKey(): string;
  /**
   * encrypt the dataset file with the specified key using AES-256-CBC
   *
   * _NB_:
   * - the supplied key must be 256 bits base64 encoded
   * - DO NOT leak the key and DO NOT use the same key for encrypting different datasets
   *
   * example:
   * ```js
   * // somehow load the dataset file
   * const datasetFile = await readDatasetAsArrayBuffer();
   * // generate a key DO NOT leak this key
   * const encryptionKey = generateEncryptionKey();
   * // encrypt
   * const encryptedDataset = await encrypt(
   *  datasetFile,
   *  encryptionKey,
   * );
   * // the encrypted binary can be shared
   * const binary = new Blob([encryptedDataset]);
   * ```
   */
  encrypt(
    datasetFile: Buffer | ArrayBuffer | Uint8Array,
    encyptionKey: string,
  ): Promise<Buffer>;
  /**
   * compute the encrypted dataset file's checksum required for dataset deployment
   *
   * the dataset checksum is the encrypted file checksum, use this method on the encrypted file but DO NOT use it on the original dataset file
   *
   * _NB_:
   * - the dataset checksum is the sha256sum of the encrypted dataset file
   * - the checksum is used in the computation workflow to ensure the dataset's integrity
   *
   * example:
   * ```js
   * const encryptedDataset = await encrypt(
   *  datasetFile,
   *  encryptionKey,
   * );
   * const checksum = await computeEncryptedFileChecksum(
   *  encryptedDataset,
   * );
   * ```
   */
  computeEncryptedFileChecksum(
    encryptedFile: Buffer | ArrayBuffer | Uint8Array,
  ): Promise<string>;
  /**
   * check if a the dataset secret exists in the Secret Management Service
   *
   * example:
   * ```js
   * const isSecretSet = await checkDatasetSecretExists(datasetAddress);
   * console.log('secret exists:', isSecretSet);
   * ```
   */
  checkDatasetSecretExists(
    datasetAddress: Addressish,
    options?: {
      teeFramework?: TeeFramework;
    },
  ): Promise<boolean>;
  /**
   * **SIGNER REQUIRED, ONLY DATASET OWNER**
   *
   * push the dataset's encryption key to the Secret Management Service
   *
   * **WARNING**: pushed secrets CAN NOT be updated
   *
   * example:
   * ```js
   * const pushed = await pushDatasetSecret(datasetAddress, encryptionKey);
   * console.log('secret pushed:', pushed);
   * ```
   */
  pushDatasetSecret(
    datasetAddress: Addressish,
    encryptionKey: string,
    options?: {
      teeFramework?: TeeFramework;
    },
  ): Promise<boolean>;
  /**
   * Create an IExecDatasetModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecDatasetModule;
}
