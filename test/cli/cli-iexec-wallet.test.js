// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import {
  TEST_CHAINS,
  execAsync,
  getRandomAddress,
  getRandomWallet,
  setBalance,
} from '../test-utils';
import {
  checkExists,
  globalSetup,
  globalTeardown,
  iexecPath,
  runIExecCliRaw,
  setChain,
  setRandomWallet,
  setWallet,
} from './cli-test-utils';
import '../jest-setup';

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec wallet', () => {
  let userWallet;
  let importedWallet;
  let importedWalletName;

  beforeAll(async () => {
    await globalSetup('cli-iexec-wallet');
    // init the project
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(testChain)();
    userWallet = await setRandomWallet();
    importedWallet = getRandomWallet();
    const { fileName } = await runIExecCliRaw(
      `${iexecPath} wallet import ${importedWallet.privateKey} --password test --force`,
    );
    importedWalletName = fileName.split('/')[fileName.split('/').length - 1];
  });

  beforeEach(async () => {
    // reset user wallet
    await setWallet(userWallet.privateKey);
  });

  afterAll(async () => {
    await globalTeardown();
  });

  describe('import', () => {
    test('iexec wallet import', async () => {
      const wallet = getRandomWallet();
      const res = await runIExecCliRaw(
        `${iexecPath} wallet import ${wallet.privateKey} --password test --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.address).toBe(wallet.address);
      expect(res.fileName).toBeDefined();
      expect(await checkExists(res.fileName));
    });

    test('--unencrypted', async () => {
      const wallet = getRandomWallet();
      const res = await runIExecCliRaw(
        `${iexecPath} wallet import ${wallet.privateKey} --unencrypted --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet.privateKey).toBe(wallet.privateKey);
      expect(res.wallet.address).toBe(wallet.address);
      expect(res.address).toBe(wallet.address);
      expect(res.fileName.indexOf('/')).toBe(-1);
      expect(await checkExists(res.fileName));
    });

    test('--keystoredir <path>', async () => {
      const res = await runIExecCliRaw(
        `${iexecPath} wallet import ${userWallet.privateKey} --password customPath --keystoredir ./out/keystore`,
      );
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.address).toBe(userWallet.address);
      expect(res.fileName.indexOf('out/keystore/')).not.toBe(-1);
      expect(await checkExists(res.fileName));
    });

    test('--keystoredir local', async () => {
      const res = await runIExecCliRaw(
        `${iexecPath} wallet import ${userWallet.privateKey} --password 'my local pass phrase' --keystoredir local`,
      );
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.address).toBe(userWallet.address);
      expect(res.fileName.indexOf('/')).toBe(-1);
      expect(await checkExists(res.fileName));
    });
  });

  describe('create', () => {
    test('iexec wallet create', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet create --password test --force --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.fileName).toBeDefined();
    });

    test('--unencrypted', async () => {
      const res = await runIExecCliRaw(
        `${iexecPath} wallet create --unencrypted --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet.privateKey).toBeDefined();
      expect(res.wallet.address).toBeDefined();
      expect(res.address).toBeDefined();
      expect(res.fileName.indexOf('/')).toBe(-1);
      expect(await checkExists(res.fileName));
    });

    test('--keystoredir <path>', async () => {
      const res = await runIExecCliRaw(
        `${iexecPath} wallet create --password customPath --keystoredir ./out/keystore`,
      );
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.address).toBeDefined();
      expect(res.fileName.indexOf('out/keystore/')).not.toBe(-1);
      expect(await checkExists(res.fileName));
    });

    test('--keystoredir local', async () => {
      const res = await runIExecCliRaw(
        `${iexecPath} wallet create --password 'my local pass phrase' --keystoredir local`,
      );
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.address).toBeDefined();
      expect(res.fileName.indexOf('/')).toBe(-1);
      expect(await checkExists(res.fileName));
    });
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
      expect(res.balance.RLC).toBe('0.0');
      expect(res.balance.nRLC).toBe('0');
    });

    test('--wallet-address <address>', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --password test --wallet-address ${importedWallet.address} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(importedWallet.address);
      expect(res.wallet.publicKey).toBeUndefined();
      expect(res.wallet.privateKey).toBeUndefined();
      expect(res.balance.nRLC).toBeDefined();
    });

    test('--wallet-address <address> --show-private-key', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --show-private-key --password test --wallet-address ${importedWallet.address} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(importedWallet.address);
      // expect(res.wallet.publicKey).toBe(importedWallet.publicKey); // format
      expect(res.wallet.privateKey).toBe(importedWallet.privateKey);
    });

    test('--wallet-file <fileName>', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --password test --wallet-file ${importedWalletName} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(importedWallet.address);
      expect(res.wallet.publicKey).toBeUndefined();
      expect(res.wallet.privateKey).toBeUndefined();
    });

    test('--show-private-key --wallet-address <address> (wrong password)', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --show-private-key --password fail --wallet-address ${importedWallet.address} --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe('incorrect password');
      expect(res.error.name).toBe('Error');
      expect(res.wallet).toBeUndefined();
      expect(res.balance).toBeUndefined();
    });

    test('--wallet-address <address> (missing wallet file)', async () => {
      const raw = await execAsync(
        `${iexecPath}  wallet show --wallet-address ${getRandomAddress()} --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe(
        'Failed to load wallet address from keystore: Wallet file not found',
      );
      expect(res.error.name).toBe('Error');
      expect(res.wallet).toBeUndefined();
      expect(res.balance).toBeUndefined();
    });

    test('--keystoredir <path>', async () => {
      const { address } = await runIExecCliRaw(
        `${iexecPath} wallet create --password customPath --keystoredir ./out/keystore`,
      );
      const res = await runIExecCliRaw(
        `${iexecPath} wallet show --password customPath --keystoredir ./out/keystore --wallet-address ${address} --show-private-key`,
      );
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(address);
      expect(res.wallet.privateKey).toBeDefined();
    });

    test('--keystoredir local', async () => {
      const { address } = await runIExecCliRaw(
        `${iexecPath} wallet create --password 'my local pass phrase' --keystoredir local`,
      );
      const res = await runIExecCliRaw(
        `${iexecPath} wallet show --password 'my local pass phrase' --keystoredir local --wallet-address ${address} --show-private-key`,
      );
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(address);
      expect(res.wallet.privateKey).toBeDefined();
    });
  });

  describe('send-ether', () => {
    test('iexec wallet send-ether (error on sidechain)', async () => {
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
      await testChain.provider.getTransaction(res.txHash).then((tx) => {
        expect(tx.gasPrice.toString()).toBe('0');
      });
    });

    test('iexec wallet send-RLC 1000000000 nRLC', async () => {
      const to = getRandomAddress();
      const res = await runIExecCliRaw(
        `${iexecPath} wallet send-RLC 1000000000 nRLC --to ${to} --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.from).toBe(userWallet.address);
      expect(res.to).toBe(to);
      expect(res.amount).toBe('1000000000');
      expect(res.txHash).toBeDefined();
      const { balance } = await runIExecCliRaw(
        `${iexecPath} wallet show ${to}`,
      );
      expect(balance.nRLC).toBe('1000000000');
    });
  });

  describe('sweep', () => {
    test('iexec wallet sweep', async () => {
      const walletToSweep = getRandomWallet();
      const rlcBalance = 10n;
      await setBalance(testChain)(
        walletToSweep.address,
        rlcBalance * 10n ** 18n,
      );
      const to = getRandomAddress();
      await runIExecCliRaw(
        `${iexecPath} wallet import ${walletToSweep.privateKey} --password test`,
      );
      const res = await runIExecCliRaw(
        `${iexecPath} wallet sweep --to ${to} --wallet-address ${walletToSweep.address} --password test --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.from).toBe(walletToSweep.address);
      expect(res.to).toBe(to);
      expect(res.sendERC20TxHash).toBeUndefined();
      expect(res.sendNativeTxHash).toBeDefined();
      expect(res.errors).toBeUndefined();
      const { balance } = await runIExecCliRaw(
        `${iexecPath} wallet show ${to}`,
      );
      expect(balance.RLC).toBe(`${rlcBalance}.0`);
      await testChain.provider
        .getTransaction(res.sendNativeTxHash)
        .then((tx) => {
          expect(tx.gasPrice.toString()).toBe('0');
        });
    });
  });
});
