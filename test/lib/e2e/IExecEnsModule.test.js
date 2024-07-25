// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import { BN } from 'bn.js';
import {
  deployRandomApp,
  deployRandomDataset,
  deployRandomWorkerpool,
  getTestConfig,
  runObservableSubscribe,
} from '../lib-test-utils.js';
import {
  TEST_CHAINS,
  NULL_ADDRESS,
  getId,
  getRandomAddress,
  INFURA_PROJECT_ID,
} from '../../test-utils.js';
import '../../jest-setup.js';
import { IExec } from '../../../src/lib/index.js';

const iexecTestChain = TEST_CHAINS['bellecour-fork'];

describe('ens', () => {
  describe('ens resolution', () => {
    test('resolve ens on iExec sidechain', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
      const balance = await iexec.wallet.checkBalances('core.v5.iexec.eth');
      expect(balance.wei).toBeInstanceOf(BN);
      expect(balance.nRLC).toBeInstanceOf(BN);
    });

    test('resolve ens on mainnet', async () => {
      const iexec = new IExec(
        { ethProvider: 'mainnet' },
        {
          providerOptions: {
            cloudflare: 1,
            infura: INFURA_PROJECT_ID,
            quorum: 1,
          },
        }
      );
      const balance = await iexec.wallet.checkBalances('core.v5.iexec.eth');
      expect(balance.wei).toBeInstanceOf(BN);
      expect(balance.nRLC).toBeInstanceOf(BN);
    });
  });

  describe('getOwner()', () => {
    test('get owner address', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
      const res = await iexec.ens.getOwner('core.v5.iexec.eth');
      expect(res).toBe('0x0B3a38b0A47aB0c5E8b208A703de366751Df5916');
    });

    test('get address zero for unregistered names', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
      const res = await iexec.ens.getOwner('unregistered.iexec.eth');
      expect(res).toBe(NULL_ADDRESS);
    });
  });

  describe('resolveName()', () => {
    test('known names resolves to address', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
      const res = await iexec.ens.resolveName('core.v5.iexec.eth');
      expect(res).toBe(
        iexecTestChain.hubAddress || iexecTestChain.defaults.hubAddress
      );
    });

    test('unknown name resolves to null', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
      const res = await iexec.ens.resolveName('unknown.eth');
      expect(res).toBe(null);
    });
  });

  describe('lookupAddress()', () => {
    test('return the name when reverse resolution is configured', async () => {
      const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec } = getTestConfig(iexecTestChain)();
      const label = `ens-${getId()}`;
      const domain = 'users.iexec.eth';
      const name = `${label}.${domain}`;
      await iexec.ens.claimName(label, domain);
      await iexec.ens.configureResolution(name);
      const res = await iexecReadOnly.ens.lookupAddress(name);
      expect(res).toBe(name);
    });

    test('return null when no reverse resolution is configured', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
      const res = await iexec.ens.lookupAddress(getRandomAddress());
      expect(res).toBe(null);
    });
  });

  describe('getDefaultDomain()', () => {
    test('returns the domain corresponding to the address', async () => {
      const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec } = getTestConfig(iexecTestChain)();
      const { address: appAddress } = await deployRandomApp(iexec);
      const { address: datasetAddress } = await deployRandomDataset(iexec);
      const { address: workerpoolAddress } =
        await deployRandomWorkerpool(iexec);
      const appDomain = await iexecReadOnly.ens.getDefaultDomain(appAddress);
      expect(appDomain).toBe('apps.iexec.eth');
      const datasetDomain =
        await iexecReadOnly.ens.getDefaultDomain(datasetAddress);
      expect(datasetDomain).toBe('datasets.iexec.eth');
      const workerpoolDomain =
        await iexecReadOnly.ens.getDefaultDomain(workerpoolAddress);
      expect(workerpoolDomain).toBe('pools.iexec.eth');
      const defaultDomain = await iexecReadOnly.ens.getDefaultDomain(
        getRandomAddress()
      );
      expect(defaultDomain).toBe('users.iexec.eth');
    });
  });

  describe('claimName()', () => {
    test('get an available name', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const label = `wallet-${wallet.address.toLowerCase()}`;
      const name = `${label}.users.iexec.eth`;
      const res = await iexec.ens.claimName(label);

      expect(res.registerTxHash).toBeTxHash();
      expect(res.name).toBe(name);

      const resClaimSame = await iexec.ens.claimName(label);
      expect(resClaimSame.registerTxHash).toBeUndefined();
      expect(resClaimSame.name).toBe(name);
    });

    test('allow claim on custom domain with FIFS registrar', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const label = `wallet-${wallet.address.toLowerCase()}`;
      const domain = 'apps.iexec.eth';
      const name = `${label}.${domain}`;
      const res = await iexec.ens.claimName(label, domain);
      expect(res.registerTxHash).toBeTxHash();
      expect(res.name).toBe(name);
      const resClaimSame = await iexec.ens.claimName(label, domain);
      expect(resClaimSame.registerTxHash).toBeUndefined();
      expect(resClaimSame.name).toBe(name);
    });

    test('fails if name is not available', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const label = 'users';
      const domain = 'iexec.eth';
      await expect(iexec.ens.claimName(label, domain)).rejects.toThrow(
        Error(
          'users.iexec.eth is already owned by 0xc7b2336c1A8932Fb9414356E254edee6A87dd37d'
        )
      );
    });

    test('fails if custom domain has no registrar', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const label = 'test';
      const domain = 'no-registrar.iexec.eth';
      await expect(iexec.ens.claimName(label, domain)).rejects.toThrow(
        Error(
          'The base domain no-registrar.iexec.eth owner 0x0000000000000000000000000000000000000000 is not a contract'
        )
      );
    });
  });

  describe('configureResolution()', () => {
    test('configures for user address by default', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const label = `wallet-${wallet.address.toLowerCase()}`;
      const name = `${label}.users.iexec.eth`;
      await iexec.ens.claimName(label);

      const configureRes = await iexec.ens.configureResolution(name);
      expect(configureRes.name).toBe(name);
      expect(configureRes.address).toBe(wallet.address);
      expect(configureRes.setAddrTxHash).toBeTxHash();
      expect(configureRes.setNameTxHash).toBeTxHash();
      expect(configureRes.setResolverTxHash).toBeTxHash();

      const reconfigureSameRes = await iexec.ens.configureResolution(name);
      expect(reconfigureSameRes.name).toBe(name);
      expect(reconfigureSameRes.address).toBe(wallet.address);
      expect(reconfigureSameRes.setAddrTxHash).toBeUndefined();
      expect(reconfigureSameRes.setNameTxHash).toBeUndefined();
      expect(reconfigureSameRes.setResolverTxHash).toBeUndefined();
    });

    test('optionally configures for target address', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const app1 = await deployRandomApp(iexec);

      const label = `address-${wallet.address.toLowerCase()}`;
      const name = `${label}.users.iexec.eth`;
      await iexec.ens.claimName(label);

      const configureRes = await iexec.ens.configureResolution(
        name,
        app1.address
      );
      expect(configureRes.name).toBe(name);
      expect(configureRes.address).toBe(app1.address);
      expect(configureRes.setAddrTxHash).toBeTxHash();
      expect(configureRes.setNameTxHash).toBeTxHash();
      expect(configureRes.setResolverTxHash).toBeTxHash();

      const reconfigureSameRes = await iexec.ens.configureResolution(
        name,
        app1.address
      );
      expect(reconfigureSameRes.name).toBe(name);
      expect(reconfigureSameRes.address).toBe(app1.address);
      expect(reconfigureSameRes.setAddrTxHash).toBeUndefined();
      expect(reconfigureSameRes.setNameTxHash).toBeUndefined();
      expect(reconfigureSameRes.setResolverTxHash).toBeUndefined();

      const app2 = await deployRandomApp(iexec);

      const reconfigureRes = await iexec.ens.configureResolution(
        name,
        app2.address
      );
      expect(reconfigureRes.name).toBe(name);
      expect(reconfigureRes.address).toBe(app2.address);
      expect(reconfigureRes.setAddrTxHash).toBeTxHash();
      expect(reconfigureRes.setNameTxHash).toBeTxHash();
      expect(reconfigureRes.setResolverTxHash).toBeUndefined();
    });

    test('fails if name is not owned', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      await expect(
        iexec.ens.configureResolution('not-owned.eth', wallet.address)
      ).rejects.toThrow(
        Error(
          `The current address ${wallet.address} is not owner of not-owned.eth`
        )
      );
    });

    test('fails if target app address not owned', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const app = await deployRandomApp(iexec, { owner: getRandomAddress() });
      const label = `address-${app.address.toLowerCase()}`;
      const name = `${label}.users.iexec.eth`;
      await iexec.ens.claimName(label);

      await expect(
        iexec.ens.configureResolution(name, app.address)
      ).rejects.toThrow(
        Error(
          `${wallet.address} is not the owner of ${app.address}, impossible to setup ENS resolution`
        )
      );
    });

    test('fails if target address is an EAO different from user wallet', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const targetAddress = getRandomAddress();
      const label = `address-${targetAddress.toLowerCase()}`;
      const name = `${label}.users.iexec.eth`;
      await iexec.ens.claimName(label);

      await expect(
        iexec.ens.configureResolution(name, targetAddress)
      ).rejects.toThrow(
        Error(
          `Target address ${targetAddress} is not a contract and don't match current wallet address ${wallet.address}, impossible to setup ENS resolution`
        )
      );
    });
  });

  describe('obsConfigureResolution()', () => {
    test('configures for user address by default', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const label = `wallet-${wallet.address.toLowerCase()}`;
      const name = `${label}.users.iexec.eth`;
      await iexec.ens.claimName(label);

      const configureObs = await iexec.ens.obsConfigureResolution(name);

      const configureRes = await runObservableSubscribe(configureObs).wait();
      // do not resend tx
      const reconfigureSameRes =
        await runObservableSubscribe(configureObs).wait();

      expect(configureRes.messages.length).toBe(10);
      expect(reconfigureSameRes.messages.length).toBe(4);
    });

    test('optionally configures for target address', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const app1 = await deployRandomApp(iexec);
      const app2 = await deployRandomApp(iexec);

      const label = `address-${wallet.address.toLowerCase()}`;
      const name = `${label}.users.iexec.eth`;
      await iexec.ens.claimName(label);

      const configureObs = await iexec.ens.obsConfigureResolution(
        name,
        app1.address
      );
      const configureRes = await runObservableSubscribe(configureObs).wait();

      // reuse name for another app
      const reconfigureObs = await iexec.ens.obsConfigureResolution(
        name,
        app2.address
      );
      const reconfigureRes =
        await runObservableSubscribe(reconfigureObs).wait();
      // do not resend tx
      const reconfigureSameRes =
        await runObservableSubscribe(reconfigureObs).wait();

      expect(configureRes.messages.length).toBe(10);
      expect(reconfigureRes.messages.length).toBe(8);
      expect(reconfigureSameRes.messages.length).toBe(4);
    });

    test('ens.obsConfigureResolution(name, address) throw with name not owned', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const configureObs = await iexec.ens.obsConfigureResolution(
        'not-owned.eth',
        wallet.address
      );

      const configureRes = await runObservableSubscribe(configureObs).wait();

      expect(configureRes.messages.length).toBe(0);
      expect(configureRes.completed).toBe(false);
      expect(configureRes.error).toStrictEqual(
        Error(
          `The current address ${wallet.address} is not owner of not-owned.eth`
        )
      );
    });

    test('fails if target app address not owned', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const app = await deployRandomApp(iexec, {
        owner: getRandomAddress(),
      });
      const label = `address-${app.address.toLowerCase()}`;
      const name = `${label}.users.iexec.eth`;
      await iexec.ens.claimName(label);

      const configureObs = await iexec.ens.obsConfigureResolution(
        name,
        app.address
      );

      const configureRes = await runObservableSubscribe(configureObs).wait();

      expect(configureRes.messages.length).toBe(0);
      expect(configureRes.completed).toBe(false);
      expect(configureRes.error).toStrictEqual(
        Error(
          `${wallet.address} is not the owner of ${app.address}, impossible to setup ENS resolution`
        )
      );
    });

    test('fails if target address is an EAO different from user wallet', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const targetAddress = getRandomAddress();
      const label = `address-${targetAddress.toLowerCase()}`;
      const name = `${label}.users.iexec.eth`;
      await iexec.ens.claimName(label);

      const configureObs = await iexec.ens.obsConfigureResolution(
        name,
        targetAddress
      );
      const configureRes = await runObservableSubscribe(configureObs).wait();

      expect(configureRes.messages.length).toBe(0);
      expect(configureRes.completed).toBe(false);
      expect(configureRes.error).toStrictEqual(
        Error(
          `Target address ${targetAddress} is not a contract and don't match current wallet address ${wallet.address}, impossible to setup ENS resolution`
        )
      );
    });
  });

  describe('setTextRecord()', () => {
    test('fails if resolver is not configured', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const name = `${getId()}.users.iexec.eth`;
      await expect(
        iexec.ens.setTextRecord(name, 'key', 'value')
      ).rejects.toThrow(Error(`No resolver is configured for ${name}`));
    });

    test('fails if the name is not owned', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const label = getId();
      const name = `${label}.users.iexec.eth`;
      await iexec.ens.claimName(label);
      await iexec.ens.configureResolution(name);

      const { iexec: iexecNotOwner, wallet: walletNotOwner } =
        getTestConfig(iexecTestChain)();
      await expect(
        iexecNotOwner.ens.setTextRecord(name, 'key', 'value')
      ).rejects.toThrow(
        Error(
          `${walletNotOwner.address} is not authorised to set a text record for ${name}`
        )
      );
    });

    test('sets a text record', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const { address } = await deployRandomWorkerpool(iexec);
      const label = `workerpool-${address.toLowerCase()}`;
      const name = `${label}.users.iexec.eth`;
      await iexec.ens.claimName(label);
      await iexec.ens.configureResolution(name, address);

      const key = `key_${getId()}`;
      const value = `value_${getId()}`;
      const res = await iexec.ens.setTextRecord(name, key, value);
      expect(res).toBeTxHash();
    });

    test('can reset a text record', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const { address } = await deployRandomWorkerpool(iexec);
      const label = `workerpool-${address.toLowerCase()}`;
      const name = `${label}.users.iexec.eth`;
      await iexec.ens.claimName(label);
      await iexec.ens.configureResolution(name, address);

      const key = `key_${getId()}`;
      const res = await iexec.ens.setTextRecord(name, key);
      expect(res).toBeTxHash();
    });
  });

  describe('readTextRecord()', () => {
    test('fails if the resolver not configured', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({ readOnly: true });
      const address = getRandomAddress();
      const label = `address-${address.toLowerCase()}`;
      const name = `${label}.users.iexec.eth`;
      await expect(iexec.ens.readTextRecord(name, 'key')).rejects.toThrow(
        Error(`No resolver is configured for ${name}`)
      );
    });

    test('returns empty string if the record not set', async () => {
      const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec } = getTestConfig(iexecTestChain)();
      const label = getId();
      const name = `${label}.users.iexec.eth`;
      await iexec.ens.claimName(label);
      await iexec.ens.configureResolution(name);
      const res = await iexecReadOnly.ens.readTextRecord(name, 'key');
      expect(res).toBe('');
    });

    test('shows an existing text record', async () => {
      const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const { iexec } = getTestConfig(iexecTestChain)();
      const { address } = await deployRandomWorkerpool(iexec);
      const label = `workerpool-${address.toLowerCase()}`;
      const name = `${label}.users.iexec.eth`;
      const key = `key_${getId()}`;
      const value = `value_${getId()}`;
      await iexec.ens.claimName(label);
      await iexec.ens.configureResolution(name, address);
      await iexec.ens.setTextRecord(name, key, value);
      const res = await iexecReadOnly.ens.readTextRecord(name, key);
      expect(res).toBe(value);
    });
  });
});
