// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest, describe, test } from '@jest/globals';
import { BN } from 'bn.js';
import { ONE_ETH, ONE_RLC, getTestConfig } from '../lib-test-utils';
import {
  INFURA_PROJECT_ID,
  TEST_CHAINS,
  getRandomAddress,
  setBalance,
  setNRlcBalance,
  txHashRegex,
} from '../../test-utils';
import { IExec } from '../../../src/lib';

const DEFAULT_TIMEOUT = 120000;
jest.setTimeout(DEFAULT_TIMEOUT);

const iexecTestChain = TEST_CHAINS['bellecour-fork'];
const tokenTestChain = TEST_CHAINS['custom-token-chain'];

describe('account', () => {
  describe('checkBalance()', () => {
    test('shows account nRLC stake and locked balances', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      await setNRlcBalance(iexecTestChain)(wallet.address, 10);
      const { iexec: readOnlyIExec } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const initialBalance = await readOnlyIExec.account.checkBalance(
        wallet.address,
      );
      expect(initialBalance.stake).toBeInstanceOf(BN);
      expect(initialBalance.locked).toBeInstanceOf(BN);
      await iexec.account.deposit(5);
      const finalBalance = await readOnlyIExec.account.checkBalance(
        wallet.address,
      );
      expect(finalBalance.stake).toBeInstanceOf(BN);
      expect(finalBalance.locked).toBeInstanceOf(BN);
      expect(finalBalance.stake.sub(new BN(5)).eq(initialBalance.stake)).toBe(
        true,
      );
      expect(finalBalance.locked.eq(initialBalance.locked)).toBe(true);
    });
  });

  describe('checkBridgedBalance()', () => {
    describe('native chain', () => {
      test('expose bridged balances (mainnet) on bellecour', async () => {
        const iexec = new IExec(
          { ethProvider: 'bellecour' },
          { providerOptions: { infura: INFURA_PROJECT_ID } },
        );
        const res = await iexec.account.checkBridgedBalance(getRandomAddress());
        expect(res.stake).toBeInstanceOf(BN);
        expect(res.locked).toBeInstanceOf(BN);
      });

      describe('token chain', () => {
        test('expose bridged balances (bellecour) on mainnet', async () => {
          const iexec = new IExec({ ethProvider: 'mainnet' });
          const res = await iexec.account.checkBridgedBalance(
            getRandomAddress(),
          );
          expect(res.stake).toBeInstanceOf(BN);
          expect(res.locked).toBeInstanceOf(BN);
        });
      });
    });
  });

  describe('deposit()', () => {
    test('require a signer', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
      await expect(iexec.account.deposit(10)).rejects.toThrow(
        Error(
          'The current provider is not a signer, impossible to sign messages or transactions',
        ),
      );
    });

    test('prevents deposit 0', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      await expect(iexec.account.deposit(0)).rejects.toThrow(
        Error('Deposit amount must be greater than 0'),
      );
    });

    describe('native chain', () => {
      test('deposits native asset (1 nRLC = 10⁹ wei)', async () => {
        const { iexec, wallet } = getTestConfig(iexecTestChain)();
        await setNRlcBalance(iexecTestChain)(wallet.address, 10);
        const accountInitialBalance = await iexec.account.checkBalance(
          wallet.address,
        );
        const walletInitialBalance = await iexec.wallet.checkBalances(
          wallet.address,
        );
        const res = await iexec.account.deposit(5);
        const accountFinalBalance = await iexec.account.checkBalance(
          wallet.address,
        );
        const walletFinalBalance = await iexec.wallet.checkBalances(
          wallet.address,
        );
        expect(res.txHash).toMatch(txHashRegex);
        expect(res.amount).toBe('5');
        expect(
          accountFinalBalance.stake
            .sub(new BN(5))
            .eq(accountInitialBalance.stake),
        ).toBe(true);
        expect(
          walletFinalBalance.nRLC.add(new BN(5)).eq(walletInitialBalance.nRLC),
        ).toBe(true);
        expect(
          accountFinalBalance.locked.eq(accountInitialBalance.locked),
        ).toBe(true);
      });

      test('deposits specified unit', async () => {
        const { iexec, wallet } = getTestConfig(iexecTestChain)();
        await setNRlcBalance(iexecTestChain)(wallet.address, ONE_RLC);
        const accountInitialBalance = await iexec.account.checkBalance(
          wallet.address,
        );
        const walletInitialBalance = await iexec.wallet.checkBalances(
          wallet.address,
        );
        const res = await iexec.account.deposit('0.005 RLC');
        const accountFinalBalance = await iexec.account.checkBalance(
          wallet.address,
        );
        const walletFinalBalance = await iexec.wallet.checkBalances(
          wallet.address,
        );
        expect(res.txHash).toMatch(txHashRegex);
        expect(res.amount).toBe('5000000');
        expect(
          accountFinalBalance.stake
            .sub(new BN('5000000'))
            .eq(accountInitialBalance.stake),
        ).toBe(true);
        expect(
          walletFinalBalance.nRLC
            .add(new BN('5000000'))
            .eq(walletInitialBalance.nRLC),
        ).toBe(true);
        expect(
          accountFinalBalance.locked.eq(accountInitialBalance.locked),
        ).toBe(true);
      });

      test('fails if amount exceed wallet balance', async () => {
        const { iexec, wallet } = getTestConfig(iexecTestChain)();
        const accountInitialBalance = await iexec.account.checkBalance(
          wallet.address,
        );
        const walletInitialBalance = await iexec.wallet.checkBalances(
          wallet.address,
        );
        await expect(iexec.account.deposit(100)).rejects.toThrow(
          Error('Deposit amount exceed wallet balance'),
        );
        const accountFinalBalance = await iexec.account.checkBalance(
          wallet.address,
        );
        const walletFinalBalance = await iexec.wallet.checkBalances(
          wallet.address,
        );
        expect(accountFinalBalance.stake.eq(accountInitialBalance.stake)).toBe(
          true,
        );
        expect(walletFinalBalance.nRLC.eq(walletInitialBalance.nRLC)).toBe(
          true,
        );
        expect(
          accountFinalBalance.locked.eq(accountInitialBalance.locked),
        ).toBe(true);
      });
    });

    describe('token chain', () => {
      test('deposits ERC20', async () => {
        const { iexec, wallet } = getTestConfig(tokenTestChain)();
        await setNRlcBalance(tokenTestChain)(wallet.address, 10);
        await setBalance(tokenTestChain)(wallet.address, ONE_ETH);
        const accountInitialBalance = await iexec.account.checkBalance(
          wallet.address,
        );
        const walletInitialBalance = await iexec.wallet.checkBalances(
          wallet.address,
        );
        const res = await iexec.account.deposit(5);
        const accountFinalBalance = await iexec.account.checkBalance(
          wallet.address,
        );
        const walletFinalBalance = await iexec.wallet.checkBalances(
          wallet.address,
        );
        expect(res.txHash).toMatch(txHashRegex);
        expect(res.amount).toBe('5');
        expect(
          accountFinalBalance.stake
            .sub(new BN(5))
            .eq(accountInitialBalance.stake),
        ).toBe(true);
        expect(
          walletFinalBalance.nRLC.add(new BN(5)).eq(walletInitialBalance.nRLC),
        ).toBe(true);
        expect(
          accountFinalBalance.locked.eq(accountInitialBalance.locked),
        ).toBe(true);
      });

      test('fails if amount exceed wallet balance', async () => {
        const { iexec, wallet } = getTestConfig(tokenTestChain)();
        await setNRlcBalance(tokenTestChain)(wallet.address, 10);
        await setBalance(tokenTestChain)(wallet.address, ONE_ETH);
        const accountInitialBalance = await iexec.account.checkBalance(
          wallet.address,
        );
        const walletInitialBalance = await iexec.wallet.checkBalances(
          wallet.address,
        );
        await expect(iexec.account.deposit(100)).rejects.toThrow(
          Error('Deposit amount exceed wallet balance'),
        );
        const accountFinalBalance = await iexec.account.checkBalance(
          wallet.address,
        );
        const walletFinalBalance = await iexec.wallet.checkBalances(
          wallet.address,
        );
        expect(accountFinalBalance.stake.eq(accountInitialBalance.stake)).toBe(
          true,
        );
        expect(walletFinalBalance.nRLC.eq(walletInitialBalance.nRLC)).toBe(
          true,
        );
        expect(
          accountFinalBalance.locked.eq(accountInitialBalance.locked),
        ).toBe(true);
      });
    });
  });

  describe('withdraw()', () => {
    test('require a signer', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
      await expect(iexec.account.withdraw(10)).rejects.toThrow(
        Error(
          'The current provider is not a signer, impossible to sign messages or transactions',
        ),
      );
    });

    test('prevents withdraw 0', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      await expect(iexec.account.withdraw(0)).rejects.toThrow(
        Error('Withdraw amount must be greater than 0'),
      );
    });

    test('withdraws stacked nRLC', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      await setNRlcBalance(iexecTestChain)(wallet.address, 10);
      await iexec.account.deposit(10);
      const accountInitialBalance = await iexec.account.checkBalance(
        wallet.address,
      );
      const walletInitialBalance = await iexec.wallet.checkBalances(
        wallet.address,
      );
      const res = await iexec.account.withdraw(5);
      const accountFinalBalance = await iexec.account.checkBalance(
        wallet.address,
      );
      const walletFinalBalance = await iexec.wallet.checkBalances(
        wallet.address,
      );
      expect(res.txHash).toMatch(txHashRegex);
      expect(res.amount).toBe('5');
      expect(
        accountFinalBalance.stake
          .add(new BN(5))
          .eq(accountInitialBalance.stake),
      ).toBe(true);
      expect(
        walletFinalBalance.nRLC.sub(new BN(5)).eq(walletInitialBalance.nRLC),
      ).toBe(true);
      expect(accountFinalBalance.locked.eq(accountInitialBalance.locked)).toBe(
        true,
      );
    });

    test('withdraws specified unit', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      await setNRlcBalance(iexecTestChain)(wallet.address, 10000);
      await iexec.account.deposit(10000);
      const accountInitialBalance = await iexec.account.checkBalance(
        wallet.address,
      );
      const walletInitialBalance = await iexec.wallet.checkBalances(
        wallet.address,
      );
      const res = await iexec.account.withdraw('0.000005 RLC');
      const accountFinalBalance = await iexec.account.checkBalance(
        wallet.address,
      );
      const walletFinalBalance = await iexec.wallet.checkBalances(
        wallet.address,
      );
      expect(res.txHash).toMatch(txHashRegex);
      expect(res.amount).toBe('5000');
      expect(
        accountFinalBalance.stake
          .add(new BN(5000))
          .eq(accountInitialBalance.stake),
      ).toBe(true);
      expect(
        walletFinalBalance.nRLC.sub(new BN(5000)).eq(walletInitialBalance.nRLC),
      ).toBe(true);
      expect(accountFinalBalance.locked.eq(accountInitialBalance.locked)).toBe(
        true,
      );
    });

    test('fails if amount exceeds account balance)', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      await setNRlcBalance(iexecTestChain)(wallet.address, 10);
      await iexec.account.deposit(10);
      const accountInitialBalance = await iexec.account.checkBalance(
        wallet.address,
      );
      const walletInitialBalance = await iexec.wallet.checkBalances(
        wallet.address,
      );
      await expect(iexec.account.withdraw(100)).rejects.toThrow(
        Error('Withdraw amount exceed account balance'),
      );
      const accountFinalBalance = await iexec.account.checkBalance(
        wallet.address,
      );
      const walletFinalBalance = await iexec.wallet.checkBalances(
        wallet.address,
      );
      expect(accountFinalBalance.stake.eq(accountInitialBalance.stake)).toBe(
        true,
      );
      expect(walletFinalBalance.nRLC.eq(walletInitialBalance.nRLC)).toBe(true);
      expect(accountFinalBalance.locked.eq(accountInitialBalance.locked)).toBe(
        true,
      );
    });
  });
});
