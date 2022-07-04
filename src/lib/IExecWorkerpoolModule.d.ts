import IExecConfig from './IExecConfig';
import IExecModule from './IExecModule';
import { Address, Addressish, BN, BNish, TxHash } from './types';

export interface WorkerpoolDeploymentArgs {
  /**
   * the workerpool owner
   */
  owner: Addressish;
  /**
   * a description for the workerpool
   */
  description: string;
}

/**
 * IExec workerpool
 */
export interface Workerpool {
  /**
   * the workerpool owner
   */
  owner: Address;
  /**
   * a description of the workerpool
   */
  description: string;
}

/**
 * module exposing workerpool methods
 */
export default class IExecWorkerpoolModule extends IExecModule {
  /**
   * **SIGNER REQUIRED**
   *
   * deploy a workerpool contract on the blockchain
   *
   * example:
   * ```js
   * const { address } = await deployWorkerpool({
   *  owner: address,
   *  description: 'My workerpool',
   * });
   * console.log('deployed at', address);
   * ```
   */
  deployWorkerpool(
    workerpool: WorkerpoolDeploymentArgs,
  ): Promise<{ address: Address; txHash: TxHash }>;
  /**
   * predict the workerpool contract address given the workerpool deployment arguments
   *
   * example:
   * ```js
   * const address = await predictWorkerpoolAddress({
   *  owner: address,
   *  description: 'My workerpool',
   * });
   * console.log('address', address);
   * ```
   */
  predictWorkerpoolAddress(
    workerpool: WorkerpoolDeploymentArgs,
  ): Promise<Address>;
  /**
   * check if an workerpool is deployed at a given address
   *
   * example:
   * ```js
   * const isDeployed = await checkDeployedWorkerpool(address);
   * console.log('workerpool deployed', isDeployed);
   * ```
   */
  checkDeployedWorkerpool(workerpoolAddress: Addressish): Promise<Boolean>;
  /**
   * show a deployed workerpool details
   *
   * example:
   * ```js
   * const { workerpool } = await showWorkerpool('0x86F2102532d9d01DA8084c96c1D1Bdb90e12Bf07');
   * console.log('workerpool:', workerpool);
   * ```
   */
  showWorkerpool(
    workerpoolAddress: Addressish,
  ): Promise<{ objAddress: Address; workerpool: Workerpool }>;
  /**
   * count the workerpools owned by an address.
   *
   * example:
   * ```js
   * const count = await countUserWorkerpools(userAddress);
   * console.log('workerpool count:', count);
   * ```
   */
  countUserWorkerpools(userAddress: Addressish): Promise<BN>;
  /**
   * show deployed workerpool details by index for specified user user
   *
   * example:
   * ```js
   * const { workerpool } = await showUserWorkerpool(0, userAddress);
   * console.log('workerpool:', workerpool);
   * ```
   */
  showUserWorkerpool(
    index: BNish,
    address: Addressish,
  ): Promise<{ objAddress: Address; workerpool: Workerpool }>;
  /**
   * **ONLY WORKERPOOL ENS NAME OWNER**
   *
   * declare the workerpool API url on the blockchain
   *
   * _NB_: declaring the workerpool API url require an ENS name with a configured reverse resolution on the workerpool address (see: IExecENSModule obsConfigureResolution/configureResolution)
   *
   * example:
   * ```js
   * const txHash = await setWorkerpoolApiUrl('my-workerpool.eth', 'my-workerpool.com');
   * console.log('txHash:', txHash);
   * ```
   */
  setWorkerpoolApiUrl(
    workerpoolAddress: Addressish,
    url: string,
  ): Promise<TxHash>;
  /**
   * read the workerpool API url on the blockchain
   *
   * _NB_: resolve to `undefined` if the workerpool API url was not declared.
   *
   * example:
   * ```js
   * const url = await getWorkerpoolApiUrl('my-workerpool.eth', 'my-workerpool.com');
   * console.log('workerpool API url:', url);
   * ```
   */
  getWorkerpoolApiUrl(
    workerpoolAddress: Addressish,
    url: string,
  ): Promise<string | undefined>;
  /**
   * Create an IExecWorkerpoolModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecWorkerpoolModule;
}
