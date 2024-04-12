import BN from 'bn.js';

export * from './utils/IExecContractsClient.js';
export * from './utils/reactive.js';
export * from './utils/signers.js';

/**
 * big number like
 */
export type BNish = BN | bigint | string | number;
/**
 * ethereum address
 *
 * example:
 * ```js
 * const address = '0xF048eF3d7E3B33A465E0599E641BB29421f7Df92';
 * ```
 */
export type Address = string;
/**
 * ENS
 *
 * example:
 * ```js
 * const ensName = 'iexec.eth';
 * ```
 */
export type ENS = string;
/**
 * ethereum address or ENS
 */
export type Addressish = Address | ENS;
/**
 * bytes hex string
 *
 * example:
 * ```js
 * const NULL_BYTES = '0x';
 * ```
 */
export type Bytes = string;
/**
 * bytes 32 hex string
 *
 * example:
 * ```js
 * const bytes32 = '0x800e8dca929fd7b6ced10b5f84487c49f7be79b2eed662827eccba258ef883c6';
 * ```
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
export type NRLCAmount = number | string | BN;
/**
 * human redable task tag
 *
 * example:
 * ```js
 * const teeTag = 'tee';
 * ```
 */
export type HumanSingleTag = string;
/**
 * task tag used to specify the runtime
 *
 * example:
 * ```js
 * const gpuTag = ['gpu'];
 * const sconeTeeTag = ['tee', 'scone'];
 * const gramineTeeTag = ['tee', 'gramine'];
 * ```
 */
export type Tag = Bytes32 | HumanSingleTag[];
/**
 * multiaddress
 *
 * example:
 * ```js
 * const url = 'https://example.com/foo.bar'
 * const ipfs = '/ipfs/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ'
 * ```
 */
export type Multiaddress = string | Buffer;

/**
 * Trusted Execution Environment name
 */
export type TeeFramework = 'scone' | 'gramine';

export type AnyRecord = Record<string, any>;

/**
 * [ethers default provider](https://docs.ethers.io/v5/api/providers/#providers-getDefaultProvider) options
 */
export interface ProviderOptions {
  /**
   * [Alchemy](https://alchemyapi.io/) API key
   */
  alchemy?: string;
  /**
   * [Etherscan](https://etherscan.io/) API key
   */
  etherscan?: string;
  /**
   * [INFURA](https://infura.io/) Project ID or { projectId, projectSecret }
   */
  infura?:
    | string
    | {
        /**
         * [INFURA](https://infura.io/) project ID
         */
        projectId: string;
        /**
         * [INFURA](https://infura.io/) project secret
         */
        projectSecret: string;
      };
  /**
   * allow Cloudflare provider
   */
  cloudflare?: boolean;
  /**
   * the number of backends that must agree (default: 2 for mainnet, 1 for testnets)
   */
  quorum?: number;
}
