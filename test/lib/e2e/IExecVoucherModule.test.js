// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { beforeAll, describe, test, expect } from '@jest/globals';
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
  let voucherType;
  beforeAll(async () => {
    voucherType = await createVoucherType(iexecTestChain)();
  });

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

  describe('authorizeRequester()', () => {
    test('requires a signer', async () => {
      const requester = getRandomAddress();
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
      await expect(iexec.voucher.authorizeRequester(requester)).rejects.toThrow(
        Error(
          'The current provider is not a signer, impossible to sign messages or transactions',
        ),
      );
    });

    test('requires the user owns a voucher', async () => {
      const requester = getRandomAddress();
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      await expect(iexec.voucher.authorizeRequester(requester)).rejects.toThrow(
        Error(`No Voucher found for address ${wallet.address}`),
      );
    });

    test('authorizes the requester to use the voucher', async () => {
      const requester = getRandomAddress();
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      await createVoucher(iexecTestChain)({
        owner: wallet.address,
        voucherType,
        value: 1000,
      });
      const res = await iexec.voucher.authorizeRequester(requester);
      expect(res).toBeTxHash();
    });
  });

  describe('revokeRequesterAuthorization()', () => {
    test('requires a signer', async () => {
      const requester = getRandomAddress();
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
      await expect(
        iexec.voucher.revokeRequesterAuthorization(requester),
      ).rejects.toThrow(
        Error(
          'The current provider is not a signer, impossible to sign messages or transactions',
        ),
      );
    });

    test('requires the user owns a voucher', async () => {
      const requester = getRandomAddress();
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      await expect(
        iexec.voucher.revokeRequesterAuthorization(requester),
      ).rejects.toThrow(
        Error(`No Voucher found for address ${wallet.address}`),
      );
    });

    test('revokes the requester authorization to use the voucher', async () => {
      const requester = getRandomAddress();
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      await createVoucher(iexecTestChain)({
        owner: wallet.address,
        voucherType,
        value: 1000,
      });
      const res = await iexec.voucher.revokeRequesterAuthorization(requester);
      expect(res).toBeTxHash();
    });
  });
});
