import BN from 'bn.js';

/**
 * big number like
 */
type BNish = BN | string | number | bigint;
/**
 * ethereum address
 */
type Address = string;
/**
 * ENS
 */
type ENS = string;
/**
 * ethereum address or ENS
 */
type Addressish = Address | ENS;
/**
 * bytes hex string
 */
type Bytes = string;
/**
 * bytes 32 hex string
 */
type Bytes32 = string;
/**
 * id of a deal
 */
type Dealid = Bytes32;
/**
 * id of a task
 */
type Taskid = Bytes32;
/**
 * index of a task in a bag of tasks
 */
type TaskIndex = number;
/**
 * transaction hash
 */
type TxHash = Bytes32;
/**
 * order hash
 */
type OrderHash = Bytes32;
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
type WeiAmount = number | string | BN;
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
type NRLCAmount = number | string | BN;
/**
 * human redable task tag (ex: 'tee')
 */
type HumanSingleTag = string;
/**
 * task tag
 */
type Tag = Bytes32 | HumanSingleTag[];
/**
 * multiaddress
 */
type Multiaddress = string | Buffer;

export {
  BN,
  BNish,
  Address,
  Addressish,
  ENS,
  Bytes,
  Bytes32,
  Dealid,
  Taskid,
  TaskIndex,
  TxHash,
  OrderHash,
  WeiAmount,
  NRLCAmount,
  HumanSingleTag,
  Tag,
  Multiaddress,
};
