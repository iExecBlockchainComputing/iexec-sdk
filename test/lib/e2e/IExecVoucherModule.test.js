// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import { getTestConfig } from '../lib-test-utils.js';
import {
  TEST_CHAINS,
  createVoucher,
  createVoucherType,
  getRandomAddress,
} from '../../test-utils.js';
import '../../jest-setup.js';

const iexecTestChain = TEST_CHAINS['bellecour-fork'];
const unknownTestChain = TEST_CHAINS['custom-token-chain'];

describe('voucher', () => {
  describe('getVoucherAddress()', () => {
    test('requires voucherHubAddress to be configured', async () => {
      const owner = getRandomAddress();
      const { iexec } = getTestConfig(unknownTestChain)({ readOnly: true });
      await expect(iexec.voucher.getVoucherAddress(owner)).rejects.toThrow(
        Error(
          `voucherHubAddress option not set and no default value for your chain ${unknownTestChain.chainId}`,
        ),
      );
    });

    test('returns undefined if user has no voucher', async () => {
      const owner = getRandomAddress();
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
      const res = await iexec.voucher.getVoucherAddress(owner);
      expect(res).toBeUndefined();
    });

    test('returns voucher address when user has one', async () => {
      const owner = getRandomAddress();
      const voucherType = await createVoucherType(iexecTestChain)({});
      const voucherAddress = await createVoucher(iexecTestChain)({
        owner,
        voucherType,
        value: 1000,
      });
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
      const res = await iexec.voucher.getVoucherAddress(owner);
      expect(res).toBe(voucherAddress);
    });
  });
});
