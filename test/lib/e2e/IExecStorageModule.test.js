// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import { getTestConfig } from '../lib-test-utils';
import { TEST_CHAINS } from '../../test-utils';
import '../../jest-setup';

const iexecTestChain = TEST_CHAINS['bellecour-fork'];

describe('storage', () => {
  describe('defaultStorageLogin()', () => {
    test('gets a token from the result proxy', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const token = await iexec.storage.defaultStorageLogin();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
      const token2 = await iexec.storage.defaultStorageLogin();
      expect(token2).toBe(token);
    });
  });

  describe('pushStorageToken()', () => {
    test('pushes the token on the SMS', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const pushRes = await iexec.storage.pushStorageToken('oops');
      expect(pushRes.isPushed).toBe(true);
      expect(pushRes.isUpdated).toBe(false);
      await expect(iexec.storage.pushStorageToken('oops')).rejects.toThrow(
        Error(
          `Secret "iexec-result-iexec-ipfs-token" already exists for ${wallet.address}`,
        ),
      );
      const pushForTeeFramework = await iexec.storage.pushStorageToken('oops', {
        teeFramework: 'gramine',
      });
      expect(pushForTeeFramework.isPushed).toBe(true);
      expect(pushForTeeFramework.isUpdated).toBe(false);
    });

    test('provider "default" pushes result proxy ipfs token', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const pushRes = await iexec.storage.pushStorageToken('oops', {
        provider: 'default',
      });
      expect(pushRes.isPushed).toBe(true);
      expect(pushRes.isUpdated).toBe(false);
      await expect(
        iexec.storage.pushStorageToken('oops', { provider: 'default' }),
      ).rejects.toThrow(
        Error(
          `Secret "iexec-result-iexec-ipfs-token" already exists for ${wallet.address}`,
        ),
      );
    });

    test('provider "dropbox" pushes dropbox token', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const pushRes = await iexec.storage.pushStorageToken('oops', {
        provider: 'dropbox',
      });
      expect(pushRes.isPushed).toBe(true);
      expect(pushRes.isUpdated).toBe(false);
      await expect(
        iexec.storage.pushStorageToken('oops', { provider: 'dropbox' }),
      ).rejects.toThrow(
        Error(
          `Secret "iexec-result-dropbox-token" already exists for ${wallet.address}`,
        ),
      );
    });

    test('forceUpdate allows updating the token', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const pushRes = await iexec.storage.pushStorageToken('oops', {
        forceUpdate: true,
      });
      expect(pushRes.isPushed).toBe(true);
      expect(pushRes.isUpdated).toBe(false);
      const updateRes = await iexec.storage.pushStorageToken('oops', {
        forceUpdate: true,
      });
      expect(updateRes.isPushed).toBe(true);
      expect(updateRes.isUpdated).toBe(true);
    });
  });

  describe('checkStorageTokenExists()', () => {
    test('anyone can check a token exists', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const withoutSecretRes =
        await iexecReadOnly.storage.checkStorageTokenExists(wallet.address, {
          provider: 'dropbox',
        });
      expect(withoutSecretRes).toBe(false);
      await iexec.storage.pushStorageToken('oops', { provider: 'dropbox' });
      const withSecretRes = await iexecReadOnly.storage.checkStorageTokenExists(
        wallet.address,
        { provider: 'dropbox' },
      );
      expect(withSecretRes).toBe(true);
      const unsetProviderRes =
        await iexecReadOnly.storage.checkStorageTokenExists(wallet.address);
      expect(unsetProviderRes).toBe(false);
      await expect(
        iexecReadOnly.storage.checkStorageTokenExists(wallet.address, {
          provider: 'test',
        }),
      ).rejects.toThrow(Error('"test" not supported'));
      const unsetForTeeFramework =
        await iexecReadOnly.storage.checkStorageTokenExists(wallet.address, {
          teeFramework: 'gramine',
        });
      expect(unsetForTeeFramework).toBe(false);
      await iexec.storage.pushStorageToken('oops', { teeFramework: 'gramine' });
      const setForTeeFramework =
        await iexecReadOnly.storage.checkStorageTokenExists(wallet.address, {
          teeFramework: 'gramine',
        });
      expect(setForTeeFramework).toBe(true);
    });
  });
});
