// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest, describe, test } from '@jest/globals';
import { BN } from 'bn.js';
import { getTestConfig } from '../lib-test-utils';
import { TEST_CHAINS } from '../../test-utils';

const DEFAULT_TIMEOUT = 120000;
jest.setTimeout(DEFAULT_TIMEOUT);

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
      const { iexec } = getTestConfig(iexecTestChain)({
        privateKey: iexecTestChain.pocoAdminWallet.privateKey,
      });
      const res = await iexec.hub.createCategory({
        description: 'foo',
        name: 'bar',
        workClockTimeRef: 10,
      });
      expect(res.catid).toBeDefined();
      expect(res.txHash).toBeDefined();
    });
  });
});
