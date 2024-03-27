// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest, describe, test } from '@jest/globals';
import { BN } from 'bn.js';
import { getTestConfig } from '../lib-test-utils';
import { TEST_CHAINS, TEE_FRAMEWORKS } from '../../test-utils';

const DEFAULT_TIMEOUT = 120000;
jest.setTimeout(DEFAULT_TIMEOUT);

const iexecTestChain = TEST_CHAINS['bellecour-fork'];

describe('hub', () => {
  describe('showCategory()', () => {
    test('anyone can show category', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const res = await iexec.hub.showCategory(0);
      expect(res).toStrictEqual({
        description: '{}',
        name: 'XS',
        workClockTimeRef: new BN(300),
      });
    });
  });
  describe('createCategory()', () => {
    test('admin can create category', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({
        privateKey: iexecTestChain.pocoAdminWallet.privateKey,
      });
      const res = await iexec.hub.createCategory({
        description: 'foo',
        name: 'bar',
        workClockTimeRef: 10,
      });
      expect(res.catid).toBeDefined();
      expect(res.txHash).toBeDefined();
    });
  });
});

describe('[result]', () => {
  describe('pushResultEncryptionKey()', () => {
    test('pushes the result encryption key', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const pushRes = await iexec.result.pushResultEncryptionKey('oops');
      expect(pushRes.isPushed).toBe(true);
      expect(pushRes.isUpdated).toBe(false);
      await expect(
        iexec.result.pushResultEncryptionKey('oops'),
      ).rejects.toThrow(
        Error(
          `Secret "iexec-result-encryption-public-key" already exists for ${wallet.address}`,
        ),
      );
      await expect(
        iexec.result.pushResultEncryptionKey('oops', {
          teeFramework: TEE_FRAMEWORKS.SCONE,
        }),
      ).rejects.toThrow(
        Error(
          `Secret "iexec-result-encryption-public-key" already exists for ${wallet.address}`,
        ),
      );
      const pushForTeeFrameworkRes = await iexec.result.pushResultEncryptionKey(
        'oops',
        { teeFramework: TEE_FRAMEWORKS.GRAMINE },
      );
      expect(pushForTeeFrameworkRes.isPushed).toBe(true);
      expect(pushForTeeFrameworkRes.isUpdated).toBe(false);
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
      const withSecretForTeeFrameworkRes =
        await iexecReadOnly.result.checkResultEncryptionKeyExists(
          wallet.address,
          {
            teeFramework: TEE_FRAMEWORKS.SCONE,
          },
        );
      expect(withSecretForTeeFrameworkRes).toBe(true);
      const withoutSecretForTeeFrameworkRes =
        await iexecReadOnly.result.checkResultEncryptionKeyExists(
          wallet.address,
          {
            teeFramework: TEE_FRAMEWORKS.GRAMINE,
          },
        );
      expect(withoutSecretForTeeFrameworkRes).toBe(false);
    });
  });
});
