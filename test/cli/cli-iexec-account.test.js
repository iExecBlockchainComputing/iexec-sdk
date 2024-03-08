// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { BN } from 'bn.js';
import { TEST_CHAINS, execAsync, getRandomAddress } from '../test-utils';
import {
  globalSetup,
  globalTeardown,
  iexecPath,
  setChain,
  setChainsRichWallet,
} from './cli-test-utils';

const DEFAULT_TIMEOUT = 120000;
jest.setTimeout(DEFAULT_TIMEOUT);

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec template', () => {
  beforeAll(async () => {
    await globalSetup('cli-iexec-account');
    await setChain(testChain)();
    await setChainsRichWallet(testChain)();
  });
  afterAll(async () => {
    await globalTeardown();
  });
  test('iexec account deposit 1000', async () => {
    const initialWalletBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} wallet show --raw`),
      ).balance.nRLC,
    );
    const initialAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show --raw`),
      ).balance.stake,
    );
    const amount = '1000';
    const raw = await execAsync(`${iexecPath} account deposit ${amount} --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.amount).toBe(amount);
    expect(res.txHash).toBeDefined();
    const bnAmount = new BN(amount);
    const finalWalletBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} wallet show --raw`),
      ).balance.nRLC,
    );
    const finalAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show --raw`),
      ).balance.stake,
    );
    expect(initialWalletBalance.sub(bnAmount).eq(finalWalletBalance)).toBe(
      true,
    );
    expect(initialAccountBalance.add(bnAmount).eq(finalAccountBalance)).toBe(
      true,
    );
  });

  test('iexec account deposit 10 RLC', async () => {
    const initialWalletBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} wallet show --raw`),
      ).balance.nRLC,
    );
    const initialAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show --raw`),
      ).balance.stake,
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
      JSON.parse(
        await execAsync(`${iexecPath} wallet show --raw`),
      ).balance.nRLC,
    );
    const finalAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show --raw`),
      ).balance.stake,
    );
    expect(initialWalletBalance.sub(bnAmount).eq(finalWalletBalance)).toBe(
      true,
    );
    expect(initialAccountBalance.add(bnAmount).eq(finalAccountBalance)).toBe(
      true,
    );
  });

  test('iexec account withdraw 500', async () => {
    const initialWalletBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} wallet show --raw`),
      ).balance.nRLC,
    );
    const initialAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show --raw`),
      ).balance.stake,
    );
    const amount = '500';
    const raw = await execAsync(
      `${iexecPath} account withdraw ${amount} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.amount).toBe(amount);
    expect(res.txHash).toBeDefined();
    const bnAmount = new BN(amount);
    const finalWalletBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} wallet show --raw`),
      ).balance.nRLC,
    );
    const finalAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show --raw`),
      ).balance.stake,
    );
    expect(initialWalletBalance.add(bnAmount).eq(finalWalletBalance)).toBe(
      true,
    );
    expect(initialAccountBalance.sub(bnAmount).eq(finalAccountBalance)).toBe(
      true,
    );
  });

  test('iexec account withdraw 5 RLC', async () => {
    const initialWalletBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} wallet show --raw`),
      ).balance.nRLC,
    );
    const initialAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show --raw`),
      ).balance.stake,
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
      JSON.parse(
        await execAsync(`${iexecPath} wallet show --raw`),
      ).balance.nRLC,
    );
    const finalAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show --raw`),
      ).balance.stake,
    );
    expect(initialWalletBalance.add(bnAmount).eq(finalWalletBalance)).toBe(
      true,
    );
    expect(initialAccountBalance.sub(bnAmount).eq(finalAccountBalance)).toBe(
      true,
    );
  });

  test('iexec account show', async () => {
    const raw = await execAsync(`${iexecPath} account show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.balance).toBeDefined();
    expect(res.balance.stake).not.toBe('0');
  });

  test('iexec account show [address]', async () => {
    const raw = await execAsync(
      `${iexecPath} account show ${getRandomAddress()} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.balance).toBeDefined();
    expect(res.balance.stake).toBe('0');
    expect(res.balance.locked).toBe('0');
  });

  test('iexec account show --wallet-address <address> (missing wallet file)', async () => {
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
