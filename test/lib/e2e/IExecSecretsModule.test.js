// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test } from '@jest/globals';
import { getTestConfig } from '../lib-test-utils';
import { TEST_CHAINS, TEE_FRAMEWORKS } from '../../test-utils';
import '../../jest-setup';

const iexecTestChain = TEST_CHAINS['bellecour-fork'];

describe('secrets', () => {
  describe('pushRequesterSecret()', () => {
    test('pushes the secret', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const pushRes = await iexec.secrets.pushRequesterSecret('foo', 'oops');
      expect(pushRes.isPushed).toBe(true);
      await expect(
        iexec.secrets.pushRequesterSecret('foo', 'oops'),
      ).rejects.toThrow(
        Error(`Secret "foo" already exists for ${wallet.address}`),
      );
      const pushForTeeFrameworkRes = await iexec.secrets.pushRequesterSecret(
        'foo',
        'oops',
        { teeFramework: TEE_FRAMEWORKS.GRAMINE },
      );
      expect(pushForTeeFrameworkRes.isPushed).toBe(true);
    });
  });

  describe('checkRequesterSecretExists()', () => {
    test('anyone can check a secret exists', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      await expect(
        iexecReadOnly.secrets.checkRequesterSecretExists(wallet.address, 'foo'),
      ).resolves.toBe(false);
      await iexec.secrets.pushRequesterSecret('foo', 'oops');
      await expect(
        iexecReadOnly.secrets.checkRequesterSecretExists(wallet.address, 'foo'),
      ).resolves.toBe(true);
      await expect(
        iexecReadOnly.secrets.checkRequesterSecretExists(
          wallet.address,
          'foo',
          {
            teeFramework: TEE_FRAMEWORKS.GRAMINE,
          },
        ),
      ).resolves.toBe(false);
    });
  });
});
