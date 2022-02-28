import BNJS from 'bn.js';

/**
 * big number
 */
export type BN = BNJS;
/**
 * big number like
 */
export type BNish = BN | string | number | bigint;
/**
 * ethereum address
 */
export type Address = string;
/**
 * ENS
 */
export type ENS = string;
/**
 * ethereum address or ENS
 */
export type Addressish = Address | ENS;
/**
 * bytes hex string
 */
export type Bytes = string;
/**
 * bytes 32 hex string
 */
export type Bytes32 = string;
/**
 * id of a deal
 */
export type Dealid = Bytes32;
/**
 * id of a task
 */
export type Taskid = Bytes32;
/**
 * transaction hash
 */
export type TxHash = Bytes32;
/**
 * amount with specified unit (ex: '0.1 eth', '2 gwei', '1 nRLC')
 */
export type NativeAmountWithUnit = string;
/**
 * IExec token amount with specified unit (ex: '48 RLC', '1 nRLC')
 */
export type TokenAmountWithUnit = string;
/**
 * wei amount (wei is the smallest sub-division of ether: 1 ether = 1,000,000,000,000,000,000 wei).
 */
export type WeiAmount = BNish | NativeAmountWithUnit;
/**
 * nRLC (nano RLC) amount (nRLC is the smallest sub-division of RLC: 1 RLC = 1,000,000,000 RLC).
 */
export type NRLCAmount = BNish | TokenAmountWithUnit;
/**
 * human redable task tag (ex: 'tee')
 */
export type HumanSingleTag = string;
/**
 * task tag
 */
export type Tag = Bytes32 | HumanSingleTag[];
/**
 * multiaddress
 */
export type Multiaddress = string | Buffer;

/**
 * IExec app
 */
export interface App {
  /**
   * the app owner
   */
  owner: Address;
  /**
   * a name for the app
   */
  name: string;
  /**
   * only 'DOCKER' is supported
   */
  type: string;
  /**
   * app image address
   */
  multiaddr: Multiaddress;
  /**
   * app image digest
   */
  checksum: Bytes32;
  /**
   * optional for TEE apps only, specify the TEE protocol to use
   */
  mrenclave?: string;
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
 * IExec category
 */
export interface Category {
  /**
   * a name for the category
   */
  name: string;
  /**
   * a description of the category
   */
  description: string;
  /**
   * time base (in sec) for the category (tasks of this category must be completed under 10 * workClockTimeRef)
   */
  workClockTimeRef: BNish;
}

/**
 * sell order for an app
 */
export interface UnsignedApporder {
  app: Addressish;
  appprice: NRLCAmount;
  volume: BNish;
  tag: Tag;
  datasetrestrict: Addressish;
  workerpoolrestrict: Addressish;
  requesterrestrict: Addressish;
}

/**
 * signed sell order for an app
 */
export interface SignedApporder {
  app: Addressish;
  appprice: NRLCAmount;
  volume: BNish;
  tag: Tag;
  datasetrestrict: Addressish;
  workerpoolrestrict: Addressish;
  requesterrestrict: Addressish;
  salt: Bytes32;
  sign: Bytes;
}

/**
 * sell order for a dataset
 */
export interface UnsignedDatasetorder {
  dataset: Addressish;
  datasetprice: NRLCAmount;
  volume: BNish;
  tag: Tag;
  apprestrict: Addressish;
  workerpoolrestrict: Addressish;
  requesterrestrict: Addressish;
}

/**
 * signed sell order for a dataset
 */
export interface SignedDatasetorder {
  dataset: Addressish;
  datasetprice: NRLCAmount;
  volume: BNish;
  tag: Tag;
  apprestrict: Addressish;
  workerpoolrestrict: Addressish;
  requesterrestrict: Addressish;
  salt: Bytes32;
  sign: Bytes;
}

/**
 * sell order for computing power
 */
export interface UnsignedWorkerpoolorder {
  workerpool: Addressish;
  workerpoolprice: NRLCAmount;
  volume: BNish;
  tag: Tag;
  category: BNish;
  trust: BNish;
  apprestrict: Addressish;
  datasetrestrict: Addressish;
  requesterrestrict: Addressish;
}

/**
 * signed sell order for computing power
 */
export interface SignedWorkerpoolorder {
  workerpool: Addressish;
  workerpoolprice: NRLCAmount;
  volume: BNish;
  tag: Tag;
  category: BNish;
  trust: BNish;
  apprestrict: Addressish;
  datasetrestrict: Addressish;
  requesterrestrict: Addressish;
  salt: Bytes32;
  sign: Bytes;
}

/**
 * buy order for computing tasks
 */
export interface UnsignedRequestorder {
  app: Addressish;
  appmaxprice: NRLCAmount;
  dataset?: Addressish;
  datasetmaxprice?: NRLCAmount;
  workerpool: Addressish;
  workerpoolmaxprice: NRLCAmount;
  volume: BNish;
  tag: Tag;
  category: BNish;
  trust: BNish;
  beneficiary?: Addressish;
  callback?: Addressish;
  params?: {
    iexec_args?: string;
    iexec_input_files?: string[];
    iexec_result_encryption?: boolean;
    iexec_result_storage_provider?: string;
    iexec_result_storage_proxy?: string;
    iexec_developer_logger?: boolean;
  };
}

/**
 * signed buy order for computing tasks
 */
export interface SignedRequestorder {
  app: Addressish;
  appmaxprice: NRLCAmount;
  dataset?: Addressish;
  datasetmaxprice?: NRLCAmount;
  workerpool: Addressish;
  workerpoolmaxprice: NRLCAmount;
  volume: BNish;
  tag: Tag;
  category: BNish;
  trust: BNish;
  beneficiary?: Addressish;
  callback?: Addressish;
  params?: {
    iexec_args?: string;
    iexec_input_files?: string[];
    iexec_result_encryption?: boolean;
    iexec_result_storage_provider?: string;
    iexec_result_storage_proxy?: string;
    iexec_developer_logger?: boolean;
  };
  salt: Bytes32;
  sign: Bytes;
}
