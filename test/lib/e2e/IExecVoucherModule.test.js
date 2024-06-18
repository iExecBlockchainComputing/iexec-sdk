// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { beforeAll, describe, test, expect } from '@jest/globals';
import { BN } from 'bn.js';
import {
  deployRandomApp,
  deployRandomDataset,
  deployRandomWorkerpool,
  getTestConfig,
} from '../lib-test-utils.js';
import {
  TEST_CHAINS,
  addVoucherEligibleAsset,
  createVoucher,
  createVoucherType,
  getRandomAddress,
  getRandomWallet,
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
    test('requires voucherHubAddress to be configured', async () => {
      const owner = getRandomAddress();
      const { iexec } = getTestConfig(unknownTestChain)({
        readOnly: true,
        options: { voucherSubgraphURL: 'http://voucher-subgraph.iex.ec' },
      });
      await expect(iexec.voucher.showUserVoucher(owner)).rejects.toThrow(
        Error(
          `voucherHubAddress option not set and no default value for your chain ${unknownTestChain.chainId}`,
        ),
      );
    });

    test('requires voucherSubgraphURL to be configured', async () => {
      const owner = getRandomAddress();
      const { iexec } = getTestConfig(unknownTestChain)({
        readOnly: true,
        options: { voucherHubAddress: getRandomAddress() },
      });
      await expect(iexec.voucher.showUserVoucher(owner)).rejects.toThrow(
        Error(
          `voucherSubgraphURL option not set and no default value for your chain ${unknownTestChain.chainId}`,
        ),
      );
    });

    test('throw error if user has no voucher', async () => {
      const owner = getRandomAddress();
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });

      await expect(iexec.voucher.showUserVoucher(owner)).rejects.toThrowError(
        `No Voucher found for address ${owner}`,
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
      const voucherOwnerWallet = getRandomWallet();
      const { iexec } = getTestConfig(iexecTestChain)({
        privateKey: voucherOwnerWallet.privateKey,
      });
      const voucherValue = 1000;
      const voucherAddress = await createVoucher(iexecTestChain)({
        owner: voucherOwnerWallet.address,
        voucherType,
        value: voucherValue,
      });

      // authorize an account for the voucher
      const accountAddress = getRandomAddress();
      await iexec.voucher.authorizeRequester(accountAddress);
      const accountAddress1 = getRandomAddress();
      await iexec.voucher.authorizeRequester(accountAddress1);

      // add sponsored assets
      const { address: appAddress } = await deployRandomApp(iexec);
      const { address: appAddress1 } = await deployRandomApp(iexec);
      const { address: datasetAddress } = await deployRandomDataset(iexec);
      const { address: datasetAddress1 } = await deployRandomDataset(iexec);
      const { address: workerpoolAddress } =
        await deployRandomWorkerpool(iexec);
      const { address: workerpoolAddress1 } =
        await deployRandomWorkerpool(iexec);

      await addVoucherEligibleAsset(iexecTestChain)(appAddress, voucherType);
      await addVoucherEligibleAsset(iexecTestChain)(appAddress1, voucherType);
      await addVoucherEligibleAsset(iexecTestChain)(
        datasetAddress,
        voucherType,
      );
      await addVoucherEligibleAsset(iexecTestChain)(
        datasetAddress1,
        voucherType,
      );
      await addVoucherEligibleAsset(iexecTestChain)(
        workerpoolAddress,
        voucherType,
      );
      await addVoucherEligibleAsset(iexecTestChain)(
        workerpoolAddress1,
        voucherType,
      );

      // call the function and check the results
      const userVoucher = await iexec.voucher.showUserVoucher(
        voucherOwnerWallet.address,
      );

      expect(userVoucher.type).toBeInstanceOf(BN);
      expect(userVoucher.expirationTimestamp).toBeInstanceOf(BN);
      expect(userVoucher.balance).toBeInstanceOf(BN);
      expect(userVoucher.allowanceAmount).toBeInstanceOf(BN);
      expect(userVoucher.owner).toBe(voucherOwnerWallet.address);
      expect(userVoucher.address).toBe(voucherAddress);
      expect([...userVoucher.sponsoredApps].sort()).toEqual(
        [appAddress, appAddress1].sort(),
      );
      expect([...userVoucher.sponsoredDatasets].sort()).toEqual(
        [datasetAddress, datasetAddress1].sort(),
      );
      expect([...userVoucher.sponsoredWorkerpools].sort()).toEqual(
        [workerpoolAddress, workerpoolAddress1].sort(),
      );
      expect([...userVoucher.authorizedAccounts].sort()).toEqual(
        [accountAddress, accountAddress1].sort(),
      );
    });
  });

  describe('authorizeRequester()', () => {
    test('requires voucherHubAddress to be configured', async () => {
      const { iexec } = getTestConfig(unknownTestChain)();
      await expect(
        iexec.voucher.authorizeRequester(getRandomAddress()),
      ).rejects.toThrow(
        Error(
          `voucherHubAddress option not set and no default value for your chain ${unknownTestChain.chainId}`,
        ),
      );
    });

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
    test('requires voucherHubAddress to be configured', async () => {
      const { iexec } = getTestConfig(unknownTestChain)();
      await expect(
        iexec.voucher.revokeRequesterAuthorization(getRandomAddress()),
      ).rejects.toThrow(
        Error(
          `voucherHubAddress option not set and no default value for your chain ${unknownTestChain.chainId}`,
        ),
      );
    });

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
