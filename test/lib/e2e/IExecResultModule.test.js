import { describe, test, expect } from '@jest/globals';
import { getTestConfig } from '../lib-test-utils.js';
import { TEST_CHAINS } from '../../test-utils.js';
import '../../jest-setup.js';

const iexecTestChain = TEST_CHAINS['bellecour-fork'];

describe('result', () => {
  describe('pushResultEncryptionKey()', () => {
    test('pushes the result encryption key', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const pushRes = await iexec.result.pushResultEncryptionKey('oops');
      expect(pushRes.isPushed).toBe(true);
      expect(pushRes.isUpdated).toBe(false);
      await expect(
        iexec.result.pushResultEncryptionKey('oops'),
      ).rejects.toThrow(
        new Error(
          `Secret "iexec-result-encryption-public-key" already exists for ${wallet.address}`,
        ),
      );
    });

    test('forceUpdate allows updating the key', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const pushRes = await iexec.result.pushResultEncryptionKey('Oops', {
        forceUpdate: true,
      });
      expect(pushRes.isPushed).toBe(true);
      expect(pushRes.isUpdated).toBe(false);
      const pushSameRes = await iexec.result.pushResultEncryptionKey('Oops', {
        forceUpdate: true,
      });
      expect(pushSameRes.isPushed).toBe(true);
      expect(pushSameRes.isUpdated).toBe(true);
    });
  });

  describe('checkResultEncryptionKeyExists()', () => {
    test('anyone can check the key exists', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      const withoutSecretRes =
        await iexec.result.checkResultEncryptionKeyExists(wallet.address);
      expect(withoutSecretRes).toBe(false);
      await iexec.result.pushResultEncryptionKey('oops');
      const withSecretRes =
        await iexecReadOnly.result.checkResultEncryptionKeyExists(
          wallet.address,
        );
      expect(withSecretRes).toBe(true);
    });
  });
});
