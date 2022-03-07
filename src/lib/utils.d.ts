import { BlockTag, Provider } from '@ethersproject/abstract-provider';
import { Wallet } from '@ethersproject/wallet';
import { BytesLike } from '@ethersproject/bytes';
import {
  ExternallyOwnedAccount,
  TypedDataDomain,
  TypedDataField,
} from '@ethersproject/abstract-signer';
import { SigningKey } from '@ethersproject/signing-key';
import BNJS from 'bn.js';
import {
  BN as BNtype,
  WeiAmount,
  NRLCAmount,
  HumanSingleTag,
  Bytes32,
} from './types';

declare class EnhancedWallet extends Wallet {
  constructor(
    privateKey: BytesLike | ExternallyOwnedAccount | SigningKey,
    provider?: Provider,
    options?: {
      gasPrice?: string;
      getTransactionCount?: (blockTag?: BlockTag) => Promise<number>;
    },
  );

  signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>,
  ): Promise<string>;
}

/**
 * create a signer connected to the specified blockchain host from a private key
 *
 * example:
 * ```js
 * const ethProvider = getSignerFromPrivateKey('http://localhost:8545', '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407');
 * const iexec = new IExec({ ethProvider });
 * ```
 */
export const getSignerFromPrivateKey: (
  /**
   * node RPC url
   */
  host: string,
  /**
   * wallet private key
   */
  privateKey: string,
  options?: {
    /**
     * gas price override
     */
    gasPrice?: string;
    /**
     * nonce override
     */
    getTransactionCount?: (blockTag?: BlockTag) => Promise<number>;
    /**
     * providers options
     */
    providers: any;
  },
) => EnhancedWallet;

/**
 * class used for big numbers manipulation
 *
 * example:
 * ```js
 * const one = new BN(1);
 * const two = new BN('2');
 *
 * // work above Number.MAX_SAFE_INTEGER limit
 * const maxSafeInteger = new BN(Number.MAX_SAFE_INTEGER);
 * const maxSafeIntegerPlusOne = maxSafeInteger.add(one);
 * ```
 */
export class BN extends BNJS {}
/**
 * ethereum null/zero address
 */
export const NULL_ADDRESS: string;
/**
 * null bytes32
 */
export const NULL_BYTES32: string;
/**
 * parse a string formatted Eht value in wei big number
 *
 * supported units: 'wei', 'kwei', 'mwei', 'gwei', 'szabo', 'finney', 'ether' (or 'eth') default unit 'wei'
 *
 * example:
 * ```js
 * console.log('5 gwei =' + parseEth('5 gwei') + 'wei');
 * console.log('5 gwei =' + parseEth(5, 'gwei') + 'wei');
 * ```
 */
export const parseEth: (value: string, defaultUnit?: string) => BNtype;
/**
 * parse a string formatted RLC value in nRLC big number
 *
 * supported units: 'nRLC', 'RLC' default unit 'nRLC'
 *
 * example:
 * ```js
 * console.log('5 RLC =' + parseEth('5 RLC') + 'nRLC');
 * console.log('5 RLC =' + parseEth(5, 'RLC') + 'nRLC');
 * ```
 */
export const parseRLC: (value: string, defaultUnit?: string) => BNtype;
/**
 * format a wei amount in Eth
 *
 * example:
 * ```js
 * console.log('500000000 wei =' + formatEth('500000000')) + 'ether');
 * ```
 */
export const formatEth: (wei: WeiAmount) => string;
/**
 * format a nRLC amount in RLC
 *
 *  * example:
 * ```js
 * console.log('500000000 nRLC =' + formatRLC('500000000') + 'RLC');
 * ```
 */
export const formatRLC: (nRLC: NRLCAmount) => string;
/**
 * encode an array of human readable tags in a bytes32 tag readable by iExec's smart contracts
 *
 * example:
 * ```js
 * console.log(encodeTag(['tee', 'gpu']));
 * ```
 */
export const encodeTag: (tags: HumanSingleTag[]) => Bytes32;
/**
 * decode a bytes32 tag in an array of human readable tags
 *
 * example:
 * ```js
 * console.log(decodeTag('0x0000000000000000000000000000000000000000000000000000000000000001'));
 * ```
 */
export const decodeTag: (tag: Bytes32) => HumanSingleTag[];
/**
 * sum an array of bytes32 tags
 *
 * example:
 * ```js
 * const appTag = '0x0000000000000000000000000000000000000000000000000000000000000100';
 * const datasetTag = '0x0000000000000000000000000000000000000000000000000000000000000001';
 * const requestTag = '0x0000000000000000000000000000000000000000000000000000000000000000';
 * const workerpoolMinTag = sumTags([appTag, datasetTag, requestTag]);
 * console.log('workerpoolMinTag', workerpoolMinTag);
 * ```
 */
export const sumTags: (tags: Bytes32[]) => Bytes32;
/**
 * decrypt an encrypted result file
 *
 * example:
 * ```js
 * // somehow load the beneficiary RSA private key
 * const beneficaryKey = await loadBeneficiaryKey();
 * const response = await iexec.task.fetchResults('0x5c959fd2e9ea2d5bdb965d7c2e7271c9cb91dd05b7bdcfa8204c34c52f8c8c19');
 * const encFileBuffer = await response.arrayBuffer();
 * const decryptedFileBuffer = await decryptResult(encFileBuffer, beneficaryKey);
 * const binary = new Blob([decryptedFileBuffer]);
 * ```
 */
export const decryptResult: (
  encrypted: Buffer | Uint8Array | string,
  beneficiaryKey: string,
) => Promise<Buffer>;
