import { describe, test, expect } from '@jest/globals';
import { expectAsyncCustomError, getTestConfig } from '../lib-test-utils.js';
import {
  SERVICE_HTTP_500_URL,
  SERVICE_UNREACHABLE_URL,
  TEST_CHAINS,
  getRandomAddress,
} from '../../test-utils.js';
import '../../jest-setup.js';
import { errors } from '../../../src/lib/index.js';

const { SmsCallError } = errors;

const testChain = TEST_CHAINS['arbitrum-sepolia-fork'];

describe('storage', () => {
  describe('pushStorageToken()', () => {
    test("throw a SmsCallError when the SMS can't be reached", async () => {
      const { iexec } = await getTestConfig(testChain)({
        options: {
          smsURL: SERVICE_UNREACHABLE_URL,
        },
      });
      await expectAsyncCustomError(
        iexec.storage.pushStorageToken('oops', 'dropbox'),
        {
          constructor: SmsCallError,
          message: `SMS error: Connection to ${SERVICE_UNREACHABLE_URL} failed with a network error`,
        },
      );
    });

    test('throw a SmsCallError when the SMS encounters an error', async () => {
      const { iexec } = await getTestConfig(testChain)({
        options: {
          smsURL: SERVICE_HTTP_500_URL,
        },
      });
      await expectAsyncCustomError(
        iexec.storage.pushStorageToken('oops', 'dropbox'),
        {
          constructor: SmsCallError,
          message: `SMS error: Server at ${SERVICE_HTTP_500_URL} encountered an internal error`,
        },
      );
    });

    test('provider "dropbox" pushes dropbox token', async () => {
      const { iexec, wallet } = await getTestConfig(testChain)();
      const pushRes = await iexec.storage.pushStorageToken('oops', 'dropbox');
      expect(pushRes.isPushed).toBe(true);
      expect(pushRes.isUpdated).toBe(false);
      await expect(
        iexec.storage.pushStorageToken('oops', 'dropbox'),
      ).rejects.toThrow(
        new Error(
          `Secret "iexec-result-dropbox-token" already exists for ${wallet.address}`,
        ),
      );
    });

    test('provider "ipfs" does not support token', async () => {
      const { iexec } = await getTestConfig(testChain)();
      await expect(
        iexec.storage.pushStorageToken('oops', 'ipfs'),
      ).rejects.toThrow(
        new Error(
          'Storage provider "ipfs" does not support authentication tokens',
        ),
      );
    });

    test('forceUpdate allows updating the token', async () => {
      const { iexec } = await getTestConfig(testChain)();
      const pushRes = await iexec.storage.pushStorageToken('oops', 'dropbox', {
        forceUpdate: true,
      });
      expect(pushRes.isPushed).toBe(true);
      expect(pushRes.isUpdated).toBe(false);
      const updateRes = await iexec.storage.pushStorageToken(
        'oops',
        'dropbox',
        {
          forceUpdate: true,
        },
      );
      expect(updateRes.isPushed).toBe(true);
      expect(updateRes.isUpdated).toBe(true);
    });
  });

  describe('checkStorageTokenExists()', () => {
    test("throw a SmsCallError when the SMS can't be reached", async () => {
      const { iexec: iexecReadOnly } = await getTestConfig(testChain)({
        options: {
          smsURL: SERVICE_UNREACHABLE_URL,
        },
      });
      await expectAsyncCustomError(
        iexecReadOnly.storage.checkStorageTokenExists(
          getRandomAddress(),
          'dropbox',
        ),
        {
          constructor: SmsCallError,
          message: `SMS error: Connection to ${SERVICE_UNREACHABLE_URL} failed with a network error`,
        },
      );
    });

    test('throw a SmsCallError when the SMS encounters an error', async () => {
      const { iexec: iexecReadOnly } = await getTestConfig(testChain)({
        options: {
          smsURL: SERVICE_HTTP_500_URL,
        },
      });
      await expectAsyncCustomError(
        iexecReadOnly.storage.checkStorageTokenExists(
          getRandomAddress(),
          'dropbox',
        ),
        {
          constructor: SmsCallError,
          message: `SMS error: Server at ${SERVICE_HTTP_500_URL} encountered an internal error`,
        },
      );
    });

    test('anyone can check a token exists', async () => {
      const { iexec, wallet } = await getTestConfig(testChain)();
      const { iexec: iexecReadOnly } = await getTestConfig(testChain)({
        readOnly: true,
      });
      const withoutSecretRes =
        await iexecReadOnly.storage.checkStorageTokenExists(
          wallet.address,
          'dropbox',
        );
      expect(withoutSecretRes).toBe(false);
      await iexec.storage.pushStorageToken('oops', 'dropbox');
      const withSecretRes = await iexecReadOnly.storage.checkStorageTokenExists(
        wallet.address,
        'dropbox',
      );
      expect(withSecretRes).toBe(true);
    });

    test('provider "ipfs" does not support token', async () => {
      const { iexec: iexecReadOnly } = await getTestConfig(testChain)({
        readOnly: true,
      });
      await expect(
        iexecReadOnly.storage.checkStorageTokenExists(
          getRandomAddress(),
          'ipfs',
        ),
      ).rejects.toThrow(
        new Error(
          `Storage provider "ipfs" does not support authentication tokens`,
        ),
      );
    });
  });
});
