// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import {
  TEST_CHAINS,
  execAsync,
  getRandomAddress,
  setBalance,
} from '../test-utils';
import {
  globalSetup,
  globalTeardown,
  iexecPath,
  setChain,
  setRandomWallet,
} from './cli-test-utils';

const DEFAULT_TIMEOUT = 120000;
jest.setTimeout(DEFAULT_TIMEOUT);

const testChain = TEST_CHAINS['custom-token-chain'];

describe('tx options', () => {
  let userWallet;

  beforeAll(async () => {
    await globalSetup('cli-tx-options');
    // init the project
    await execAsync(`${iexecPath} init --skip-wallet`);
    await setChain(testChain)();
    userWallet = await setRandomWallet();
    await setBalance(testChain)(userWallet.address, 50n * 10n ** 18n);
  });

  afterAll(async () => {
    await globalTeardown();
  });

  describe('--gas-price', () => {
    test('--gas-price 1000000001', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet send-ether 1 wei --to ${getRandomAddress()} --force --gas-price 1000000001 --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.txHash).toBeDefined();
      const tx = await testChain.provider.getTransaction(res.txHash);
      expect(tx).toBeDefined();
      expect(tx.gasPrice.toString()).toBe('1000000001');
    });

    test('--gas-price 0', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet send-ether 1 wei --to ${getRandomAddress()} --force --gas-price 0 --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.txHash).toBeDefined();
      const tx = await testChain.provider.getTransaction(res.txHash);
      expect(tx).toBeDefined();
      expect(tx.gasPrice.toString()).toBe('0');
    });

    test('--gas-price 1.1 gwei', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet send-ether 1 wei --to ${getRandomAddress()} --force --gas-price 1.1 gwei --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.txHash).toBeDefined();
      const tx = await testChain.provider.getTransaction(res.txHash);
      expect(tx).toBeDefined();
      expect(tx.gasPrice.toString()).toBe('1100000000');
    });

    test('--gas-price -1 (invalid gas-price)', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet send-ether 1 wei --to ${getRandomAddress()} --force --gas-price -1 --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.txHash).toBeUndefined();
      expect(res.error.message).toBe('-1 is not a valid amount');
    });

    test('--gas-price 0.1 wei (invalid gas-price)', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet send-ether 1 wei --to ${getRandomAddress()} --force --gas-price 0.1 wei --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.txHash).toBeUndefined();
      expect(res.error.message).toBe('0.1 wei is not a valid amount');
    });

    test('--gas-price 1 ethereum (invalid gas-price)', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet send-ether 1 wei --to ${getRandomAddress()} --force --gas-price 1 ethereum --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.txHash).toBeUndefined();
      expect(res.error.message).toBe('1 ethereum is not a valid amount');
    });
  });
});
