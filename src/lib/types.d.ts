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
 * index of a task in a bag of tasks
 */
export type TaskIndex = number;
/**
 * transaction hash
 */
export type TxHash = Bytes32;
/**
 * order hash
 */
export type OrderHash = Bytes32;
/**
 * wei amount (wei is the smallest sub-division of ether: 1 ether = 1,000,000,000,000,000,000 wei).
 *
 * named units ('wei', 'kwei', 'mwei', 'gwei', 'szabo', 'finney', 'ether' or 'eth') can be used with the format `${amount} ${unit}`
 *
 * examples:
 * ```js
 * // number
 * const oneWei = 1;
 * const tenGigaWei = 1000000000;
 * // string (works for amounts above `Number.MAX_SAFE_INTEGER`)
 * const oneEth = '1000000000000000000';
 * // string with unit
 * const fiveGigaWei = '5 gwei';
 * const zeroPointOneEth = '0.1 ether';
 * // BN (from utils)
 * const tenWei = new BN(10);
 * ```
 */
export type WeiAmount = number | string | BN;
/**
 * nRLC amount (nRLC stands for nano RLC, the smallest sub-division of the RLC token: 1 RLC = 1,000,000,000 RLC).
 *
 * named units ('nRLC', 'RLC') can be used with the format `${amount} ${unit}` (example: `'0.1 RLC'`)
 *
 * examples:
 * ```js
 * // number
 * const oneNRLC = 1;
 * const tenRLC = 1000000000;
 * // string (works for amounts above `Number.MAX_SAFE_INTEGER`)
 * const tenMillionRLC = '10000000000000000';
 * // string with unit
 * const fiveRLC = '5 RLC';
 * const zeroPointOneRLC = '0.1 RLC';
 * // BN (from utils)
 * const tenNRLC = new BN(10);
 * ```
 */
export type NRLCAmount = number | string | BN;
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
