// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import {
  TEST_CHAINS,
  addVoucherEligibleAsset,
  createVoucher,
  createVoucherType,
  execAsync,
  getRandomAddress,
  setBalance,
} from '../test-utils.js';
import {
  globalSetup,
  globalTeardown,
  iexecPath,
  runIExecCliRaw,
  setAppUniqueName,
  setChain,
  setDatasetUniqueName,
  setRandomWallet,
} from './cli-test-utils.js';
import '../jest-setup.js';

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec voucher', () => {
  let userWallet;

  beforeAll(async () => {
    await globalSetup('cli-iexec-account');
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(testChain)();
    userWallet = await setRandomWallet();
    await setBalance(testChain)(userWallet.address, 50n * 10n ** 18n);
  });

  afterAll(async () => {
    await globalTeardown();
  });

  describe('show', () => {
    beforeAll(async () => {
      await runIExecCliRaw(`${iexecPath} account deposit 1`);
    });

    test('returns error when no voucher is found for the user', async () => {
      const raw = await execAsync(`${iexecPath} voucher show --raw`).catch(
        (e) => e.message,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe(
        `No Voucher found for address ${userWallet.address}`,
      );
    });

    test('returns voucher details when user has one without sponsored assets', async () => {
      const voucherType = await createVoucherType(testChain)({});
      const voucherValue = 1000;
      await createVoucher(testChain)({
        owner: userWallet.address,
        voucherType,
        value: voucherValue,
      });
      const raw = await execAsync(`${iexecPath} voucher show --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBeDefined();
      expect(parseInt(res.balance, 16)).toBe(Number(voucherValue));
      expect(parseInt(res.type, 16)).toBe(Number(voucherType));
      expect(res.owner).toBe(userWallet.address);
      expect(res.expirationTimestamp).toBeDefined();
      expect(res.allowanceAmount).toBeDefined();
      expect(res.sponsoredApps).toEqual([]);
      expect(res.sponsoredDatasets).toEqual([]);
      expect(res.sponsoredWorkerpools).toEqual([]);
      expect(res.authorizedAccounts).toEqual([]);
    });

    test('returns voucher details when user has one with sponsored assets', async () => {
      const voucherType = await createVoucherType(testChain)({});
      const voucherValue = 1000;
      await createVoucher(testChain)({
        owner: userWallet.address,
        voucherType,
        value: voucherValue,
      });

      await execAsync(`${iexecPath} app init`);
      await setAppUniqueName();
      const deployedApp = await runIExecCliRaw(`${iexecPath} app deploy`);
      const deployedAppAddress = deployedApp.address;
      await addVoucherEligibleAsset(testChain)(deployedAppAddress, voucherType);

      await execAsync(`${iexecPath} dataset init`);
      await setDatasetUniqueName();
      const deployedDataset = await runIExecCliRaw(
        `${iexecPath} dataset deploy`,
      );
      const deployedDatasetAddress = deployedDataset.address;
      await addVoucherEligibleAsset(testChain)(
        deployedDatasetAddress,
        voucherType,
      );

      await execAsync(`${iexecPath} workerpool init`);
      await setDatasetUniqueName();
      const deployedWorkerpool = await runIExecCliRaw(
        `${iexecPath} workerpool deploy`,
      );
      const deployedWorkerpoolAddress = deployedWorkerpool.address;
      await addVoucherEligibleAsset(testChain)(
        deployedWorkerpoolAddress,
        voucherType,
      );

      // TODO : enable when `iexec voucher authorize` est implimenté
      // const requesterAddress = await getRandomAddress();
      // await execAsync(
      //   `${iexecPath} iexec voucher authorize ${requesterAddress} --raw`,
      // );

      const raw = await execAsync(`${iexecPath} voucher show --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBeDefined();
      expect(parseInt(res.balance, 16)).toBe(Number(voucherValue));
      expect(parseInt(res.type, 16)).toBe(Number(voucherType));
      expect(res.owner).toBe(userWallet.address);
      expect(res.expirationTimestamp).toBeDefined();
      expect(res.allowanceAmount).toBeDefined();
      expect(res.sponsoredApps).toEqual([deployedAppAddress]);
      expect(res.sponsoredDatasets).toEqual([deployedDatasetAddress]);
      expect(res.sponsoredWorkerpools).toEqual([deployedWorkerpoolAddress]);

      // TODO : enable when `iexec voucher authorize` est implimenté
      // expect(res.authorizedAccounts).toEqual([requesterAddress]);
    });
  });
});
