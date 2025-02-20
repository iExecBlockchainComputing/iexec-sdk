// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import { expectAsyncCustomError, getTestConfig } from '../lib-test-utils.js';
import {
  SERVICE_HTTP_500_URL,
  SERVICE_UNREACHABLE_URL,
  TEE_FRAMEWORKS,
  TEST_CHAINS,
  getRandomAddress,
} from '../../test-utils.js';
import '../../jest-setup.js';
import { errors } from '../../../src/lib/index.js';

const { SmsCallError, ResultProxyCallError } = errors;

const iexecTestChain = TEST_CHAINS['bellecour-fork'];

describe('storage', () => {
  describe('defaultStorageLogin()', () => {
    test("throw a ResultProxyCallError when the Result Proxy can't be reached", async () => {
      const { iexec } = getTestConfig(iexecTestChain)({
        options: {
          resultProxyURL: SERVICE_UNREACHABLE_URL,
        },
      });
      await expectAsyncCustomError(iexec.storage.defaultStorageLogin(), {
        constructor: ResultProxyCallError,
        message: `Result Proxy error: Connection to ${SERVICE_UNREACHABLE_URL} failed with a network error`,
      });
    });

    test('throw a ResultProxyCallError when the Result Proxy encounters an error', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({
        options: {
          resultProxyURL: SERVICE_HTTP_500_URL,
        },
      });
      await expectAsyncCustomError(iexec.storage.defaultStorageLogin(), {
        constructor: ResultProxyCallError,
        message: `Result Proxy error: Server at ${SERVICE_HTTP_500_URL} encountered an internal error`,
      });
    });

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
    test("throw a SmsCallError when the SMS can't be reached", async () => {
      const { iexec } = getTestConfig(iexecTestChain)({
        options: {
          smsURL: SERVICE_UNREACHABLE_URL,
        },
      });
      await expectAsyncCustomError(iexec.storage.pushStorageToken('oops'), {
        constructor: SmsCallError,
        message: `SMS error: Connection to ${SERVICE_UNREACHABLE_URL} failed with a network error`,
      });
    });

    test('throw a SmsCallError when the SMS encounters an error', async () => {
      const { iexec } = getTestConfig(iexecTestChain)({
        options: {
          smsURL: SERVICE_HTTP_500_URL,
        },
      });
      await expectAsyncCustomError(iexec.storage.pushStorageToken('oops'), {
        constructor: SmsCallError,
        message: `SMS error: Server at ${SERVICE_HTTP_500_URL} encountered an internal error`,
      });
    });

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
      await expect(
        iexec.storage.pushStorageToken('oops', {
          teeFramework: TEE_FRAMEWORKS.SCONE,
        }),
      ).rejects.toThrow(
        Error(
          `Secret "iexec-result-iexec-ipfs-token" already exists for ${wallet.address}`,
        ),
      );
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
    test("throw a SmsCallError when the SMS can't be reached", async () => {
      const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
        options: {
          smsURL: SERVICE_UNREACHABLE_URL,
        },
      });
      await expectAsyncCustomError(
        iexecReadOnly.storage.checkStorageTokenExists(getRandomAddress()),
        {
          constructor: SmsCallError,
          message: `SMS error: Connection to ${SERVICE_UNREACHABLE_URL} failed with a network error`,
        },
      );
    });

    test('throw a SmsCallError when the SMS encounters an error', async () => {
      const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
        options: {
          smsURL: SERVICE_HTTP_500_URL,
        },
      });
      await expectAsyncCustomError(
        iexecReadOnly.storage.checkStorageTokenExists(getRandomAddress()),
        {
          constructor: SmsCallError,
          message: `SMS error: Server at ${SERVICE_HTTP_500_URL} encountered an internal error`,
        },
      );
    });

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
    });
  });
});
