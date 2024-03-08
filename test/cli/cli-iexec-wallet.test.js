// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import {
  TEST_CHAINS,
  execAsync,
  getRandomAddress,
  runIExecCliRaw,
  setBalance,
} from '../test-utils';
import {
  globalSetup,
  globalTeardown,
  iexecPath,
  setChain,
  setRandomWallet,
} from './cli-test-utils';

const DEFAULT_TIMEOUT = 120000;
jest.setTimeout(DEFAULT_TIMEOUT);

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec wallet', () => {
  let userWallet;

  beforeAll(async () => {
    await globalSetup('cli-iexec-wallet');
    // init the project
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(testChain)();
    userWallet = await setRandomWallet();
  });
  afterAll(async () => {
    await globalTeardown();
  });

  describe('show', () => {
    beforeAll(async () => {
      await setBalance(testChain)(userWallet.address, 10n * 10n ** 18n);
    });

    test('iexec wallet show (user wallet)', async () => {
      const res = await runIExecCliRaw(`${iexecPath} wallet show`);
      expect(res.ok).toBe(true);
      expect(res.wallet.address).toBe(userWallet.address);
      expect(res.wallet.publicKey).toBeUndefined();
      expect(res.wallet.privateKey).toBeUndefined();
      expect(res.balance.ether).toBeUndefined();
      expect(res.balance.RLC).toBe('10.0');
      expect(res.balance.nRLC).toBe('10000000000');
    });

    test('iexec wallet show --show-private-key (user wallet)', async () => {
      const res = await runIExecCliRaw(
        `${iexecPath} wallet show --show-private-key`,
      );
      expect(res.ok).toBe(true);
      expect(res.wallet.address).toBe(userWallet.address);
      // expect(res.wallet.publicKey).toBe(userWallet.publicKey); // unexpected format
      expect(res.wallet.privateKey).toBe(userWallet.privateKey);
      expect(res.balance.ether).toBeUndefined();
      expect(res.balance.RLC).toBe('10.0');
      expect(res.balance.nRLC).toBe('10000000000');
    });

    test('iexec wallet show [address]', async () => {
      const res = await runIExecCliRaw(
        `${iexecPath} wallet show ${getRandomAddress()}`,
      );
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeUndefined();
      expect(res.balance.ether).toBeUndefined();
      expect(res.balance.nRLC).toBeDefined();
      expect(res.balance.RLC).toBeDefined();
      expect(res.balance.nRLC).toBe('0');
    });
  });

  describe('send-ether', () => {
    test('iexec wallet send-ether', async () => {
      await setBalance(testChain)(userWallet.address, 10n * 10n ** 18n);
      const to = getRandomAddress();
      const res = await runIExecCliRaw(
        `${iexecPath} wallet send-ether 1 gwei --to ${to} --force`,
      );
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe(
        'sendETH() is disabled on sidechain, use sendRLC()',
      );
    });
  });

  describe('send-RLC', () => {
    beforeAll(async () => {
      await setBalance(testChain)(userWallet.address, 10n * 10n ** 18n);
    });

    test('iexec wallet send-RLC 0.5', async () => {
      await setBalance(testChain)(userWallet.address, 10n * 10n ** 18n);
      const to = getRandomAddress();
      const res = await runIExecCliRaw(
        `${iexecPath} wallet send-RLC 0.5 --to ${to} --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.from).toBe(userWallet.address);
      expect(res.to).toBe(to);
      expect(res.amount).toBe('500000000');
      expect(res.txHash).toBeDefined();
      const { balance } = await runIExecCliRaw(
        `${iexecPath} wallet show ${to}`,
      );
      expect(balance.RLC).toBe('0.5');
    });
  });
});
