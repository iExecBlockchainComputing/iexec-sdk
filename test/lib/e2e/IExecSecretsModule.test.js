// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import { expectAsyncCustomError, getTestConfig } from '../lib-test-utils.js';
import {
  TEST_CHAINS,
  TEE_FRAMEWORKS,
  SERVICE_UNREACHABLE_URL,
  SERVICE_HTTP_500_URL,
  getRandomAddress,
} from '../../test-utils.js';
import '../../jest-setup.js';
import { errors } from '../../../src/lib/index.js';

const { SmsCallError } = errors;

const iexecTestChain = TEST_CHAINS['bellecour-fork'];

describe('secrets', () => {
  describe('pushRequesterSecret()', () => {
    test("throw a SmsCallError when the SMS can't be reached", async () => {
      const { iexec } = getTestConfig(iexecTestChain)({
        options: {
          smsURL: SERVICE_UNREACHABLE_URL,
        },
      });
      await expectAsyncCustomError(
        iexec.secrets.pushRequesterSecret('foo', 'oops'),
        {
          constructor: SmsCallError,
          message: `SMS error: Connection to ${SERVICE_UNREACHABLE_URL} failed with a network error`,
        }
      );
    });

    test('throw a SmsCallError when the SMS encounters an error', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({
        options: {
          smsURL: SERVICE_HTTP_500_URL,
        },
      });
      await expectAsyncCustomError(
        iexec.secrets.pushRequesterSecret('foo', 'oops'),
        {
          constructor: SmsCallError,
          message: `SMS error: Server at ${SERVICE_HTTP_500_URL} encountered an internal error`,
        }
      );
    });

    test('pushes the secret', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const pushRes = await iexec.secrets.pushRequesterSecret('foo', 'oops');
      expect(pushRes.isPushed).toBe(true);
      await expect(
        iexec.secrets.pushRequesterSecret('foo', 'oops')
      ).rejects.toThrow(
        Error(`Secret "foo" already exists for ${wallet.address}`)
      );
      const pushForTeeFrameworkRes = await iexec.secrets.pushRequesterSecret(
        'foo',
        'oops',
        { teeFramework: TEE_FRAMEWORKS.GRAMINE }
      );
      expect(pushForTeeFrameworkRes.isPushed).toBe(true);
    });
  });

  describe('checkRequesterSecretExists()', () => {
    test("throw a SmsCallError when the SMS can't be reached", async () => {
      const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
        options: {
          smsURL: SERVICE_UNREACHABLE_URL,
        },
      });
      await expectAsyncCustomError(
        iexecReadOnly.secrets.checkRequesterSecretExists(
          getRandomAddress(),
          'foo'
        ),
        {
          constructor: SmsCallError,
          message: `SMS error: Connection to ${SERVICE_UNREACHABLE_URL} failed with a network error`,
        }
      );
    });

    test('throw a SmsCallError when the SMS encounters an error', async () => {
      const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
        options: {
          smsURL: SERVICE_HTTP_500_URL,
        },
      });
      await expectAsyncCustomError(
        iexecReadOnly.secrets.checkRequesterSecretExists(
          getRandomAddress(),
          'foo'
        ),
        {
          constructor: SmsCallError,
          message: `SMS error: Server at ${SERVICE_HTTP_500_URL} encountered an internal error`,
        }
      );
    });

    test('anyone can check a secret exists', async () => {
      const { iexec, wallet } = getTestConfig(iexecTestChain)();
      const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
        readOnly: true,
      });
      await expect(
        iexecReadOnly.secrets.checkRequesterSecretExists(wallet.address, 'foo')
      ).resolves.toBe(false);
      await iexec.secrets.pushRequesterSecret('foo', 'oops');
      await expect(
        iexecReadOnly.secrets.checkRequesterSecretExists(wallet.address, 'foo')
      ).resolves.toBe(true);
      await expect(
        iexecReadOnly.secrets.checkRequesterSecretExists(
          wallet.address,
          'foo',
          {
            teeFramework: TEE_FRAMEWORKS.GRAMINE,
          }
        )
      ).resolves.toBe(false);
    });
  });
});
