// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import {
  TEST_CHAINS,
  createVoucher,
  createVoucherType,
  getRandomAddress,
} from '../../test-utils.js';
import '../../jest-setup.js';
import { getTestConfig } from '../lib-test-utils.js';

const iexecTestChain = TEST_CHAINS['bellecour-fork'];

describe('voucher test utils', () => {
  test('createVoucherType should create a voucherType and return the id', async () => {
    const voucherTypeId = await createVoucherType(iexecTestChain)(
      'test voucher type',
      42,
    );
    expect(typeof voucherTypeId).toBe('bigint');
  });
  test('createVoucher should create a voucher and publish workerpool orders', async () => {
    const owner = getRandomAddress();
    const voucherTypeId = await createVoucherType(iexecTestChain)(
      'test voucher type',
      42,
    );

    await createVoucher(iexecTestChain)({
      owner,
      voucherType: voucherTypeId,
      value: 48n,
    });

    const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
    const debugWorkerpoolOrderbook =
      await iexec.orderbook.fetchWorkerpoolOrderbook({
        workerpool: 'debug-v8-bellecour.main.pools.iexec.eth',
        minTag: ['tee', 'scone'],
        requester: owner,
        isRequesterStrict: true,
      });
    expect(debugWorkerpoolOrderbook.count).toBeGreaterThan(0);
  });
});
