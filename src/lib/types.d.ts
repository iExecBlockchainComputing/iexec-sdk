import BN from 'bn.js';

/**
 * big number like
 */
type BNish = BN | string | number;
/**
 * ethereum address
 *
 * example:
 * ```js
 * const address = '0xF048eF3d7E3B33A465E0599E641BB29421f7Df92';
 * ```
 */
type Address = string;
/**
 * ENS
 *
 * example:
 * ```js
 * const ensName = 'iexec.eth';
 * ```
 */
type ENS = string;
/**
 * ethereum address or ENS
 */
type Addressish = Address | ENS;
/**
 * bytes hex string
 *
 * example:
 * ```js
 * const NULL_BYTES = '0x';
 * ```
 */
type Bytes = string;
/**
 * bytes 32 hex string
 *
 * example:
 * ```js
 * const bytes32 = '0x800e8dca929fd7b6ced10b5f84487c49f7be79b2eed662827eccba258ef883c6';
 * ```
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
 * named units ('nRLC', 'RLC') can be used with the format `${amount} ${unit}`
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
 * human redable task tag
 *
 * example:
 * ```js
 * const teeTag = 'tee';
 * ```
 */
type HumanSingleTag = string;
/**
 * task tag used to specify the runtime
 *
 * example:
 * ```js
 * const onlyTeeTag = ['tee'];
 * const teePlusGpuTags = ['tee','gpu'];
 * ```
 */
type Tag = Bytes32 | HumanSingleTag[];
/**
 * multiaddress
 *
 * example:
 * ```js
 * const url = 'https://example.com/foo.bar'
 * const ipfs = '/ipfs/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ'
 * ```
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
