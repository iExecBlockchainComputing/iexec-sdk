// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { TEST_CHAINS, execAsync, getRandomAddress } from '../test-utils';
import {
  globalSetup,
  globalTeardown,
  iexecPath,
  setChain,
  setRandomWallet,
} from './cli-test-utils';
import { TEE_FRAMEWORKS } from '../../src/common/utils/constant';

const DEFAULT_TIMEOUT = 120000;
jest.setTimeout(DEFAULT_TIMEOUT);

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec requester', () => {
  let userWallet;

  beforeAll(async () => {
    await globalSetup('cli-iexec-requester');
    // init the project
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(testChain)();
    userWallet = await setRandomWallet();
  });
  afterAll(async () => {
    await globalTeardown();
  });

  describe('check-secret / push-secret', () => {
    test('requester secret', async () => {
      // check own
      const checkOwnNotPushed = JSON.parse(
        await execAsync(`${iexecPath} requester check-secret foo --raw`),
      );
      expect(checkOwnNotPushed.ok).toBe(true);
      expect(checkOwnNotPushed.name).toBe('foo');
      expect(checkOwnNotPushed.isSet).toBe(false);

      // push
      const push = JSON.parse(
        await execAsync(
          `${iexecPath} requester push-secret foo --secret-value FOO --raw`,
        ),
      );
      expect(push.ok).toBe(true);
      expect(push.name).toBe('foo');
      expect(push.isPushed).toBe(true);
      // cannot update requester secret
      const pushUpdate = JSON.parse(
        await execAsync(
          `${iexecPath} requester push-secret foo --secret-value FOOD --raw`,
        ).catch((err) => err.message),
      );
      expect(pushUpdate.ok).toBe(false);

      // check own pushed
      const checkOwnPushed = JSON.parse(
        await execAsync(`${iexecPath} requester check-secret foo --raw`),
      );
      expect(checkOwnPushed.ok).toBe(true);
      expect(checkOwnPushed.name).toBe('foo');
      expect(checkOwnPushed.isSet).toBe(true);

      // anyone can check-secret
      const checkNotPushed = JSON.parse(
        await execAsync(
          `${iexecPath} requester check-secret foo ${getRandomAddress()} --raw`,
        ),
      );
      expect(checkNotPushed.ok).toBe(true);
      expect(checkNotPushed.name).toBe('foo');
      expect(checkNotPushed.isSet).toBe(false);

      const checkPushed = JSON.parse(
        await execAsync(
          `${iexecPath} requester check-secret foo ${userWallet.address} --raw`,
        ),
      );
      expect(checkPushed.ok).toBe(true);
      expect(checkPushed.name).toBe('foo');
      expect(checkPushed.isSet).toBe(true);

      // check secret TEE framework validation
      await expect(
        execAsync(
          `${iexecPath} requester check-secret foo ${userWallet.address} --tee-framework tee --raw`,
        ),
      ).rejects.toThrow();

      // check secret TEE framework override
      const checkOtherFramework = JSON.parse(
        await execAsync(
          `${iexecPath} requester check-secret foo ${userWallet.address} --tee-framework ${TEE_FRAMEWORKS.GRAMINE} --raw`,
        ),
      );
      expect(checkOtherFramework.ok).toBe(true);
      expect(checkOtherFramework.name).toBe('foo');
      expect(checkOtherFramework.isSet).toBe(false);

      // push secret TEE framework override
      const pushOtherFramework = JSON.parse(
        await execAsync(
          `${iexecPath} requester push-secret foo --secret-value foo --tee-framework ${TEE_FRAMEWORKS.GRAMINE} --raw`,
        ),
      );
      expect(pushOtherFramework.ok).toBe(true);
      const checkOtherFrameworkPushed = JSON.parse(
        await execAsync(
          `${iexecPath} requester check-secret foo ${userWallet.address} --tee-framework ${TEE_FRAMEWORKS.GRAMINE} --raw`,
        ),
      );
      expect(checkOtherFrameworkPushed.ok).toBe(true);
      expect(checkOtherFrameworkPushed.name).toBe('foo');
      expect(checkOtherFrameworkPushed.isSet).toBe(true);
    });
  });
});
