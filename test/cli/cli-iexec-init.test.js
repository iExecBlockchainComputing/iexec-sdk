// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import { TEST_CHAINS, execAsync } from '../test-utils.js';
import {
  checkExists,
  globalSetup,
  globalTeardown,
  iexecPath,
  setChain,
} from './cli-test-utils.js';
import '../jest-setup.js';

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec init', () => {
  beforeAll(async () => {
    await globalSetup('cli-iexec-init');
    await setChain(testChain)();
  });
  afterAll(async () => {
    await globalTeardown();
  });

  test('iexec init', async () => {
    await execAsync('rm iexec.json').catch(() => {});
    await execAsync('rm chain.json').catch(() => {});
    await execAsync('rm -rf datasets').catch(() => {});
    await execAsync('rm -rf .secrets').catch(() => {});
    const raw = await execAsync(
      `${iexecPath} init --password test --force --raw`
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.walletAddress).toBeDefined();
    expect(res.walletFile).toBeDefined();
    expect(res.configFile).toBe('iexec.json');
    expect(res.chainConfigFile).toBe('chain.json');
    expect(await checkExists('iexec.json')).toBe(true);
    expect(await checkExists('chain.json')).toBe(true);
  });

  test('iexec init --skip-wallet', async () => {
    await execAsync('rm iexec.json').catch(() => {});
    await execAsync('rm chain.json').catch(() => {});
    await execAsync('rm -rf datasets').catch(() => {});
    await execAsync('rm -rf .secrets').catch(() => {});
    const raw = await execAsync(
      `${iexecPath} init --skip-wallet --force --raw`
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.walletAddress).toBeUndefined();
    expect(res.walletFile).toBeUndefined();
    expect(res.configFile).toBe('iexec.json');
    expect(res.chainConfigFile).toBe('chain.json');
    expect(await checkExists('iexec.json')).toBe(true);
    expect(await checkExists('chain.json')).toBe(true);
  });
});
