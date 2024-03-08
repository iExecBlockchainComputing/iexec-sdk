// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import {
  TEST_CHAINS,
  execAsync,
  getRandomAddress,
  runIExecCliRaw,
} from '../test-utils';
import {
  setWorkerpoolUniqueDescription,
  setChain,
  globalSetup,
  globalTeardown,
  setRandomWallet,
  iexecPath,
} from './cli-test-utils';
import { bytes32Regex } from '../../src/common/utils/utils';

const DEFAULT_TIMEOUT = 120000;
jest.setTimeout(DEFAULT_TIMEOUT);

beforeAll(async () => {});

describe('iexec workerpool', () => {
  let userWallet;
  let userFirstDeployedWorkerpool;

  beforeAll(async () => {
    await globalSetup('iexec-workerpool');
    // init the project
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(TEST_CHAINS['bellecour-fork'])();
    userWallet = await setRandomWallet();
    await execAsync(`${iexecPath} workerpool init`);
    const deployed = await execAsync(
      `${iexecPath} workerpool deploy --raw`,
    ).then(JSON.parse);
    userFirstDeployedWorkerpool = deployed.address;
  });

  afterAll(async () => {
    await globalTeardown();
  });

  describe('init', () => {
    test('iexec workerpool init', async () => {
      const raw = await execAsync(`${iexecPath} workerpool init --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.workerpool).toBeDefined();
      expect(res.workerpool.owner).toBe(userWallet.address);
    });
  });

  describe('deploy', () => {
    test('iexec workerpool deploy', async () => {
      await setWorkerpoolUniqueDescription();
      const raw = await execAsync(`${iexecPath} workerpool deploy --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBeDefined();
      expect(res.txHash).toBeDefined();
    });
  });

  describe('set-api-url', () => {
    test('iexec workerpool set-api-url', async () => {
      await execAsync(
        `${iexecPath} ens register ${userFirstDeployedWorkerpool.toLowerCase()} --for ${userFirstDeployedWorkerpool}`,
      );
      const raw = await execAsync(
        `${iexecPath} workerpool set-api-url https://my-workerpool.com ${userFirstDeployedWorkerpool} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(userFirstDeployedWorkerpool);
      expect(res.url).toBe('https://my-workerpool.com');
      expect(res.txHash).toMatch(bytes32Regex);

      const showRes = await runIExecCliRaw(
        `${iexecPath} workerpool show ${userFirstDeployedWorkerpool}`,
      );
      expect(showRes.apiUrl).toBe('https://my-workerpool.com');
    });

    test('iexec workerpool set-api-url (fail no ENS)', async () => {
      await setWorkerpoolUniqueDescription();
      const { address } = await runIExecCliRaw(
        `${iexecPath} workerpool deploy`,
      );
      const raw = await execAsync(
        `${iexecPath} workerpool set-api-url https://my-workerpool.com --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.name).toBe('Error');
      expect(res.error.message).toBe(
        `Missing ENS for workerpool ${address}. You probably forgot to run "iexec ens register <name> --for ${address}"`,
      );
    });
  });

  describe('show', () => {
    test('iexec workerpool show 0 (current user)', async () => {
      const raw = await execAsync(`${iexecPath} workerpool show 0 --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(userFirstDeployedWorkerpool);
      expect(res.workerpool).toBeDefined();
      expect(res.workerpool.owner).toBe(userWallet.address);
    });

    test('iexec workerpool show [workerpoolAddress]', async () => {
      const raw = await execAsync(
        `${iexecPath} workerpool show ${userFirstDeployedWorkerpool} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(userFirstDeployedWorkerpool);
      expect(res.workerpool).toBeDefined();
      expect(res.workerpool.owner).toBe(userWallet.address);
    });

    test('iexec workerpool show 0 --user [address]', async () => {
      const raw = await execAsync(
        `${iexecPath} workerpool show 0 --user ${userWallet.address} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(userFirstDeployedWorkerpool);
      expect(res.workerpool).toBeDefined();
      expect(res.workerpool.owner).toBe(userWallet.address);
    });
  });

  describe('count', () => {
    test('iexec workerpool count (current user)', async () => {
      const raw = await execAsync(`${iexecPath} workerpool count --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.count).toBeDefined();
      expect(res.count).not.toBe('0');
    });

    test('iexec workerpool count --user [address]', async () => {
      const raw = await execAsync(
        `${iexecPath} workerpool count --user ${getRandomAddress()} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.count).toBeDefined();
      expect(res.count).toBe('0');
    });
  });

  describe('transfer', () => {
    test('transfers the workerpool ownership to', async () => {
      await setWorkerpoolUniqueDescription();
      const { address } = await execAsync(
        `${iexecPath} workerpool deploy --raw`,
      ).then(JSON.parse);
      const receiverAddress = getRandomAddress();
      const res = await execAsync(
        `${iexecPath} workerpool transfer ${address} --to ${receiverAddress} --force --raw`,
      ).then(JSON.parse);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(address);
      expect(res.to).toBe(receiverAddress);
      expect(res.txHash).toBeDefined();
    });
  });
});
