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
  setWorkerpoolUniqueDescription,
} from './cli-test-utils.js';
import '../jest-setup.js';

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec voucher', () => {
  let userWallet;
  let voucherType;
  let voucherValue;
  let deployedAppAddress;
  let deployedDatasetAddress;
  let deployedWorkerpoolAddress;
  beforeAll(async () => {
    await globalSetup('cli-iexec-voucher');
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(testChain)();
    userWallet = await setRandomWallet();

    voucherType = await createVoucherType(testChain)({});
    voucherValue = 1000;
    await createVoucher(testChain)({
      owner: userWallet.address,
      voucherType,
      value: voucherValue,
    });
  });

  afterAll(async () => {
    await globalTeardown();
  });

  describe('show', () => {
    test('returns voucher details when user has one without sponsored assets', async () => {
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
      // deploy and add eligible assets (app, dataset, workerpool)
      await execAsync(`${iexecPath} app init`);
      await setAppUniqueName();
      const deployedApp = await runIExecCliRaw(`${iexecPath} app deploy`);
      deployedAppAddress = deployedApp.address;
      await addVoucherEligibleAsset(testChain)(deployedAppAddress, voucherType);

      await execAsync(`${iexecPath} dataset init`);
      await setDatasetUniqueName();
      const deployedDataset = await runIExecCliRaw(
        `${iexecPath} dataset deploy`,
      );
      deployedDatasetAddress = deployedDataset.address;
      await addVoucherEligibleAsset(testChain)(
        deployedDatasetAddress,
        voucherType,
      );

      await execAsync(`${iexecPath} workerpool init`);
      await setWorkerpoolUniqueDescription();
      const deployedWorkerpool = await runIExecCliRaw(
        `${iexecPath} workerpool deploy`,
      );
      deployedWorkerpoolAddress = deployedWorkerpool.address;
      await addVoucherEligibleAsset(testChain)(
        deployedWorkerpoolAddress,
        voucherType,
      );

      const requesterAddress = await getRandomAddress();
      await execAsync(
        `${iexecPath} voucher authorize ${requesterAddress} --raw`,
      );

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
      expect(res.authorizedAccounts).toEqual([requesterAddress]);
    });

    test('returns error when no voucher is found for the user', async () => {
      // use a new random wallet that doesn't have a voucher
      const newWallet = await setRandomWallet();
      const raw = await execAsync(`${iexecPath} voucher show --raw`).catch(
        (e) => e.message,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe(
        `No Voucher found for address ${newWallet.address}`,
      );
    });
  });

  describe('authorize', () => {
    let requesterAddress;

    beforeAll(async () => {
      userWallet = await setRandomWallet();
      voucherType = await createVoucherType(testChain)({});
      await createVoucher(testChain)({
        owner: userWallet.address,
        voucherType,
        value: 1000,
      });
      requesterAddress = await getRandomAddress();
    });

    beforeEach(async () => {
      requesterAddress = await getRandomAddress();
    });

    test('authorize the requester to use the voucher', async () => {
      const raw = await execAsync(
        `${iexecPath} voucher authorize ${requesterAddress} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.txHash).toBeDefined();
    });

    test('throw when requester is already authorized', async () => {
      await execAsync(
        `${iexecPath} voucher authorize ${requesterAddress} --raw`,
      );
      const raw = await execAsync(
        `${iexecPath} voucher authorize ${requesterAddress} --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe(
        `${requesterAddress} is already authorized`,
      );
    });

    test('throw when the user has no voucher', async () => {
      // use a new random wallet that doesn't have a voucher
      const newWallet = await setRandomWallet();
      const raw = await execAsync(
        `${iexecPath} voucher authorize ${requesterAddress} --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe(
        `No Voucher found for address ${newWallet.address}`,
      );
    });
  });

  describe('revoke', () => {
    let requesterAddress;

    beforeAll(async () => {
      userWallet = await setRandomWallet();
      voucherType = await createVoucherType(testChain)({});
      await createVoucher(testChain)({
        owner: userWallet.address,
        voucherType,
        value: 1000,
      });
      requesterAddress = await getRandomAddress();

      await execAsync(
        `${iexecPath} voucher authorize ${requesterAddress} --raw`,
      );
    });

    test('revoke the requester authorization to use the voucher', async () => {
      const raw = await execAsync(
        `${iexecPath} voucher revoke ${requesterAddress} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.txHash).toBeDefined();
    });

    test('throw when requester was not previously authorized', async () => {
      const newRequesterAddress = await getRandomAddress();

      const raw = await execAsync(
        `${iexecPath} voucher revoke ${newRequesterAddress} --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe(
        `${newRequesterAddress} is not authorized`,
      );
    });

    test('throw when the user has no voucher', async () => {
      // use a new random wallet that doesn't have a voucher
      const newWallet = await setRandomWallet();
      const raw = await execAsync(
        `${iexecPath} voucher revoke ${requesterAddress} --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe(
        `No Voucher found for address ${newWallet.address}`,
      );
    });
  });
});
