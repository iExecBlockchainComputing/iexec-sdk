// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import { readFile } from 'fs/promises';
import { join } from 'path';
import JSZip from 'jszip';
import {
  ALCHEMY_API_KEY,
  ETHERSCAN_API_KEY,
  INFURA_PROJECT_ID,
  TEST_CHAINS,
  getId,
  getRandomWallet,
  setBalance,
} from '../../test-utils.js';
import '../../jest-setup.js';
import { ONE_ETH, getTestConfigOptions } from '../lib-test-utils.js';

import { IExec, utils } from '../../../src/lib/index.js';

const { BN, NULL_ADDRESS } = utils;

describe('utils', () => {
  describe('parseEth()', () => {
    test("parseEth('4.2')", () => {
      const res = utils.parseEth('4.2');
      expect(res instanceof BN).toBe(true);
      expect(res.eq(new BN('4200000000000000000'))).toBe(true);
    });

    test('parseEth(4.2)', () => {
      const res = utils.parseEth(4.2);
      expect(res instanceof BN).toBe(true);
      expect(res.eq(new BN('4200000000000000000'))).toBe(true);
    });

    test('parseEth(new BN(42))', () => {
      const res = utils.parseEth(new BN(42));
      expect(res instanceof BN).toBe(true);
      expect(res.eq(new BN('42000000000000000000'))).toBe(true);
    });

    test("parseEth('4.2 ether')", () => {
      const res = utils.parseEth('4.2 ether');
      expect(res instanceof BN).toBe(true);
      expect(res.eq(new BN('4200000000000000000'))).toBe(true);
    });

    test("parseEth('4.2 gwei')", () => {
      const res = utils.parseEth('4.2 gwei');
      expect(res instanceof BN).toBe(true);
      expect(res.eq(new BN('4200000000'))).toBe(true);
    });

    test("parseEth('4.2', 'gwei')", () => {
      const res = utils.parseEth('4.2', 'gwei');
      expect(res instanceof BN).toBe(true);
      expect(res.eq(new BN('4200000000'))).toBe(true);
    });

    test("parseEth('4.2 foo')", () => {
      expect(() => utils.parseEth('4.2 foo')).toThrow(
        new Error('Invalid ether unit'),
      );
    });

    test("parseEth('4.2 wei')", () => {
      expect(() => utils.parseEth('4.2 wei')).toThrow(
        new Error('Invalid ether amount'),
      );
    });
  });

  describe('parseRLC()', () => {
    test("parseRLC('4.2')", () => {
      const res = utils.parseRLC('4.2');
      expect(res instanceof BN).toBe(true);
      expect(res.eq(new BN('4200000000'))).toBe(true);
    });

    test('parseRLC(4.2)', () => {
      const res = utils.parseRLC(4.2);
      expect(res instanceof BN).toBe(true);
      expect(res.eq(new BN('4200000000'))).toBe(true);
    });

    test('parseRLC(new BN(42))', () => {
      const res = utils.parseRLC(new BN(42));
      expect(res instanceof BN).toBe(true);
      expect(res.eq(new BN('42000000000'))).toBe(true);
    });

    test("parseRLC('4.2 RLC')", () => {
      const res = utils.parseRLC('4.2 RLC');
      expect(res instanceof BN).toBe(true);
      expect(res.eq(new BN('4200000000'))).toBe(true);
    });

    test("parseRLC('42 nRLC')", () => {
      const res = utils.parseRLC('42 nRLC');
      expect(res instanceof BN).toBe(true);
      expect(res.eq(new BN('42'))).toBe(true);
    });

    test("parseRLC('42', 'nRLC')", () => {
      const res = utils.parseRLC('42', 'nRLC');
      expect(res instanceof BN).toBe(true);
      expect(res.eq(new BN('42'))).toBe(true);
    });

    test("parseRLC('4.2 nRLC')", () => {
      expect(() => utils.parseRLC('4.2 nRLC')).toThrow(
        new Error('Invalid token amount'),
      );
    });

    test("parseRLC('4.2 foo')", () => {
      expect(() => utils.parseRLC('4.2 foo')).toThrow(
        new Error('Invalid token unit'),
      );
    });
  });

  describe('formatEth', () => {
    test("formatEth('4200000000000000000')", () => {
      const res = utils.formatEth('4200000000000000000');
      expect(res).toBe('4.2');
    });

    test('formatEth(42)', () => {
      const res = utils.formatEth(42);
      expect(res).toBe('0.000000000000000042');
    });

    test("formatEth(new BN('4200000000000000000'))", () => {
      const res = utils.formatEth(new BN('4200000000000000000'));
      expect(res).toBe('4.2');
    });
  });

  describe('formatRLC()', () => {
    test("formatRLC('4200000000000000000')", () => {
      const res = utils.formatRLC('4200000000000000000');
      expect(res).toBe('4200000000.0');
    });

    test('formatRLC(42)', () => {
      const res = utils.formatRLC(42);
      expect(res).toBe('0.000000042');
    });

    test("formatRLC(new BN('4200000000000000000'))", () => {
      const res = utils.formatRLC(new BN('4200000000000000000'));
      expect(res).toBe('4200000000.0');
    });
  });

  describe('encodeTag()', () => {
    test("encodeTag(['tee'])", () => {
      expect(utils.encodeTag(['tee'])).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      );
    });

    test("encodeTag(['scone'])", () => {
      expect(utils.encodeTag(['scone'])).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000002',
      );
    });

    test("encodeTag(['gramine'])", () => {
      expect(utils.encodeTag(['gramine'])).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000004',
      );
    });

    test("encodeTag(['gpu'])", () => {
      expect(utils.encodeTag(['gpu'])).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000100',
      );
    });

    test("encodeTag(['gpu','tee'])", () => {
      expect(utils.encodeTag(['gpu', 'tee'])).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000101',
      );
    });

    test("encodeTag(['gpu','tee','gpu','tee'])", () => {
      expect(utils.encodeTag(['gpu', 'tee', 'gpu', 'tee'])).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000101',
      );
    });

    test('encodeTag unknown tag', () => {
      expect(() => utils.encodeTag(['tee', 'foo'])).toThrow('Unknown tag foo');
    });
  });

  describe('decodeTag()', () => {
    test("decodeTag('0x0000000000000000000000000000000000000000000000000000000000000003')", () => {
      expect(
        utils.decodeTag(
          '0x0000000000000000000000000000000000000000000000000000000000000003',
        ),
      ).toStrictEqual(['tee', 'scone']);
    });

    test('decodeTag unknown bit tag', () => {
      expect(() =>
        utils.decodeTag(
          '0x000000000000000000000000000000000000000000000000000000000000000a',
        ),
      ).toThrow(Error('Unknown bit 3 in tag'));
    });
  });

  describe('sumTags()', () => {
    test('sumTags from Bytes32', () => {
      expect(
        utils.sumTags([
          '0x0000000000000000000000000000000000000000000000000000000000000100',
          '0x0000000000000000000000000000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000000000000000000000000000001',
        ]),
      ).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000101',
      );
    });

    test('sumTags unknown bit tag', () => {
      expect(
        utils.sumTags([
          '0x0000000000000000000000000000000000000000000000000000000000000101',
          '0x0000000000000000000000000000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000000000000000000000000000002',
        ]),
      ).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000103',
      );
    });

    test('sumTags invalid bytes32', () => {
      expect(() =>
        utils.sumTags([
          '0x000000000000000000000000000000000000000000000000000000000000000z',
          '0x0000000000000000000000000000000000000000000000000000000000000001',
        ]),
      ).toThrow('tag must be bytes32 hex string');
    });
  });

  describe('decryptResult()', () => {
    test('decrypts the result with a binary key', async () => {
      const encZip = await readFile(
        join(
          process.cwd(),
          'test/inputs/encryptedResults/encryptedResults.zip',
        ),
      );
      const beneficiaryKey = await readFile(
        join(process.cwd(), 'test/inputs/beneficiaryKeys/expected_key'),
      );
      const res = await utils.decryptResult(encZip, beneficiaryKey);
      const resContent = [];
      // eslint-disable-next-line sonarjs/no-unsafe-unzip
      const resZip = await new JSZip().loadAsync(res);
      resZip.forEach((relativePath, zipEntry) => {
        resContent.push(zipEntry);
      });
      expect(resContent.length).toBe(2);
      expect(resContent[0].name).toBe('computed.json');
      expect(resContent[1].name).toBe('result.txt');
    });

    test('decrypts legacy encrypted AES-128-ECB result with a binary key', async () => {
      const encZip = await readFile(
        join(
          process.cwd(),
          'test/inputs/encryptedResults/legacyEncryptedResults.zip',
        ),
      );
      const beneficiaryKey = await readFile(
        join(process.cwd(), 'test/inputs/beneficiaryKeys/legacy_expected_key'),
      );
      const res = await utils.decryptResult(encZip, beneficiaryKey);
      const resContent = [];
      // eslint-disable-next-line sonarjs/no-unsafe-unzip
      const resZip = await new JSZip().loadAsync(res);
      resZip.forEach((relativePath, zipEntry) => {
        resContent.push(zipEntry);
      });
      expect(resContent.length).toBe(3);
      expect(resContent[0].name).toBe('computed.json');
      expect(resContent[1].name).toBe('volume.fspf');
      expect(resContent[2].name).toBe('result.txt');
    });

    test('decrypts the result with a string key', async () => {
      const encZip = await readFile(
        join(
          process.cwd(),
          'test/inputs/encryptedResults/encryptedResults.zip',
        ),
      );
      const beneficiaryKey = (
        await readFile(
          join(process.cwd(), 'test/inputs/beneficiaryKeys/expected_key'),
        )
      ).toString();
      const res = await utils.decryptResult(encZip, beneficiaryKey);
      const resContent = [];
      // eslint-disable-next-line sonarjs/no-unsafe-unzip
      const resZip = await new JSZip().loadAsync(res);
      resZip.forEach((relativePath, zipEntry) => {
        resContent.push(zipEntry);
      });
      expect(resContent.length).toBe(2);
      expect(resContent[0].name).toBe('computed.json');
      expect(resContent[1].name).toBe('result.txt');
    });

    test('detects invalid key', async () => {
      const encZip = await readFile(
        join(
          process.cwd(),
          'test/inputs/encryptedResults/encryptedResults.zip',
        ),
      );
      const err = await utils.decryptResult(encZip, 'foo').catch((e) => e);
      expect(err).toEqual(Error('Invalid beneficiary key'));
    });

    test('fails to decrypt the result with the wrong key', async () => {
      const encZip = await readFile(
        join(
          process.cwd(),
          'test/inputs/encryptedResults/encryptedResults.zip',
        ),
      );
      const beneficiaryKey = await readFile(
        join(process.cwd(), 'test/inputs/beneficiaryKeys/unexpected_key'),
      );
      const err = await utils
        .decryptResult(encZip, beneficiaryKey)
        .catch((e) => e);
      expect(err).toEqual(
        new Error('Failed to decrypt results key with beneficiary key'),
      );
    });
  });

  describe('getSignerFromPrivateKey()', () => {
    const iexecTestChain = TEST_CHAINS['bellecour-fork'];
    const tokenTestChain = TEST_CHAINS['custom-token-chain'];

    test('gasPrice option allows to specify gasPrice', async () => {
      const gasPrice = '123456789';
      const wallet = getRandomWallet();
      const iexec = new IExec(
        {
          ethProvider: utils.getSignerFromPrivateKey(
            tokenTestChain.rpcURL,
            wallet.privateKey,
            {
              gasPrice,
            },
          ),
        },
        getTestConfigOptions(tokenTestChain)(),
      );
      await setBalance(tokenTestChain)(wallet.address, ONE_ETH);
      const txHash = await iexec.wallet.sendETH(0, wallet.address);
      const tx = await tokenTestChain.provider.getTransaction(txHash);
      expect(tx).toBeDefined();
      expect(tx.gasPrice.toString()).toBe(gasPrice);
    });

    test('getTransactionCount option allows custom nonce management', async () => {
      const wallet = getRandomWallet();

      const createNonceProvider = (address) => {
        const initNoncePromise = iexecTestChain.provider.getTransactionCount(
          address,
          'latest',
        );
        let i = 0;
        const getNonce = () =>
          initNoncePromise.then((initNonce) => initNonce + i);
        const increaseNonce = () => {
          i += 1;
        };
        return {
          getNonce,
          increaseNonce,
        };
      };

      const nonceProvider = createNonceProvider(wallet.address);

      const signer = utils.getSignerFromPrivateKey(
        iexecTestChain.rpcURL,
        wallet.privateKey,
        {
          getTransactionCount: nonceProvider.getNonce,
        },
      );

      const iexec = new IExec(
        {
          ethProvider: signer,
        },
        getTestConfigOptions(iexecTestChain)(),
      );

      const { registerTxHash: tx0 } = await iexec.ens.claimName(
        `name-${getId()}`,
      );
      expect(tx0).toBeTxHash();

      await expect(iexec.ens.claimName(`name-${getId()}`)).rejects.toThrow(
        'nonce too low',
      );

      nonceProvider.increaseNonce();

      const { registerTxHash: tx1 } = await iexec.ens.claimName(
        `name-${getId()}`,
      );
      expect(tx1).toBeTxHash();

      await expect(iexec.ens.claimName(`name-${getId()}`)).rejects.toThrow(
        'nonce too low',
      );

      nonceProvider.increaseNonce();

      const { registerTxHash: tx2 } = await iexec.ens.claimName(
        `name-${getId()}`,
      );
      expect(tx2).toBeTxHash();
    });

    test.skip('providers option allow passing JSON RPC API providers api keys', async () => {
      const providerOptions = {
        infura: INFURA_PROJECT_ID,
        alchemy: ALCHEMY_API_KEY,
        etherscan: ETHERSCAN_API_KEY,
      };
      const alchemyFailQuorumFail = {
        ...providerOptions,
        alchemy: 'FAIL',
        quorum: 3,
      };
      const alchemyFailQuorumPass = {
        ...providerOptions,
        alchemy: 'FAIL',
        quorum: 2,
      };
      const infuraFailQuorumFail = {
        ...providerOptions,
        infura: 'FAIL',
        quorum: 3,
      };
      const infuraFailQuorumPass = {
        ...providerOptions,
        infura: 'FAIL',
        quorum: 2,
      };
      const etherscanFailQuorumFail = {
        ...providerOptions,
        etherscan: 'FAIL',
        quorum: 3,
      };
      const etherscanFailQuorumPass = {
        ...providerOptions,
        etherscan: 'FAIL',
        quorum: 2,
      };
      await expect(
        new IExec({
          ethProvider: utils.getSignerFromPrivateKey(
            'mainnet',
            getRandomWallet().privateKey,
            {
              providers: alchemyFailQuorumFail,
            },
          ),
        }).wallet.checkBalances(NULL_ADDRESS),
      ).rejects.toThrow();
      await expect(
        new IExec({
          ethProvider: utils.getSignerFromPrivateKey(
            'mainnet',
            getRandomWallet().privateKey,
            {
              providers: alchemyFailQuorumPass,
            },
          ),
        }).wallet.checkBalances(NULL_ADDRESS),
      ).resolves.toBeDefined();
      await expect(
        new IExec({
          ethProvider: utils.getSignerFromPrivateKey(
            'mainnet',
            getRandomWallet().privateKey,
            {
              providers: etherscanFailQuorumFail,
            },
          ),
        }).wallet.checkBalances(NULL_ADDRESS),
      ).rejects.toThrow();
      await expect(
        new IExec({
          ethProvider: utils.getSignerFromPrivateKey(
            'mainnet',
            getRandomWallet().privateKey,
            {
              providers: etherscanFailQuorumPass,
            },
          ),
        }).wallet.checkBalances(NULL_ADDRESS),
      ).resolves.toBeDefined();
      await expect(
        new IExec({
          ethProvider: utils.getSignerFromPrivateKey(
            'mainnet',
            getRandomWallet().privateKey,
            {
              providers: infuraFailQuorumFail,
            },
          ),
        }).wallet.checkBalances(NULL_ADDRESS),
      ).rejects.toThrow();
      await expect(
        new IExec({
          ethProvider: utils.getSignerFromPrivateKey(
            'mainnet',
            getRandomWallet().privateKey,
            {
              providers: infuraFailQuorumPass,
            },
          ),
        }).wallet.checkBalances(NULL_ADDRESS),
      ).resolves.toBeDefined();
    });

    test('providers option is ignored with RPC host', async () => {
      const alchemyFailQuorumFail = {
        alchemy: 'FAIL',
        quorum: 3,
      };
      const infuraFailQuorumFail = {
        infura: 'FAIL',
        quorum: 3,
      };
      const etherscanFailQuorumFail = {
        etherscan: 'FAIL',
        quorum: 3,
      };
      await expect(
        new IExec(
          {
            ethProvider: utils.getSignerFromPrivateKey(
              tokenTestChain.rpcURL,
              getRandomWallet().privateKey,
              {
                providers: alchemyFailQuorumFail,
              },
            ),
          },
          getTestConfigOptions(tokenTestChain)(),
        ).wallet.checkBalances(NULL_ADDRESS),
      ).resolves.toBeDefined();
      await expect(
        new IExec(
          {
            ethProvider: utils.getSignerFromPrivateKey(
              tokenTestChain.rpcURL,
              getRandomWallet().privateKey,
              {
                providers: etherscanFailQuorumFail,
              },
            ),
          },
          getTestConfigOptions(tokenTestChain)(),
        ).wallet.checkBalances(NULL_ADDRESS),
      ).resolves.toBeDefined();
      await expect(
        new IExec(
          {
            ethProvider: utils.getSignerFromPrivateKey(
              tokenTestChain.rpcURL,
              getRandomWallet().privateKey,
              {
                providers: infuraFailQuorumFail,
              },
            ),
          },
          getTestConfigOptions(tokenTestChain)(),
        ).wallet.checkBalances(NULL_ADDRESS),
      ).resolves.toBeDefined();
    });
    test.skip('allowExperimentalNetworks option allow creating signer connected to an experimental network', async () => {
      expect(() =>
        utils.getSignerFromPrivateKey(
          'arbitrum-sepolia-testnet',
          getRandomWallet().privateKey,
        ),
      ).toThrowError('Invalid provider host name or url');

      const signer = utils.getSignerFromPrivateKey(
        'arbitrum-sepolia-testnet',
        getRandomWallet().privateKey,
        { allowExperimentalNetworks: true },
      );
      const nonce = await signer.getNonce();
      expect(nonce).toBe(0);
    });
  });
});
