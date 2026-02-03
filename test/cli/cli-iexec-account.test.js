// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import { BN } from 'bn.js';
import {
  TEST_CHAINS,
  execAsync,
  getRandomAddress,
  getRandomWallet,
  setBalance,
} from '../test-utils.js';
import {
  globalSetup,
  globalTeardown,
  iexecPath,
  runIExecCliRaw,
  setChain,
  setRandomWallet,
  setWallet,
} from './cli-test-utils.js';
import '../jest-setup.js';

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec account', () => {
  let userWallet;

  beforeAll(async () => {
    await globalSetup('cli-iexec-account');
    // init the project
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(testChain)();
    userWallet = await setRandomWallet();
    await setBalance(testChain)(userWallet.address, 50n * 10n ** 18n);
  });

  afterAll(async () => {
    await globalTeardown();
  });

  describe('deposit', () => {
    test('1000 (nRLC)', async () => {
      const initialWalletBalance = new BN(
        JSON.parse(await execAsync(`${iexecPath} wallet show --raw`)).balance
          .nRLC,
      );
      const initialAccountBalance = new BN(
        JSON.parse(await execAsync(`${iexecPath} account show --raw`)).balance
          .stake,
      );
      const amount = '1000';
      const raw = await execAsync(
        `${iexecPath} account deposit ${amount} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.amount).toBe(amount);
      expect(res.txHash).toBeDefined();
      const tx = await testChain.provider.getTransaction(res.txHash);
      expect(tx).toBeDefined();
      expect(tx.gasPrice.toString()).toBe('0');

      const bnAmount = new BN(amount);
      const finalWalletBalance = new BN(
        JSON.parse(await execAsync(`${iexecPath} wallet show --raw`)).balance
          .nRLC,
      );
      const finalAccountBalance = new BN(
        JSON.parse(await execAsync(`${iexecPath} account show --raw`)).balance
          .stake,
      );
      expect(initialWalletBalance.sub(bnAmount).eq(finalWalletBalance)).toBe(
        true,
      );
      expect(initialAccountBalance.add(bnAmount).eq(finalAccountBalance)).toBe(
        true,
      );
    });

    test('10 RLC', async () => {
      const initialWalletBalance = new BN(
        JSON.parse(await execAsync(`${iexecPath} wallet show --raw`)).balance
          .nRLC,
      );
      const initialAccountBalance = new BN(
        JSON.parse(await execAsync(`${iexecPath} account show --raw`)).balance
          .stake,
      );
      const amount = '10';
      const raw = await execAsync(
        `${iexecPath} account deposit ${amount} RLC --raw`,
      );
      const res = JSON.parse(raw);
      const bnAmount = new BN(amount).mul(new BN('1000000000'));
      expect(res.ok).toBe(true);
      expect(res.amount).toBe(bnAmount.toString());
      expect(res.txHash).toBeDefined();
      const finalWalletBalance = new BN(
        JSON.parse(await execAsync(`${iexecPath} wallet show --raw`)).balance
          .nRLC,
      );
      const finalAccountBalance = new BN(
        JSON.parse(await execAsync(`${iexecPath} account show --raw`)).balance
          .stake,
      );
      expect(initialWalletBalance.sub(bnAmount).eq(finalWalletBalance)).toBe(
        true,
      );
      expect(initialAccountBalance.add(bnAmount).eq(finalAccountBalance)).toBe(
        true,
      );
    });
  });

  describe('show', () => {
    beforeAll(async () => {
      await runIExecCliRaw(`${iexecPath} account deposit 1`);
    });

    test('(user wallet)', async () => {
      const raw = await execAsync(`${iexecPath} account show --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.balance).toBeDefined();
      expect(res.balance.stake).not.toBe('0');
      expect(res.balance.locked).toBe('0');
    });

    test('[address]', async () => {
      const raw = await execAsync(
        `${iexecPath} account show ${getRandomAddress()} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.balance).toBeDefined();
      expect(res.balance.stake).toBe('0');
      expect(res.balance.locked).toBe('0');
    });

    test('--wallet-address <address> (missing wallet file)', async () => {
      const raw = await execAsync(
        `${iexecPath} account show --wallet-address ${getRandomAddress()} --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe(
        'Failed to load wallet address from keystore: Wallet file not found',
      );
      expect(res.error.name).toBe('Error');
      expect(res.balance).toBeUndefined();
    });
  });

  describe('withdraw', () => {
    beforeAll(async () => {
      await runIExecCliRaw(`${iexecPath} account deposit 6 RLC`);
    });

    test('500 (nRLC)', async () => {
      const initialWalletBalance = new BN(
        JSON.parse(await execAsync(`${iexecPath} wallet show --raw`)).balance
          .nRLC,
      );
      const initialAccountBalance = new BN(
        JSON.parse(await execAsync(`${iexecPath} account show --raw`)).balance
          .stake,
      );
      const amount = '500';
      const raw = await execAsync(
        `${iexecPath} account withdraw ${amount} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.amount).toBe(amount);
      expect(res.txHash).toBeDefined();
      const tx = await testChain.provider.getTransaction(res.txHash);
      expect(tx).toBeDefined();
      expect(tx.gasPrice.toString()).toBe('0');
      const bnAmount = new BN(amount);
      const finalWalletBalance = new BN(
        JSON.parse(await execAsync(`${iexecPath} wallet show --raw`)).balance
          .nRLC,
      );
      const finalAccountBalance = new BN(
        JSON.parse(await execAsync(`${iexecPath} account show --raw`)).balance
          .stake,
      );
      expect(initialWalletBalance.add(bnAmount).eq(finalWalletBalance)).toBe(
        true,
      );
      expect(initialAccountBalance.sub(bnAmount).eq(finalAccountBalance)).toBe(
        true,
      );
    });

    test('5 RLC', async () => {
      const initialWalletBalance = new BN(
        JSON.parse(await execAsync(`${iexecPath} wallet show --raw`)).balance
          .nRLC,
      );
      const initialAccountBalance = new BN(
        JSON.parse(await execAsync(`${iexecPath} account show --raw`)).balance
          .stake,
      );
      const amount = '5';
      const raw = await execAsync(
        `${iexecPath} account withdraw ${amount} RLC --raw`,
      );
      const res = JSON.parse(raw);
      const bnAmount = new BN(amount).mul(new BN('1000000000'));
      expect(res.ok).toBe(true);
      expect(res.amount).toBe(bnAmount.toString());
      expect(res.txHash).toBeDefined();
      const finalWalletBalance = new BN(
        JSON.parse(await execAsync(`${iexecPath} wallet show --raw`)).balance
          .nRLC,
      );
      const finalAccountBalance = new BN(
        JSON.parse(await execAsync(`${iexecPath} account show --raw`)).balance
          .stake,
      );
      expect(initialWalletBalance.add(bnAmount).eq(finalWalletBalance)).toBe(
        true,
      );
      expect(initialAccountBalance.sub(bnAmount).eq(finalAccountBalance)).toBe(
        true,
      );
    });
  });

  describe('approve', () => {
    beforeAll(async () => {
      await runIExecCliRaw(`${iexecPath} account deposit 6 RLC`);
    });

    test('500 (nRLC)', async () => {
      const amount = '500';
      const spender = getRandomAddress();
      const raw = await execAsync(
        `${iexecPath} account approve ${amount} ${spender} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.txHash).toBeDefined();
      const tx = await testChain.provider.getTransaction(res.txHash);
      expect(tx).toBeDefined();
      expect(tx.gasPrice.toString()).toBe('0');

      const raw1 = await execAsync(
        `${iexecPath} account allowance ${spender} --raw`,
      );
      const res1 = JSON.parse(raw1);
      const bnValue = new BN(res1.amount, 16);
      expect(res1.ok).toBe(true);
      expect(bnValue.toString()).toBe(amount);
    });

    test('5 RLC', async () => {
      const amount = '5';
      const spender = getRandomAddress();
      const raw = await execAsync(
        `${iexecPath} account approve ${amount} ${spender} RLC --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.txHash).toBeDefined();
      const tx = await testChain.provider.getTransaction(res.txHash);
      expect(tx).toBeDefined();
      expect(tx.gasPrice.toString()).toBe('0');

      const raw1 = await execAsync(
        `${iexecPath} account allowance ${spender} --raw`,
      );
      const res1 = JSON.parse(raw1);
      const bnValue = new BN(res1.amount, 16);
      expect(res1.ok).toBe(true);
      const nRLCAmount = BigInt(amount) * 10n ** 9n;
      expect(bnValue.toString()).toBe(nRLCAmount.toString());
    });
  });

  describe('allowance', () => {
    beforeAll(async () => {
      await runIExecCliRaw(`${iexecPath} account deposit 6 RLC`);
    });

    test('should return the allowed amount', async () => {
      const amount = '500';
      const spender = getRandomAddress();
      await execAsync(
        `${iexecPath} account approve ${amount} ${spender} --raw`,
      );
      const raw = await execAsync(
        `${iexecPath} account allowance ${spender} --raw`,
      );
      const res = JSON.parse(raw);
      const bnValue = new BN(res.amount, 16);
      expect(res.ok).toBe(true);
      expect(amount).toBe(bnValue.toString());
    });

    test('should return zero allowance if no approval exists', async () => {
      const spender = getRandomAddress();
      const raw = await execAsync(
        `${iexecPath} account allowance ${spender} --raw`,
      );
      const res = JSON.parse(raw);
      const bnValue = new BN(res.amount, 16);
      expect(res.ok).toBe(true);
      expect(bnValue.toNumber()).toBe(0);
    });

    test('should return the allowed amount for a specified user', async () => {
      const amount = '500';
      const spender = getRandomAddress();
      const { privateKey, address: owner } = getRandomWallet();
      await setWallet(privateKey);
      await execAsync(
        `${iexecPath} account approve ${amount} ${spender} --raw`,
      );

      const raw = await execAsync(
        `${iexecPath} account allowance ${spender} --user ${owner} --raw`,
      );
      const res = JSON.parse(raw);
      const bnValue = new BN(res.amount, 16);
      expect(res.ok).toBe(true);
      expect(bnValue.toString()).toBe(amount);
    });

    test('should return zero allowance if no approval exists for a specified user', async () => {
      const spender = getRandomAddress();
      const owner = getRandomAddress();
      const raw = await execAsync(
        `${iexecPath} account allowance ${spender} --user ${owner} --raw`,
      );
      const res = JSON.parse(raw);
      const bnValue = new BN(res.amount, 16);
      expect(res.ok).toBe(true);
      expect(bnValue.toNumber()).toBe(0);
    });
  });

  describe('revoke', () => {
    beforeAll(async () => {
      await runIExecCliRaw(`${iexecPath} account deposit 6 RLC`);
    });

    test('should revoke allowance and return zero amount', async () => {
      const amount = '500';
      const spender = getRandomAddress();

      // approve the spender
      const approveRaw = await execAsync(
        `${iexecPath} account approve ${amount} ${spender} --raw`,
      );
      const approveRes = JSON.parse(approveRaw);
      expect(approveRes.ok).toBe(true);
      expect(approveRes.txHash).toBeDefined();

      // check allowance after approval
      const allowanceRaw = await execAsync(
        `${iexecPath} account allowance ${spender} --raw`,
      );
      const allowanceRes = JSON.parse(allowanceRaw);
      const bnValueAfterApproval = new BN(allowanceRes.amount, 16);
      expect(allowanceRes.ok).toBe(true);
      expect(bnValueAfterApproval.toString()).toBe(amount);

      // revoke the spender's allowance
      const revokeRaw = await execAsync(
        `${iexecPath} account revoke ${spender} --raw`,
      );
      const revokeRes = JSON.parse(revokeRaw);
      expect(revokeRes.ok).toBe(true);
      expect(revokeRes.txHash).toBeDefined();

      // check allowance after revocation
      const allowanceRawAfterRevoke = await execAsync(
        `${iexecPath} account allowance ${spender} --raw`,
      );
      const allowanceResAfterRevoke = JSON.parse(allowanceRawAfterRevoke);
      const bnValueAfterRevoke = new BN(allowanceResAfterRevoke.amount, 16);
      expect(allowanceResAfterRevoke.ok).toBe(true);
      expect(bnValueAfterRevoke.toNumber()).toBe(0);
    });
  });
});
