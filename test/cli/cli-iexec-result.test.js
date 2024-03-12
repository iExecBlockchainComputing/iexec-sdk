// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { TEE_FRAMEWORKS } from '../../src/common/utils/constant';
import { TEST_CHAINS, execAsync, getRandomAddress } from '../test-utils';
import {
  globalSetup,
  globalTeardown,
  iexecPath,
  runIExecCliRaw,
  setChain,
  setRandomWallet,
} from './cli-test-utils';

const DEFAULT_TIMEOUT = 10000;
jest.setTimeout(DEFAULT_TIMEOUT);

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec result', () => {
  let userWallet;

  beforeAll(async () => {
    await globalSetup('cli-iexec-result');
    // init the project
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(testChain)();
  });
  afterAll(async () => {
    await globalTeardown();
  });

  beforeEach(async () => {
    userWallet = await setRandomWallet();
  });

  describe('generate-encryption-keypair', () => {
    test('iexec result generate-encryption-keypair', async () => {
      const raw = await execAsync(
        `${iexecPath} result generate-encryption-keypair --force --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.secretPath).toBeDefined();
      expect(res.secretPath.indexOf('.secrets/beneficiary')).not.toBe(-1);
      expect(res.privateKeyFile).toBe(`${userWallet.address}_key`);
      expect(res.publicKeyFile).toBe(`${userWallet.address}_key.pub`);
    });

    test('iexec result generate-keys (v4 legacy name)', async () => {
      const raw = await execAsync(
        `${iexecPath} result generate-keys --force --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.secretPath).toBeDefined();
      expect(res.secretPath.indexOf('.secrets/beneficiary')).not.toBe(-1);
      expect(res.privateKeyFile).toBe(`${userWallet.address}_key`);
      expect(res.publicKeyFile).toBe(`${userWallet.address}_key.pub`);
    });
  });

  describe('push-encryption-key', () => {
    test('iexec result push-encryption-key', async () => {
      await execAsync(
        `${iexecPath} result generate-encryption-keypair --force`,
      );
      const raw = await execAsync(
        `${iexecPath} result push-encryption-key --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.isPushed).toBe(true);
      expect(res.isUpdated).toBe(false);
      const rawAlreadyExists = await execAsync(
        `${iexecPath} result push-encryption-key --raw`,
      ).catch((e) => e.message);
      const resAlreadyExists = JSON.parse(rawAlreadyExists);
      expect(resAlreadyExists.ok).toBe(false);
      const rawAlreadyExistsForTeeFramework = await execAsync(
        `${iexecPath} result push-encryption-key --tee-framework scone --raw`,
      ).catch((e) => e.message);
      const resAlreadyExistsForTeeFramework = JSON.parse(
        rawAlreadyExistsForTeeFramework,
      );
      expect(resAlreadyExistsForTeeFramework.ok).toBe(false);
      const resNotExistsForTeeFramework = JSON.parse(
        await execAsync(
          `${iexecPath} result push-encryption-key --tee-framework gramine --raw`,
        ),
      );
      expect(resNotExistsForTeeFramework.ok).toBe(true);
      expect(resNotExistsForTeeFramework.isPushed).toBe(true);
      expect(resNotExistsForTeeFramework.isUpdated).toBe(false);
    });

    test('iexec result push-encryption-key --force-update', async () => {
      await execAsync(
        `${iexecPath} result generate-encryption-keypair --force`,
      );
      const raw = await execAsync(
        `${iexecPath} result push-encryption-key --force-update --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.isPushed).toBe(true);
      expect(res.isUpdated).toBe(false);
      const rawAlreadyExists = await execAsync(
        `${iexecPath} result push-encryption-key --force-update --raw`,
      );
      const resAlreadyExists = JSON.parse(rawAlreadyExists);
      expect(resAlreadyExists.ok).toBe(true);
      expect(resAlreadyExists.isPushed).toBe(true);
      expect(resAlreadyExists.isUpdated).toBe(true);
    });

    test('push-secret (v4 legacy name)', async () => {
      await execAsync(
        `${iexecPath} result generate-encryption-keypair --force`,
      );
      const raw = await execAsync(`${iexecPath} result push-secret --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
    });
  });

  describe('check-encryption-key', () => {
    test('iexec result check-encryption-key', async () => {
      const rawUserKey = await execAsync(
        `${iexecPath} result check-encryption-key ${getRandomAddress()} --raw`,
      );
      const resUserKey = JSON.parse(rawUserKey);
      expect(resUserKey.ok).toBe(true);
      expect(resUserKey.isEncryptionKeySet).toBe(false);
      await execAsync(
        `${iexecPath} result generate-encryption-keypair --force`,
      );
      await runIExecCliRaw(`${iexecPath} result push-secret`);
      const rawExists = await execAsync(
        `${iexecPath} result check-encryption-key --raw`,
      );
      const resExists = JSON.parse(rawExists);
      expect(resExists.ok).toBe(true);
      expect(resExists.isEncryptionKeySet).toBe(true);

      const rawExistsOnTeeFramework = await execAsync(
        `${iexecPath} result check-encryption-key --tee-framework ${TEE_FRAMEWORKS.SCONE} --raw`,
      );
      const resExistsOnTeeFramework = JSON.parse(rawExistsOnTeeFramework);
      expect(resExistsOnTeeFramework.ok).toBe(true);
      expect(resExistsOnTeeFramework.isEncryptionKeySet).toBe(true);

      const rawNotExistsOnTeeFramework = await execAsync(
        `${iexecPath} result check-encryption-key --tee-framework ${TEE_FRAMEWORKS.GRAMINE} --raw`,
      );
      const resNotExistsOnTeeFramework = JSON.parse(rawNotExistsOnTeeFramework);
      expect(resNotExistsOnTeeFramework.ok).toBe(true);
      expect(resNotExistsOnTeeFramework.isEncryptionKeySet).toBe(false);
    });

    test('check-secret (v4 legacy name)', async () => {
      const rawUserKey = await execAsync(
        `${iexecPath} result check-secret ${getRandomAddress()} --raw`,
      );
      const resUserKey = JSON.parse(rawUserKey);
      expect(resUserKey.ok).toBe(true);
      expect(resUserKey.isEncryptionKeySet).toBe(false);
    });
  });

  describe('decrypt', () => {
    test('iexec result decrypt --force ', async () => {
      await execAsync('mkdir -p .secrets/beneficiary');
      await execAsync(
        `cp ../../inputs/beneficiaryKeys/expected_key ./.secrets/beneficiary/${userWallet.address}_key`,
      );
      const raw = await execAsync(
        `${iexecPath} result decrypt ../../inputs/encryptedResults/encryptedResults.zip --force --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.resultsPath).toBeDefined();
      expect(res.resultsPath.indexOf('results.zip')).not.toBe(-1);
    });

    test('iexec result decrypt --force (wrong beneficiary key)', async () => {
      await execAsync('mkdir -p .secrets/beneficiary');
      await execAsync(
        `cp ../../inputs/beneficiaryKeys/unexpected_key ./.secrets/beneficiary/${userWallet.address}_key`,
      );
      const raw = await execAsync(
        `${iexecPath} result decrypt ../../inputs/encryptedResults/encryptedResults.zip --force --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.resultsPath).toBeUndefined();
      expect(res.error).toBeDefined();
      expect(
        res.error.message.indexOf('Failed to decrypt results key'),
      ).not.toBe(-1);
      expect(res.error.name).toBe('Error');
    });

    test('iexec result decrypt --beneficiary-keystoredir <path> --beneficiary-key-file <fileName> --force ', async () => {
      const raw = await execAsync(
        `${iexecPath} result decrypt ../../inputs/encryptedResults/encryptedResults.zip --beneficiary-keystoredir ../../inputs/beneficiaryKeys/ --beneficiary-key-file 0xC08C3def622Af1476f2Db0E3CC8CcaeAd07BE3bB_key --force --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.resultsPath).toBeDefined();
      expect(res.resultsPath.indexOf('results.zip')).not.toBe(-1);
    });
  });
});
