// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test } from '@jest/globals';
import { TEST_CHAINS, execAsync } from '../test-utils';
import {
  globalSetup,
  globalTeardown,
  iexecPath,
  runIExecCliRaw,
  setChain,
  setChainsPocoAdminWallet,
  setRandomWallet,
} from './cli-test-utils';
import '../jest-setup';

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec category', () => {
  beforeAll(async () => {
    await globalSetup('cli-iexec-category');
    // init the project
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(testChain)();
  });
  afterAll(async () => {
    await globalTeardown();
  });
  describe('as user', () => {
    beforeAll(async () => {
      await setRandomWallet();
    });

    test('iexec category init', async () => {
      const raw = await execAsync(`${iexecPath} category init --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.category).toBeDefined();
    });

    test('iexec category create', async () => {
      const res = await runIExecCliRaw(`${iexecPath} category create --raw`);
      expect(res.ok).toBe(false);
      expect(res.catid).toBeUndefined();
      expect(res.txHash).toBeUndefined();
    });

    test('iexec category show 0', async () => {
      const raw = await execAsync(`${iexecPath} category show 0 --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.index).toBe('0');
      expect(res.category).toBeDefined();
    });

    test('iexec category count', async () => {
      const raw = await execAsync(`${iexecPath} category count --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.count).toBeDefined();
      expect(res.count).not.toBe('0');
    });
  });
  describe('as admin', () => {
    beforeAll(async () => {
      await setChainsPocoAdminWallet(testChain)();
    });

    test('[common] iexec category init', async () => {
      const raw = await execAsync(`${iexecPath} category init --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.category).toBeDefined();
    });

    test('iexec category create', async () => {
      const raw = await execAsync(`${iexecPath} category create --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.catid).toBeDefined();
      expect(res.txHash).toBeDefined();
      const tx = await testChain.provider.getTransaction(res.txHash);
      expect(tx).toBeDefined();
      expect(tx.gasPrice.toString()).toBe('0');
    });
  });
});
