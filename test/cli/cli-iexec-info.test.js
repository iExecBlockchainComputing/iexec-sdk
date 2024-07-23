// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import { TEST_CHAINS, execAsync } from '../test-utils.js';
import {
  globalSetup,
  globalTeardown,
  iexecPath,
  setChain,
} from './cli-test-utils.js';
import '../jest-setup.js';

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec info', () => {
  beforeAll(async () => {
    await globalSetup('cli-iexec-info');
    await setChain(testChain)();
  });
  afterAll(async () => {
    await globalTeardown();
  });
  test('iexec info', async () => {
    const raw = await execAsync(`${iexecPath} info --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.pocoVersion).toBeDefined();
    expect(res.host).toBe(testChain.rpcURL);
    expect(res.hubAddress).toBe(
      testChain.hubAddress || testChain.defaults.hubAddress
    );
    expect(res.appRegistryAddress).toBeDefined();
    expect(res.datasetRegistryAddress).toBeDefined();
    expect(res.workerpoolRegistryAddress).toBeDefined();
    expect(res.rlcAddress).toBeUndefined();
    expect(res.useNative).toBe(true);
  });

  test('iexec info --chain mainnet', async () => {
    const raw = await execAsync(`${iexecPath} info --raw --chain mainnet`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.host).toBe('default');
    expect(res.pocoVersion).toBeDefined();
    expect(res.hubAddress).toBe('0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f');
    expect(res.appRegistryAddress).toBe(
      '0xB1C52075b276f87b1834919167312221d50c9D16'
    );
    expect(res.datasetRegistryAddress).toBe(
      '0x799DAa22654128d0C64d5b79eac9283008158730'
    );
    expect(res.workerpoolRegistryAddress).toBe(
      '0xC76A18c78B7e530A165c5683CB1aB134E21938B4'
    );
    expect(res.rlcAddress).toBeDefined();
    expect(res.useNative).toBe(false);
  });
});
