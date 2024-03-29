// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test } from '@jest/globals';
import { BN } from 'bn.js';
import { getTestConfig } from '../lib-test-utils';
import { TEST_CHAINS, adminCreateCategory } from '../../test-utils';
import '../../jest-setup';

const iexecTestChain = TEST_CHAINS['bellecour-fork'];

describe('hub', () => {
  describe('showCategory()', () => {
    test('anyone can show category', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const res = await iexec.hub.showCategory(0);
      expect(res).toStrictEqual({
        description: '{}',
        name: 'XS',
        workClockTimeRef: new BN(300),
      });
    });
  });
  describe('createCategory()', () => {
    test('admin can create category', async () => {
      const res = await adminCreateCategory(iexecTestChain)({
        description: 'foo',
        name: 'bar',
        workClockTimeRef: 10,
      });
      expect(res.catid).toBeDefined();
      expect(res.txHash).toBeDefined();
    });
  });
});
