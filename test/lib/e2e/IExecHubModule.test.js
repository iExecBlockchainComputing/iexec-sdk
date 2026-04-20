import { describe, test, expect } from '@jest/globals';
import { BN } from 'bn.js';
import { getTestConfig } from '../lib-test-utils.js';
import { TEST_CHAINS, adminCreateCategory } from '../../test-utils.js';
import '../../jest-setup.js';

const testChain = TEST_CHAINS['arbitrum-sepolia-fork'];

describe('hub', () => {
  describe('showCategory()', () => {
    test('anyone can show category', async () => {
      const { iexec } = await getTestConfig(testChain)();
      const res = await iexec.hub.showCategory(0);
      expect(res).toStrictEqual({
        description: '""',
        name: 'XS',
        workClockTimeRef: new BN(300),
      });
    });
  });
  describe('createCategory()', () => {
    test('admin can create category', async () => {
      const res = await adminCreateCategory(testChain)({
        description: 'foo',
        name: 'bar',
        workClockTimeRef: 10,
      });
      expect(res.catid).toBeDefined();
      expect(res.txHash).toBeDefined();
    });
  });
});
