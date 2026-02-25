import { describe, test, expect } from '@jest/globals';
import { BN } from 'bn.js';
import { ONE_ETH, ONE_RLC, getTestConfig } from '../lib-test-utils.js';
import {
  DEFAULT_PROVIDER_OPTIONS,
  TEST_CHAINS,
  getRandomAddress,
  getRandomWallet,
  setBalance,
  setNRlcBalance,
} from '../../test-utils.js';
import '../../jest-setup.js';
import { IExec } from '../../../src/lib/index.js';

const testChain = TEST_CHAINS['arbitrum-sepolia-fork'];
const tokenTestChain = TEST_CHAINS['arbitrum-sepolia-fork'];
const nativeTestChain = TEST_CHAINS['bellecour-fork'];

describe('wallet', () => {
  describe('getAddress()', () => {
    test('expose connected wallet', async () => {
      const { iexec, wallet } = await getTestConfig(testChain)();
      const res = await iexec.wallet.getAddress();
      expect(res).toBe(wallet.address);
    });
    test('require a signer', async () => {
      const { iexec } = await getTestConfig(testChain)({
        readOnly: true,
      });
      await expect(iexec.wallet.getAddress()).rejects.toThrow(
        new Error('Missing Signer'),
      );
    });
  });

  describe('checkBalances()', () => {
    describe('native chain', () => {
      test('expose nRLC (as 10⁹ wei)', async () => {
        const { iexec } = await getTestConfig(nativeTestChain)({
          readOnly: true,
        });
        const address = getRandomAddress();
        await setNRlcBalance(nativeTestChain)(address, 1000);
        const balance = await iexec.wallet.checkBalances(address);
        expect(balance.nRLC).toBeInstanceOf(BN);
        expect(balance.wei).toBeInstanceOf(BN);
        expect(balance.nRLC).toStrictEqual(new BN(1000));
        expect(balance.wei).toStrictEqual(new BN(1000n * 10n ** 9n));
      });
    });

    describe('token chain', () => {
      test('expose wei and nRLC', async () => {
        const { iexec } = await getTestConfig(tokenTestChain)({
          readOnly: true,
        });
        const address = getRandomAddress();
        await setBalance(tokenTestChain)(address, 1000);
        const balance = await iexec.wallet.checkBalances(address);
        expect(balance.nRLC).toBeInstanceOf(BN);
        expect(balance.wei).toBeInstanceOf(BN);
        expect(balance.nRLC).toStrictEqual(new BN(0));
        expect(balance.wei).toStrictEqual(new BN(1000));
      });
    });
  });

  describe('checkBridgedBalances()', () => {
    describe('native chain', () => {
      test('expose bridged balances (mainnet) on bellecour', async () => {
        const iexec = new IExec(
          { ethProvider: 'bellecour' },
          {
            providerOptions: DEFAULT_PROVIDER_OPTIONS,
          },
        );
        const address = getRandomAddress();
        const balance = await iexec.wallet.checkBridgedBalances(address);
        expect(balance.nRLC).toBeInstanceOf(BN);
        expect(balance.wei).toBeInstanceOf(BN);
        expect(balance.nRLC).toStrictEqual(new BN(0));
        expect(balance.wei).toStrictEqual(new BN(0));
      });
    });
    describe('token chain', () => {
      test('expose bridged balances (bellecour) on mainnet', async () => {
        const iexec = new IExec(
          { ethProvider: 'mainnet' },
          {
            providerOptions: DEFAULT_PROVIDER_OPTIONS,
          },
        );
        const address = getRandomAddress();
        const balance = await iexec.wallet.checkBridgedBalances(address);
        expect(balance.nRLC).toStrictEqual(new BN(0));
        expect(balance.wei).toStrictEqual(new BN(0));
      });
    });
  });

  describe('sendETH()', () => {
    test('require a signer', async () => {
      const { iexec } = await getTestConfig(tokenTestChain)({ readOnly: true });
      await expect(
        iexec.wallet.sendETH(10, getRandomAddress()),
      ).rejects.toThrow(
        new Error(
          'The current provider is not a signer, impossible to sign messages or transactions',
        ),
      );
    });

    describe('token chain', () => {
      test('sends wei', async () => {
        const receiverAddress = getRandomAddress();
        const { iexec, wallet } = await getTestConfig(tokenTestChain)();
        await setBalance(tokenTestChain)(wallet.address, ONE_ETH);
        const initialBalance = await iexec.wallet.checkBalances(wallet.address);
        const receiverInitialBalance =
          await iexec.wallet.checkBalances(receiverAddress);
        const txHash = await iexec.wallet.sendETH(5, receiverAddress);
        const finalBalance = await iexec.wallet.checkBalances(wallet.address);
        const receiverFinalBalance =
          await iexec.wallet.checkBalances(receiverAddress);
        expect(txHash).toBeTxHash();
        expect(finalBalance.wei.add(new BN(5)).lt(initialBalance.wei)).toBe(
          true,
        );
        expect(finalBalance.nRLC.eq(initialBalance.nRLC)).toBe(true);
        expect(
          receiverFinalBalance.wei.eq(
            receiverInitialBalance.wei.add(new BN(5)),
          ),
        ).toBe(true);
        expect(receiverFinalBalance.nRLC.eq(receiverInitialBalance.nRLC)).toBe(
          true,
        );
      });

      test('sends specified unit', async () => {
        const receiverAddress = getRandomAddress();
        const { iexec, wallet } = await getTestConfig(tokenTestChain)();
        await setBalance(tokenTestChain)(wallet.address, ONE_ETH);
        const initialBalance = await iexec.wallet.checkBalances(wallet.address);
        const receiverInitialBalance =
          await iexec.wallet.checkBalances(receiverAddress);
        const txHash = await iexec.wallet.sendETH('0.5 gwei', receiverAddress);
        const finalBalance = await iexec.wallet.checkBalances(wallet.address);
        const receiverFinalBalance =
          await iexec.wallet.checkBalances(receiverAddress);
        expect(txHash).toBeTxHash();
        expect(
          finalBalance.wei.add(new BN('500000000')).lt(initialBalance.wei),
        ).toBe(true);
        expect(finalBalance.nRLC.eq(initialBalance.nRLC)).toBe(true);
        expect(
          receiverFinalBalance.wei.eq(
            receiverInitialBalance.wei.add(new BN('500000000')),
          ),
        ).toBe(true);
        expect(receiverFinalBalance.nRLC.eq(receiverInitialBalance.nRLC)).toBe(
          true,
        );
      });
    });

    describe('native chain', () => {
      test('throw on native chain', async () => {
        const receiverAddress = getRandomAddress();
        const { iexec } = await getTestConfig(nativeTestChain)();
        await expect(iexec.wallet.sendETH(10, receiverAddress)).rejects.toThrow(
          new Error('sendETH() is disabled on sidechain, use sendRLC()'),
        );
      });
    });
  });

  describe('sendRLC()', () => {
    test('require a signer', async () => {
      const { iexec } = await getTestConfig(testChain)({ readOnly: true });
      await expect(
        iexec.wallet.sendRLC(10, getRandomAddress()),
      ).rejects.toThrow(
        new Error(
          'The current provider is not a signer, impossible to sign messages or transactions',
        ),
      );
    });

    describe('native chain', () => {
      test('sends nRLC', async () => {
        const receiverAddress = getRandomAddress();
        const { iexec, wallet } = await getTestConfig(nativeTestChain)();
        await setNRlcBalance(nativeTestChain)(wallet.address, ONE_RLC);
        const initialBalance = await iexec.wallet.checkBalances(wallet.address);
        const receiverInitialBalance =
          await iexec.wallet.checkBalances(receiverAddress);
        const txHash = await iexec.wallet.sendRLC(5, receiverAddress);
        const finalBalance = await iexec.wallet.checkBalances(wallet.address);
        const receiverFinalBalance =
          await iexec.wallet.checkBalances(receiverAddress);
        expect(txHash).toBeTxHash();
        expect(finalBalance.nRLC.add(new BN(5)).eq(initialBalance.nRLC)).toBe(
          true,
        );
        expect(
          finalBalance.wei
            .add(new BN(5).mul(new BN(1000000000)))
            .eq(initialBalance.wei),
        ).toBe(true);
        expect(
          receiverFinalBalance.nRLC
            .sub(new BN(5))
            .eq(receiverInitialBalance.nRLC),
        ).toBe(true);
        expect(
          receiverFinalBalance.wei
            .sub(new BN(5).mul(new BN(1000000000)))
            .eq(receiverInitialBalance.wei),
        ).toBe(true);
      });

      test('sends specified unit', async () => {
        const receiverAddress = getRandomAddress();
        const { iexec, wallet } = await getTestConfig(nativeTestChain)();
        await setNRlcBalance(nativeTestChain)(wallet.address, ONE_RLC);
        const initialBalance = await iexec.wallet.checkBalances(wallet.address);
        const receiverInitialBalance =
          await iexec.wallet.checkBalances(receiverAddress);
        const txHash = await iexec.wallet.sendRLC(
          '0.000005 RLC',
          receiverAddress,
        );
        const finalBalance = await iexec.wallet.checkBalances(wallet.address);
        const receiverFinalBalance =
          await iexec.wallet.checkBalances(receiverAddress);
        expect(txHash).toBeTxHash();
        expect(
          finalBalance.nRLC.add(new BN(5000)).eq(initialBalance.nRLC),
        ).toBe(true);
        expect(
          finalBalance.wei
            .add(new BN(5000).mul(new BN(1000000000)))
            .eq(initialBalance.wei),
        ).toBe(true);
        expect(
          receiverFinalBalance.nRLC
            .sub(new BN(5000))
            .eq(receiverInitialBalance.nRLC),
        ).toBe(true);
        expect(
          receiverFinalBalance.wei
            .sub(new BN(5000).mul(new BN(1000000000)))
            .eq(receiverInitialBalance.wei),
        ).toBe(true);
      });
    });

    describe('token chain', () => {
      test('sends nRLC', async () => {
        const receiverAddress = getRandomAddress();
        const { iexec, wallet } = await getTestConfig(tokenTestChain)();
        await setNRlcBalance(tokenTestChain)(wallet.address, 100);
        await setBalance(tokenTestChain)(wallet.address, ONE_ETH);
        const initialBalance = await iexec.wallet.checkBalances(wallet.address);
        const receiverInitialBalance =
          await iexec.wallet.checkBalances(receiverAddress);
        const txHash = await iexec.wallet.sendRLC(5, receiverAddress);
        const finalBalance = await iexec.wallet.checkBalances(wallet.address);
        const receiverFinalBalance =
          await iexec.wallet.checkBalances(receiverAddress);
        expect(txHash).toBeTxHash();
        expect(finalBalance.wei.lt(initialBalance.wei)).toBe(true);
        expect(finalBalance.nRLC.add(new BN(5)).eq(initialBalance.nRLC)).toBe(
          true,
        );
        expect(receiverFinalBalance.wei.eq(receiverInitialBalance.wei)).toBe(
          true,
        );
        expect(
          receiverFinalBalance.nRLC.eq(
            receiverInitialBalance.nRLC.add(new BN(5)),
          ),
        ).toBe(true);
      });

      test('sends specified unit', async () => {
        const receiverAddress = getRandomAddress();
        const { iexec, wallet } = await getTestConfig(tokenTestChain)();
        await setNRlcBalance(tokenTestChain)(wallet.address, ONE_RLC);
        await setBalance(tokenTestChain)(wallet.address, ONE_ETH);
        const initialBalance = await iexec.wallet.checkBalances(wallet.address);
        const receiverInitialBalance =
          await iexec.wallet.checkBalances(receiverAddress);
        const txHash = await iexec.wallet.sendRLC('0.5 RLC', receiverAddress);
        const finalBalance = await iexec.wallet.checkBalances(wallet.address);
        const receiverFinalBalance =
          await iexec.wallet.checkBalances(receiverAddress);
        expect(txHash).toBeTxHash();
        expect(finalBalance.wei.lt(initialBalance.wei)).toBe(true);
        expect(
          finalBalance.nRLC.add(new BN('500000000')).eq(initialBalance.nRLC),
        ).toBe(true);
        expect(receiverFinalBalance.wei.eq(receiverInitialBalance.wei)).toBe(
          true,
        );
        expect(
          receiverFinalBalance.nRLC.eq(
            receiverInitialBalance.nRLC.add(new BN('500000000')),
          ),
        ).toBe(true);
      });
    });
  });
  describe('sweep()', () => {
    describe('native chain', () => {
      test('sweeps native nRLC', async () => {
        const receiverWallet = getRandomWallet();
        const { iexec, wallet: sweeperWallet } =
          await getTestConfig(nativeTestChain)();
        await setBalance(nativeTestChain)(sweeperWallet.address, ONE_ETH);
        await setNRlcBalance(nativeTestChain)(sweeperWallet.address, ONE_RLC);
        const initialBalance = await iexec.wallet.checkBalances(
          sweeperWallet.address,
        );
        const receiverInitialBalance = await iexec.wallet.checkBalances(
          receiverWallet.address,
        );
        const res = await iexec.wallet.sweep(receiverWallet.address);
        const finalBalance = await iexec.wallet.checkBalances(
          sweeperWallet.address,
        );
        const receiverFinalBalance = await iexec.wallet.checkBalances(
          receiverWallet.address,
        );
        expect(res.sendNativeTxHash).toBeTxHash();
        expect(res.sendERC20TxHash).toBeUndefined();
        expect(initialBalance.wei.gt(new BN(0))).toBe(true);
        expect(initialBalance.nRLC.gt(new BN(0))).toBe(true);
        expect(finalBalance.wei.eq(new BN(0))).toBe(true);
        expect(finalBalance.nRLC.eq(new BN(0))).toBe(true);
        expect(
          receiverFinalBalance.wei
            .sub(initialBalance.wei)
            .eq(receiverInitialBalance.wei),
        ).toBe(true);
        expect(
          receiverFinalBalance.nRLC
            .sub(initialBalance.nRLC)
            .eq(receiverInitialBalance.nRLC),
        ).toBe(true);
      });
    });

    describe('token chain', () => {
      test('sweeps wei and nRLC', async () => {
        const receiverWallet = getRandomWallet();
        const { iexec, wallet: sweeperWallet } =
          await getTestConfig(tokenTestChain)();
        await setBalance(tokenTestChain)(sweeperWallet.address, ONE_ETH);
        await setNRlcBalance(tokenTestChain)(sweeperWallet.address, ONE_RLC);

        const initialBalance = await iexec.wallet.checkBalances(
          sweeperWallet.address,
        );
        const receiverInitialBalance = await iexec.wallet.checkBalances(
          receiverWallet.address,
        );
        const res = await iexec.wallet.sweep(receiverWallet.address);
        const finalBalance = await iexec.wallet.checkBalances(
          sweeperWallet.address,
        );
        const receiverFinalBalance = await iexec.wallet.checkBalances(
          receiverWallet.address,
        );
        expect(res.sendNativeTxHash).toBeTxHash();
        expect(res.sendERC20TxHash).toBeTxHash();
        expect(initialBalance.wei.gt(new BN(0))).toBe(true);
        expect(initialBalance.nRLC.gt(new BN(0))).toBe(true);
        expect(finalBalance.wei.eq(new BN(0))).toBe(true);
        expect(finalBalance.nRLC.eq(new BN(0))).toBe(true);
        expect(receiverFinalBalance.wei.gt(receiverInitialBalance.wei)).toBe(
          true,
        );
        expect(
          receiverFinalBalance.nRLC
            .sub(initialBalance.nRLC)
            .eq(receiverInitialBalance.nRLC),
        ).toBe(true);
      });

      test('stop when ERC20 transfer fails', async () => {
        const receiverWallet = getRandomWallet();
        const { iexec, wallet: sweeperWallet } =
          await getTestConfig(tokenTestChain)();
        await setNRlcBalance(tokenTestChain)(sweeperWallet.address, ONE_RLC);
        await setBalance(tokenTestChain)(sweeperWallet.address, 1);
        const initialBalance = await iexec.wallet.checkBalances(
          sweeperWallet.address,
        );
        const receiverInitialBalance = await iexec.wallet.checkBalances(
          receiverWallet.address,
        );
        await expect(
          iexec.wallet.sweep(receiverWallet.address),
        ).rejects.toThrow(
          'Failed to sweep ERC20, sweep aborted. errors: Failed to transfer ERC20: ', // reason message exposed may differ from a ethereum client to another
        );
        const finalBalance = await iexec.wallet.checkBalances(
          sweeperWallet.address,
        );
        const receiverFinalBalance = await iexec.wallet.checkBalances(
          receiverWallet.address,
        );
        expect(initialBalance.wei.gt(new BN(0))).toBe(true);
        expect(initialBalance.nRLC.gt(new BN(0))).toBe(true);
        expect(finalBalance.wei.eq(initialBalance.wei)).toBe(true);
        expect(finalBalance.nRLC.eq(initialBalance.nRLC)).toBe(true);
        expect(receiverFinalBalance.wei.eq(receiverInitialBalance.wei)).toBe(
          true,
        );
        expect(receiverFinalBalance.nRLC.eq(receiverInitialBalance.nRLC)).toBe(
          true,
        );
      });

      test('report sendNativeTxHash and error when remaining wei cannot be sent', async () => {
        const receiverWallet = getRandomWallet();
        const { iexec, wallet: sweeperWallet } =
          await getTestConfig(tokenTestChain)();
        await setBalance(tokenTestChain)(
          sweeperWallet.address,
          60000000000000n,
        ); // enough for erc20 transfer only
        await setNRlcBalance(tokenTestChain)(sweeperWallet.address, ONE_RLC);
        const initialBalance = await iexec.wallet.checkBalances(
          sweeperWallet.address,
        );
        const receiverInitialBalance = await iexec.wallet.checkBalances(
          receiverWallet.address,
        );
        const res = await iexec.wallet.sweep(receiverWallet.address);
        const finalBalance = await iexec.wallet.checkBalances(
          sweeperWallet.address,
        );
        const receiverFinalBalance = await iexec.wallet.checkBalances(
          receiverWallet.address,
        );
        expect(res.sendNativeTxHash).toBeUndefined();
        expect(res.sendERC20TxHash).toBeTxHash();
        expect(res.errors.length).toBe(1);
        expect(res.errors[0]).toBe(
          "Failed to transfer native token': Tx fees are greater than wallet balance",
        );
        expect(initialBalance.wei.gt(new BN(0))).toBe(true);
        expect(initialBalance.nRLC.gt(new BN(0))).toBe(true);
        expect(finalBalance.wei.gt(new BN(0))).toBe(true);
        expect(finalBalance.nRLC.eq(new BN(0))).toBe(true);
        expect(receiverFinalBalance.wei.eq(receiverInitialBalance.wei)).toBe(
          true,
        );
        expect(
          receiverFinalBalance.nRLC
            .sub(initialBalance.nRLC)
            .eq(receiverInitialBalance.nRLC),
        ).toBe(true);
      });
    });
  });
});
