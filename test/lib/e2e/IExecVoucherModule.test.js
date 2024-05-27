// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { beforeAll, describe, test, expect } from '@jest/globals';
import { getTestConfig } from '../lib-test-utils.js';
import {
  TEST_CHAINS,
  addEligibleAsset,
  authorizeAccount,
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
    voucherType = await createVoucherType(iexecTestChain)({});
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

  describe('showUserVoucher()', () => {
    test('throw error if user has no voucher', async () => {
      const owner = getRandomAddress();
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });

      await expect(iexec.voucher.showUserVoucher(owner)).rejects.toThrowError(
        'No voucher found for this user',
      );
    });

    test('throw error if owner address is not provided', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
      await expect(iexec.voucher.showUserVoucher()).rejects.toThrowError(
        'Missing parameter',
      );
    });

    test('throw error if user address is not a valid ethereum address', async () => {
      const owner = 'invalid_address';
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
      await expect(iexec.voucher.showUserVoucher(owner)).rejects.toThrowError(
        `${owner} is not a valid ethereum address`,
      );
    });

    test('returns voucher details when user has one', async () => {
      // initial setup
      const owner = getRandomAddress();
      const voucherValue = 1000;
      const voucherAddress = await createVoucher(iexecTestChain)({
        owner,
        voucherType,
        value: voucherValue,
      });

      // authorize an account for the voucher
      const accountAddress = getRandomAddress();
      await authorizeAccount(iexecTestChain)(voucherAddress, accountAddress);

      // add sponsored assets
      const voucherTypeId = '0';
      const appAddress = getRandomAddress();
      const datasetAddress = getRandomAddress();
      const workerpoolAddress = getRandomAddress();

      await addEligibleAsset(iexecTestChain)(appAddress, voucherTypeId, 'app');
      await addEligibleAsset(iexecTestChain)(
        datasetAddress,
        voucherTypeId,
        'dataset',
      );
      await addEligibleAsset(iexecTestChain)(
        workerpoolAddress,
        voucherTypeId,
        'workerpool',
      );

      // call the function and check the results
      const { iexec } = getTestConfig(iexecTestChain)();
      const userVoucher = await iexec.voucher.showUserVoucher(owner);

      expect(userVoucher.owner).toBe(owner);
      expect(userVoucher.address).toBe(voucherAddress);
      expect(userVoucher.balance).toEqual(BigInt(voucherValue));
      expect(typeof userVoucher.expirationTimestamp).toBe('bigint');
      expect(userVoucher.authorizedAccounts).toContainEqual({
        id: accountAddress.toLocaleLowerCase(),
      });
      // TODO : update test when we have EligibleAsset with type = 'app'| 'dataset' | 'workerpool'
      // expect(userVoucher.sponsoredApps).toContainEqual({ id: appAddress });
      // expect(userVoucher.sponsoredDatasets).toContainEqual({
      //   id: datasetAddress,
      // });
      // expect(userVoucher.sponsoredWorkerpools).toContainEqual({
      //   id: workerpoolAddress,
      // });
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

    test('throw when the requester is already authorized', async () => {
      const requester = getRandomAddress();
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      await createVoucher(iexecTestChain)({
        owner: wallet.address,
        voucherType,
        value: 1000,
      });
      await iexec.voucher.authorizeRequester(requester);
      await expect(iexec.voucher.authorizeRequester(requester)).rejects.toThrow(
        Error(`${requester} is already authorized`),
      );
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

    test('throw when the requester is not previously authorized', async () => {
      const requester = getRandomAddress();
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      await createVoucher(iexecTestChain)({
        owner: wallet.address,
        voucherType,
        value: 1000,
      });
      await expect(
        iexec.voucher.revokeRequesterAuthorization(requester),
      ).rejects.toThrow(Error(`${requester} is not authorized`));
    });

    test('revokes the requester authorization to use the voucher', async () => {
      const requester = getRandomAddress();
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      await createVoucher(iexecTestChain)({
        owner: wallet.address,
        voucherType,
        value: 1000,
      });
      await iexec.voucher.authorizeRequester(requester);
      const res = await iexec.voucher.revokeRequesterAuthorization(requester);
      expect(res).toBeTxHash();
    });
  });
});
