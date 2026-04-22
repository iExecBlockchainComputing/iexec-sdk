import { describe, test, expect } from '@jest/globals';
import { TEST_CHAINS, execAsync } from '../test-utils.js';
import {
  globalSetup,
  globalTeardown,
  iexecPath,
  setChain,
} from './cli-test-utils.js';
import '../jest-setup.js';

describe('iexec info', () => {
  beforeAll(async () => {
    await globalSetup('cli-iexec-info');
  });
  afterAll(async () => {
    await globalTeardown();
  });

  test('iexec info (arbitrum-sepolia)', async () => {
    const testChain = TEST_CHAINS['arbitrum-sepolia-fork'];
    await setChain(testChain)();
    const raw = await execAsync(`${iexecPath} info --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.pocoVersion).toBeDefined();
    expect(res.host).toBe(testChain.rpcURL);
    expect(res.hubAddress).toBe(
      testChain.hubAddress || testChain.defaults.hubAddress,
    );
    expect(res.appRegistryAddress).toBeDefined();
    expect(res.datasetRegistryAddress).toBeDefined();
    expect(res.workerpoolRegistryAddress).toBeDefined();
    expect(res.rlcAddress).toBeDefined();
  });

  test('iexec info --chain arbitrum-mainnet', async () => {
    const raw = await execAsync(
      `${iexecPath} info --raw --chain arbitrum-mainnet`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.host).toBe('default');
    expect(res.pocoVersion).toBeDefined();
    expect(res.rlcAddress).toBe('0xe649e6a1F2afc63ca268C2363691ceCAF75CF47C');
    expect(res.hubAddress).toBe('0x098bFCb1E50ebcA0BaA92C12eA0c3F045A1aD9f0');
    expect(res.appRegistryAddress).toBe(
      '0x9950D94fb074182ee93ff79A50Cd698C4983281F',
    );
    expect(res.datasetRegistryAddress).toBe(
      '0x07Cc4E1EA30dD02796795876509A3BfC5053128D',
    );
    expect(res.workerpoolRegistryAddress).toBe(
      '0xe3c13bb4A5068601c6A08041Cb50887B07B5F398',
    );
  });
});
