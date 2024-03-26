export * from '../common/types.js';

import IExecConfig from './IExecConfig.js';
import IExecModule from './IExecModule.js';
import {
  Address,
  Addressish,
  BNish,
  Bytes,
  Bytes32,
  OrderHash,
  HumanSingleTag,
  NRLCAmount,
  Tag,
  Dealid,
  BN,
  TxHash,
} from '../common/types.js';

/**
 * sell order for an app
 */
export interface ApporderTemplate {
  app: Address;
  appprice: string;
  volume: string;
  tag: Bytes32;
  datasetrestrict: Address;
  workerpoolrestrict: Address;
  requesterrestrict: Address;
}

/**
 * sell order for an app
 */
export interface SignableApporder {
  app: Address;
  appprice: BNish;
  volume: BNish;
  tag: Tag;
  datasetrestrict: Address;
  workerpoolrestrict: Address;
  requesterrestrict: Address;
}

/**
 * sell order for an app
 */
export interface HashableApporder extends SignableApporder {
  salt: Bytes32;
}

/**
 * signed sell order for an app
 */
export interface SignedApporder {
  app: Address;
  appprice: string;
  volume: string;
  tag: Bytes32;
  datasetrestrict: Address;
  workerpoolrestrict: Address;
  requesterrestrict: Address;
  salt: Bytes32;
  sign: Bytes;
}

/**
 * signed sell order for an app
 */
export interface ConsumableApporder {
  app: Address;
  appprice: BNish;
  volume: BNish;
  tag: Tag;
  datasetrestrict: Address;
  workerpoolrestrict: Address;
  requesterrestrict: Address;
  salt: Bytes32;
  sign: Bytes;
}

/**
 * sell order for a dataset
 */
export interface DatasetorderTemplate {
  dataset: Address;
  datasetprice: string;
  volume: string;
  tag: Tag;
  apprestrict: Address;
  workerpoolrestrict: Address;
  requesterrestrict: Address;
}

/**
 * sell order for a dataset
 */
export interface SignableDatasetorder {
  dataset: Address;
  datasetprice: BNish;
  volume: BNish;
  tag: Tag;
  apprestrict: Address;
  workerpoolrestrict: Address;
  requesterrestrict: Address;
}

/**
 * sell order for a dataset
 */
export interface HashableDatasetorder extends SignableDatasetorder {
  salt: Bytes32;
}

/**
 * signed sell order for a dataset
 */
export interface SignedDatasetorder {
  dataset: Address;
  datasetprice: string;
  volume: string;
  tag: Bytes32;
  apprestrict: Address;
  workerpoolrestrict: Address;
  requesterrestrict: Address;
  salt: Bytes32;
  sign: Bytes;
}

/**
 * signed sell order for a dataset
 */
export interface ConsumableDatasetorder {
  dataset: Address;
  datasetprice: BNish;
  volume: BNish;
  tag: Tag;
  apprestrict: Address;
  workerpoolrestrict: Address;
  requesterrestrict: Address;
  salt: Bytes32;
  sign: Bytes;
}

/**
 * sell order for computing power
 */
export interface WorkerpoolorderTemplate {
  workerpool: Address;
  workerpoolprice: string;
  volume: string;
  tag: Bytes32;
  category: string;
  trust: string;
  apprestrict: Address;
  datasetrestrict: Address;
  requesterrestrict: Address;
}

/**
 * sell order for computing power
 */
export interface SignableWorkerpoolorder {
  workerpool: Address;
  workerpoolprice: BNish;
  volume: BNish;
  tag: Tag;
  category: BNish;
  trust: BNish;
  apprestrict: Address;
  datasetrestrict: Address;
  requesterrestrict: Address;
}

/**
 * sell order for computing power
 */
export interface HashableWorkerpoolorder extends SignableWorkerpoolorder {
  salt: Bytes32;
}

/**
 * signed sell order for computing power
 */
export interface SignedWorkerpoolorder {
  workerpool: Address;
  workerpoolprice: string;
  volume: string;
  tag: Bytes32;
  category: string;
  trust: string;
  apprestrict: Address;
  datasetrestrict: Address;
  requesterrestrict: Address;
  salt: Bytes32;
  sign: Bytes;
}

/**
 * signed sell order for computing power
 */
export interface ConsumableWorkerpoolorder {
  workerpool: Address;
  workerpoolprice: BNish;
  volume: BNish;
  tag: Tag;
  category: BNish;
  trust: BNish;
  apprestrict: Address;
  datasetrestrict: Address;
  requesterrestrict: Address;
  salt: Bytes32;
  sign: Bytes;
}

export interface RequestorderParams {
  /**
   * arguments to pass to the app
   */
  iexec_args?: string;
  /**
   * input files for the app (direct download url)
   */
  iexec_input_files?: string[];
  /**
   * requester secrets to pass to the app
   *
   * ```js
   * const secret = {
   *   1: 'login', // maps requester named secret "login" to app secret 1
   *   2: 'password' // maps requester named secret "password" to app secret 2
   * };
   * ```
   *
   * _NB_: `iexec_secrets` are only available for TEE tasks, use with `tag: ["tee"]`
   */
  iexec_secrets?: Record<number, string>;
  /**
   * encrypt results
   *
   * default `false`
   *
   * _NB_: `iexec_result_encryption: true` is only available for TEE tasks, use with `tag: ["tee"]`
   */
  iexec_result_encryption?: boolean;
  /**
   * selected storage provider
   *
   * supported: `'ipfs'`|`'dropbox'`
   *
   * default `'ipfs'`
   */
  iexec_result_storage_provider?: string;
  /**
   * result proxy url
   *
   * default determined by IExecConfig
   */
  iexec_result_storage_proxy?: string;
  /**
   * [deprecated]
   *
   * enable debug logs
   *
   * default false
   */
  iexec_developer_logger?: boolean;
}

/**
 * buy order for computing tasks
 */
export interface RequestorderTemplate {
  app: Address;
  appmaxprice: string;
  dataset: Address;
  datasetmaxprice: string;
  workerpool: Address;
  workerpoolmaxprice: string;
  volume: string;
  tag: Bytes32;
  category: string;
  trust: string;
  beneficiary: Address;
  callback: Address;
  params: RequestorderParams;
}

/**
 * buy order for computing tasks
 */
export interface SignableRequestorder {
  app: Address;
  appmaxprice: BNish;
  dataset: Address;
  datasetmaxprice: BNish;
  workerpool: Address;
  workerpoolmaxprice: BNish;
  volume: BNish;
  tag: Tag;
  category: BNish;
  trust: BNish;
  beneficiary: Address;
  callback: Address;
  params: RequestorderParams | string;
}

/**
 * buy order for computing tasks
 */
export interface HashableRequestorder extends SignableRequestorder {
  salt: Bytes32;
}

/**
 * signed buy order for computing tasks
 */
export interface SignedRequestorder {
  app: Address;
  appmaxprice: string;
  dataset: Address;
  datasetmaxprice: string;
  workerpool: Address;
  workerpoolmaxprice: string;
  volume: string;
  tag: Bytes32;
  category: string;
  trust: string;
  beneficiary: Address;
  callback: Address;
  params: string;
  salt: Bytes32;
  sign: Bytes;
}

/**
 * signed buy order for computing tasks
 */
export interface ConsumableRequestorder {
  app: Address;
  appmaxprice: BNish;
  dataset: Address;
  datasetmaxprice: BNish;
  workerpool: Address;
  workerpoolmaxprice: BNish;
  volume: BNish;
  tag: Tag;
  category: BNish;
  trust: BNish;
  beneficiary: Address;
  callback: Address;
  params: string;
  salt: Bytes32;
  sign: Bytes;
}

/**
 * module exposing order methods
 */
export default class IExecOrderModule extends IExecModule {
  /**
   * create an apporder template with specified parameters
   *
   * example:
   * ```js
   * const apporderTemplate = await createApporder({app: appAddress});
   * ```
   */
  createApporder(overrides: {
    app: Addressish;
    /**
     * price per task
     *
     * default `0`
     */
    appprice?: NRLCAmount;
    /**
     * volume of tasks executable with the order
     *
     * default `1`
     */
    volume?: BNish;
    /**
     * restrict usage to runtime with specified tags
     *
     * default `[]`
     */
    tag?: Tag | HumanSingleTag[];
    /**
     * restrict usage to a specific dataset
     *
     * default no restrict
     */
    datasetrestrict?: Addressish;
    /**
     * restrict usage to a specific workerpool
     *
     * default no restrict
     */
    workerpoolrestrict?: Addressish;
    /**
     * restrict usage to a specific requester
     *
     * default no restrict
     */
    requesterrestrict?: Addressish;
  }): Promise<ApporderTemplate>;
  /**
   * create a datasetorder template with specified parameters
   *
   * example:
   * ```js
   * const datasetorderTemplate = await createDatasetorder({dataset: datasetAddress});
   * ```
   */
  createDatasetorder(overrides: {
    dataset: Addressish;
    /**
     * price per task
     *
     * default `0`
     */
    datasetprice?: NRLCAmount;
    /**
     * volume of tasks executable with the order
     *
     * default `1`
     */
    volume?: BNish;
    /**
     * restrict usage to runtime with specified tags
     *
     * default `[]`
     */
    tag?: Tag | HumanSingleTag[];
    /**
     * restrict usage to a specific app
     *
     * default no restrict
     */
    apprestrict?: Addressish;
    /**
     * restrict usage to a specific workerpool
     *
     * default no restrict
     */
    workerpoolrestrict?: Addressish;
    /**
     * restrict usage to a specific requester
     *
     * default no restrict
     */
    requesterrestrict?: Addressish;
  }): Promise<DatasetorderTemplate>;
  /**
   * create a workerpoolorder template with specified parameters
   *
   * example:
   * ```js
   * const workerpoolorderTemplate = await createWorkerpoolorder({workerpool: workerpoolAddress, category: 0});
   * ```
   */
  createWorkerpoolorder(overrides: {
    workerpool: Addressish;
    /**
     * computation category
     */
    category: BNish;
    /**
     * price per task
     *
     * default `0`
     */
    workerpoolprice?: NRLCAmount;
    /**
     * volume of tasks executable with the order
     *
     * default `1`
     */
    volume?: BNish;
    /**
     * proposed trust
     *
     * default `0`
     */
    trust?: BNish;
    /**
     * proposed tags
     *
     * default `[]`
     */
    tag?: Tag | HumanSingleTag[];
    /**
     * restrict usage to a specific app
     *
     * default no restrict
     */
    apprestrict?: Addressish;
    /**
     * restrict usage to a specific dataset
     *
     * default no restrict
     */
    datasetrestrict?: Addressish;
    /**
     * restrict usage to a specific requester
     *
     * default no restrict
     */
    requesterrestrict?: Addressish;
  }): Promise<WorkerpoolorderTemplate>;
  /**
   * create a requestorder template with specified parameters
   *
   * example:
   * ```js
   * const requestorderTemplate = await createRequestorder({
   *   app: appAddress,
   *   category: 0,
   *   params: { iexec_args: 'hello world'}
   *  });
   * ```
   */
  createRequestorder(overrides: {
    /**
     * app to run
     */
    app: Addressish;
    /**
     * computation category
     */
    category: BNish;
    /**
     * dataset to use
     *
     * default none
     */
    dataset?: Addressish;
    /**
     * run one specified workerpool
     *
     * default run on any workerpool
     */
    workerpool?: Addressish;
    /**
     * execution parameters
     */
    params?: RequestorderParams | string;

    /**
     * address of the smart contract for on-chain callback with the execution result
     */
    callback?: Address;
    /**
     * app max price per task
     *
     * default `0`
     */
    appmaxprice?: NRLCAmount;
    /**
     * dataset max price per task
     *
     * default `0`
     */
    datasetmaxprice?: NRLCAmount;
    /**
     * workerpool max price per task
     *
     * default `0`
     */
    workerpoolmaxprice?: NRLCAmount;
    /**
     * volume of tasks executable with the order
     *
     * default `1`
     */
    volume?: BNish;
    /**
     * restrict usage to runtime with specified tags
     *
     * default `[]`
     */
    tag?: Tag | HumanSingleTag[];
    /**
     * required trust
     *
     * default `0`
     */
    trust?: BNish;
    /**
     * requester
     *
     * default connected wallet address
     */
    requester?: Addressish;
    /**
     * beneficiary
     *
     * default connected wallet address
     */
    beneficiary?: Addressish;
  }): Promise<RequestorderTemplate>;
  /**
   * **ONLY APP OWNER**
   *
   * sign an apporder template to create a valid order
   *
   * _NB_: preflight checks are performed on the order before signing (this helps detecting inconsistencies and prevent creating always failing tasks). these checks can be disabled by passing the option `preflightCheck: false`
   *
   * example:
   * ```js
   * const apporderTemplate = await createApporder({app: appAddress});
   * const apporder = await signApporder(apporderTemplate);
   * ```
   */
  signApporder(
    apporder: SignableApporder,
    options?: { preflightCheck?: boolean },
  ): Promise<SignedApporder>;
  /**
   * **SIGNER REQUIRED, ONLY DATASET OWNER**
   *
   * sign a datasetorder template to create a valid order
   *
   * _NB_: preflight checks are performed on the order before signing (this helps detecting inconsistencies and prevent creating always failing tasks). these checks can be disabled by passing the option `preflightCheck: false`
   *
   * example:
   * ```js
   * const datasetorderTemplate = await createDatasetorder({dataset: datasetAddress});
   * const datasetorder = await signDatasetorder(datasetorderTemplate);
   * ```
   */
  signDatasetorder(
    datasetorder: SignableDatasetorder,
    options?: { preflightCheck?: boolean },
  ): Promise<SignedDatasetorder>;
  /**
   * **SIGNER REQUIRED, ONLY WORKERPOOL OWNER**
   *
   * sign a workerpoolorder template to create a valid order
   *
   * ```js
   * const workerpoolorderTemplate = await createWorkerpoolorder({workerpool: workerpoolAddress, category: 0});
   * const workerpoolorder = await signWorkerpoolorder(workerpoolorderTemplate);
   * ```
   */
  signWorkerpoolorder(
    workerpoolorder: SignableWorkerpoolorder,
  ): Promise<SignedWorkerpoolorder>;
  /**
   * **SIGNER REQUIRED, ONLY REQUESTER**
   *
   * sign a requestorder template to create a valid order
   *
   * _NB_: preflight checks are performed on the order before signing (this helps detecting inconsistencies and prevent creating always failing tasks). these checks can be disabled by passing the option `preflightCheck: false`
   *
   * example:
   * ```js
   * const requestorderTemplate = await createRequestorder({
   *   app: appAddress,
   *   category: 0,
   *   params: { iexec_args: 'hello world'}
   *  });
   * const requestorder = await signRequestorder(requestorderTemplate);
   * ```
   */
  signRequestorder(
    requestorder: SignableRequestorder,
    options?: { preflightCheck?: boolean },
  ): Promise<SignedRequestorder>;
  /**
   * compute the hash of an apporder
   *
   * example:
   * ```js
   * const orderHash = await hashApporder(apporder);
   * console.log('order hash:', orderHash);
   * ```
   */
  hashApporder(apporder: HashableApporder): Promise<OrderHash>;
  /**
   * compute the hash of a datasetorder
   *
   * example:
   * ```js
   * const orderHash = await hashDatasetorder(datasetorder);
   * console.log('order hash:', orderHash);
   * ```
   */
  hashDatasetorder(datasetorder: HashableDatasetorder): Promise<OrderHash>;
  /**
   * compute the hash of a workerpoolorder
   *
   * example:
   * ```js
   * const orderHash = await hashWorkerpoolorder(workerpoolorder);
   * console.log('order hash:', orderHash);
   * ```
   */
  hashWorkerpoolorder(
    workerpoolorder: HashableWorkerpoolorder,
  ): Promise<OrderHash>;
  /**
   * compute the hash of a requestorder
   *
   * example:
   * ```js
   * const orderHash = await hashRequestorder(requestorder);
   * console.log('order hash:', orderHash);
   * ```
   */
  hashRequestorder(requestorder: HashableRequestorder): Promise<OrderHash>;
  /**
   * **SIGNER REQUIRED, ONLY APP OWNER**
   *
   * cancel an apporder on the blockchain making it invalid
   *
   * example:
   * ```js
   * const { txHash } = await cancelApporder(apporder);
   * console.log('cancel tx:', txHash);
   * ```
   */
  cancelApporder(
    apporder: ConsumableApporder,
  ): Promise<{ txHash: TxHash; order: SignedApporder }>;
  /**
   * **SIGNER REQUIRED, ONLY DATASET OWNER**
   *
   * cancel a datasetorder on the blockchain making it invalid
   *
   * example:
   * ```js
   * const { txHash } = await cancelDatasetorder(datasetorder);
   * console.log('cancel tx:', txHash);
   * ```
   */
  cancelDatasetorder(
    datasetorder: ConsumableDatasetorder,
  ): Promise<{ txHash: TxHash; order: SignedDatasetorder }>;
  /**
   * **SIGNER REQUIRED, ONLY WORKERPOOL OWNER**
   *
   * cancel a workerpoolorder on the blockchain making it invalid
   *
   * example:
   * ```js
   * const { txHash } = await cancelWorkerpoolorder(workerpoolorder);
   * console.log('cancel tx:', txHash);
   * ```
   */
  cancelWorkerpoolorder(
    workerpoolorder: ConsumableWorkerpoolorder,
  ): Promise<{ txHash: TxHash; order: SignedWorkerpoolorder }>;
  /**
   * **SIGNER REQUIRED, ONLY REQUESTER**
   *
   * cancel a requestorder on the blockchain making it invalid
   *
   * example:
   * ```js
   * const { txHash } = await cancelRequestorder(requestorder);
   * console.log('cancel tx:', txHash);
   * ```
   */
  cancelRequestorder(
    requestorder: ConsumableRequestorder,
  ): Promise<{ txHash: TxHash; order: SignedRequestorder }>;
  /**
   * **SIGNER REQUIRED, ONLY APP OWNER**
   *
   * publish an apporder on the off-chain marketplace making it available for other users
   *
   * _NB_: preflight checks are performed on the order before signing (this helps detecting inconsistencies and prevent creating always failing tasks). these checks can be disabled by passing the option `preflightCheck: false`
   *
   * example:
   * ```js
   * const orderHash = await publishApporder(apporder);
   * console.log('published order hash:', orderHash);
   * ```
   */
  publishApporder(
    apporder: ConsumableApporder,
    options?: {
      preflightCheck?: boolean;
    },
  ): Promise<OrderHash>;
  /**
   * **SIGNER REQUIRED, ONLY DATASET OWNER**
   *
   * publish a datasetorder on the off-chain marketplace making it available for other users
   *
   * _NB_: preflight checks are performed on the order before signing (this helps detecting inconsistencies and prevent creating always failing tasks). these checks can be disabled by passing the option `preflightCheck: false`
   *
   * example:
   * ```js
   * const orderHash = await publishDatasetorder(datasetorder);
   * console.log('published order hash:', orderHash);
   * ```
   */
  publishDatasetorder(
    datasetorder: ConsumableDatasetorder,
    options?: {
      preflightCheck?: boolean;
    },
  ): Promise<OrderHash>;
  /**
   * **SIGNER REQUIRED, ONLY WORKERPOOL OWNER**
   *
   * publish a workerpoolorder on the off-chain marketplace making it available for other users
   *
   * example:
   * ```js
   * const orderHash = await publishWorkerpoolorder(workerpoolorder);
   * console.log('published order hash:', orderHash);
   * ```
   */
  publishWorkerpoolorder(
    workerpoolorder: ConsumableWorkerpoolorder,
  ): Promise<OrderHash>;
  /**
   * **SIGNER REQUIRED, ONLY REQUESTER**
   *
   * publish a requestorder on the off-chain marketplace making it available for other users
   *
   * _NB_: preflight checks are performed on the order before signing (this helps detecting inconsistencies and prevent creating always failing tasks). these checks can be disabled by passing the option `preflightCheck: false`
   *
   * example:
   * ```js
   * const orderHash = await publishRequestorder(requestorder);
   * console.log('published order hash:', orderHash);
   * ```
   */
  publishRequestorder(
    requestorder: ConsumableRequestorder,
    options?: { preflightCheck?: boolean },
  ): Promise<OrderHash>;
  /**
   * **SIGNER REQUIRED, ONLY APPORDER SIGNER**
   *
   * unpublish an apporder from the off-chain marketplace
   *
   * _NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them
   *
   * example:
   * ```js
   * const orderHash = await unpublishApporder(apporderHash);
   * console.log(unpublished order hash:', orderHash);
   * ```
   */
  unpublishApporder(apporderHash: OrderHash): Promise<OrderHash>;
  /**
   * **SIGNER REQUIRED, ONLY DATASETORDER SIGNER**
   *
   * unpublish a datasetorder from the off-chain marketplace
   *
   * _NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them
   *
   * example:
   * ```js
   * const orderHash = await unpublishDatasetorder(datasetorderHash);
   * console.log('unpublished order hash:', orderHash);
   * ```
   */
  unpublishDatasetorder(datasetorderHash: OrderHash): Promise<OrderHash>;
  /**
   * **SIGNER REQUIRED, ONLY WORKERPOOLORDER SIGNER**
   *
   * unpublish a workerpoolorder from the off-chain marketplace
   *
   * _NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them
   *
   * example:
   * ```js
   * const orderHash = await unpublishWorkerpoolorder(workerpoolorderHash);
   * console.log('unpublished order hash:', orderHash);
   * ```
   */
  unpublishWorkerpoolorder(workerpoolorderHash: OrderHash): Promise<OrderHash>;
  /**
   * **SIGNER REQUIRED, ONLY REQUESTER**
   *
   * unpublish a requestorder from the off-chain marketplace
   *
   * _NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them
   *
   * example:
   * ```js
   * const orderHash = await unpublishRequestorder(requestorderHash);
   * console.log('unpublished order hash:', orderHash);
   * ```
   */
  unpublishRequestorder(requestorderHash: OrderHash): Promise<OrderHash>;
  /**
   * **SIGNER REQUIRED, ONLY APPORDER SIGNER**
   *
   * unpublish the last published app's apporder from the off-chain marketplace
   *
   * _NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them
   *
   * example:
   * ```js
   * const orderHash = await unpublishLastApporder(appAddress);
   * console.log('published order hash:', orderHash);
   * ```
   */
  unpublishLastApporder(appAddress: Addressish): Promise<OrderHash>;
  /**
   * **SIGNER REQUIRED, ONLY DATASETORDER SIGNER**
   *
   * unpublish the last published dataset's datasetorder from the off-chain marketplace
   *
   * _NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them
   *
   * example:
   * ```js
   * const orderHash = await unpublishLastDatasetorder(datasetAddress);
   * console.log('unpublished order hash:', orderHash);
   * ```
   */
  unpublishLastDatasetorder(datasetAddress: Addressish): Promise<OrderHash>;
  /**
   * ****SIGNER REQUIRED, ONLY WORKERPOOLORDER SIGNER**
   *
   * unpublish the last published workerpool's workerpoolorder from the off-chain marketplace
   *
   * _NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them
   *
   * example:
   * ```js
   * const orderHash = await unpublishLastWorkerpoolorder(workerpoolAddress);
   * console.log('unpublished order hash:', orderHash);
   * ```
   */
  unpublishLastWorkerpoolorder(
    workerpoolAddress: Addressish,
  ): Promise<OrderHash>;
  /**
   * **SIGNER REQUIRED, ONLY REQUESTER**
   *
   * unpublish the last published requester's requestorder from the off-chain marketplace
   *
   * _NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them
   *
   * example:
   * ```js
   * const orderHash = await unpublishLastRequestorder();
   * console.log('unpublished order hash:', orderHash);
   * ```
   */
  unpublishLastRequestorder(): Promise<OrderHash>;
  /**
   * **SIGNER REQUIRED, ONLY APPORDER SIGNER**
   *
   * unpublish all the published app's apporders from the off-chain marketplace
   *
   * _NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them
   *
   * example:
   * ```js
   * const orderHashes = await unpublishAllApporders(appAddress);
   * console.log('published orders count:', orderHashes.length);
   * ```
   */
  unpublishAllApporders(appAddress: Addressish): Promise<OrderHash[]>;
  /**
   * **SIGNER REQUIRED, ONLY DATASETORDER SIGNER**
   *
   * unpublish all the published dataset's datasetorders from the off-chain marketplace
   *
   * _NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them
   *
   * example:
   * ```js
   * const orderHashes = await unpublishAllDatasetorders(datasetAddress);
   * console.log('unpublished orders count:', orderHashes.length);
   * ```
   */
  unpublishAllDatasetorders(datasetAddress: Addressish): Promise<OrderHash[]>;
  /**
   * **SIGNER REQUIRED, ONLY WORKERPOOLORDER SIGNER**
   *
   * unpublish all the published workerpool's workerpoolorders from the off-chain marketplace
   *
   * _NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them
   *
   * example:
   * ```js
   * const orderHashes = await unpublishAllWorkerpoolorders(workerpoolAddress);
   * console.log('unpublished orders count:', orderHashes.length);
   * ```
   */
  unpublishAllWorkerpoolorders(
    workerpoolAddress: Addressish,
  ): Promise<OrderHash[]>;
  /**
   * **SIGNER REQUIRED, ONLY REQUESTER**
   *
   * unpublish all the published requester's requestorders from the off-chain marketplace
   *
   * _NB_: this is a transaction free off-chain operation, unpublished orders are no longer exposed to other users but are still valid, use the cancel method if you want to invalidate them
   *
   * example:
   * ```js
   * const orderHashes = await unpublishAllRequestorders();
   * console.log('unpublished orders count:', orderHashes.length);
   * ```
   */
  unpublishAllRequestorders(): Promise<OrderHash[]>;
  /**
   * **SIGNER REQUIRED**
   *
   * make a deal on-chain with compatible orders to trigger the off-chain computation.
   *
   * _NB_: preflight checks are performed on the orders before signing (this helps detecting inconsistencies and prevent creating always failing tasks). these checks can be disabled by passing the option `preflightCheck: false`
   *
   * ```js
   * const { dealid, txHash } = await matchOrders({
   *   apporder,
   *   workerpoolorder,
   *   requestorder,
   * });
   * console.log(`created deal ${dealid} in tx ${txHash}`);
   * ```
   */
  matchOrders(
    orders: {
      apporder: ConsumableApporder;
      datasetorder?: ConsumableDatasetorder;
      workerpoolorder: ConsumableWorkerpoolorder;
      requestorder: ConsumableRequestorder;
    },
    options?: {
      preflightCheck?: boolean;
    },
  ): Promise<{ dealid: Dealid; volume: BN; txHash: TxHash }>;
  /**
   * Create an IExecOrderModule instance using an IExecConfig instance
   */
  static fromConfig(config: IExecConfig): IExecOrderModule;
}
