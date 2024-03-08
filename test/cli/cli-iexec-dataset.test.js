// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { TEST_CHAINS, execAsync, getRandomAddress } from '../test-utils';
import {
  setDatasetUniqueName,
  setChain,
  globalSetup,
  globalTeardown,
  setRandomWallet,
  iexecPath,
} from './cli-test-utils';

const DEFAULT_TIMEOUT = 120000;
jest.setTimeout(DEFAULT_TIMEOUT);

describe('iexec dataset', () => {
  let userWallet;
  let userFirstDeployedDataset;

  beforeAll(async () => {
    await globalSetup('iexec-dataset');
    // init the project
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(TEST_CHAINS['bellecour-fork'])();
    userWallet = await setRandomWallet();
    await execAsync(`${iexecPath} dataset init`);
    await setDatasetUniqueName();
    const deployed = await execAsync(`${iexecPath} dataset deploy --raw`).then(
      JSON.parse,
    );
    userFirstDeployedDataset = deployed.address;
  });
  afterAll(async () => {
    await globalTeardown();
  });

  describe('init', () => {
    test('iexec dataset init', async () => {
      const raw = await execAsync(`${iexecPath} dataset init --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.dataset).toBeDefined();
      expect(res.dataset.owner).toBe(userWallet.address);
    });
  });

  describe('deploy', () => {
    test('iexec dataset deploy', async () => {
      await execAsync(`${iexecPath} dataset init`);
      await setDatasetUniqueName();
      const raw = await execAsync(`${iexecPath} dataset deploy --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBeDefined();
      expect(res.txHash).toBeDefined();
    });
  });

  describe('show', () => {
    test('iexec dataset show (from deployed.json)', async () => {
      await execAsync(`${iexecPath} dataset init`);
      await setDatasetUniqueName();
      const { address } = await execAsync(
        `${iexecPath} dataset deploy --raw`,
      ).then(JSON.parse);
      const raw = await execAsync(`${iexecPath} dataset show --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(address);
      expect(res.dataset).toBeDefined();
      expect(res.dataset.owner).toBe(userWallet.address);
    });

    test('iexec dataset show 0 (current user)', async () => {
      const raw = await execAsync(`${iexecPath} dataset show 0 --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(userFirstDeployedDataset);
      expect(res.dataset).toBeDefined();
      expect(res.dataset.owner).toBe(userWallet.address);
    });

    test('iexec dataset show [datasetAddress]', async () => {
      const raw = await execAsync(
        `${iexecPath} dataset show ${userFirstDeployedDataset} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(userFirstDeployedDataset);
      expect(res.dataset).toBeDefined();
      expect(res.dataset.owner).toBe(userWallet.address);
    });
  });

  describe('count', () => {
    test('iexec dataset count (current user)', async () => {
      const raw = await execAsync(`${iexecPath} dataset count --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.count).toBeDefined();
      expect(res.count).not.toBe('0');
    });

    test('iexec dataset count --user [address]', async () => {
      const raw = await execAsync(
        `${iexecPath} dataset count --user ${getRandomAddress()} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.count).toBeDefined();
      expect(res.count).toBe('0');
    });
  });

  describe('transfer', () => {
    beforeAll(async () => {
      // dataset init
      await execAsync(`${iexecPath} dataset init`);
    });
    test('transfers the dataset ownership to', async () => {
      await setDatasetUniqueName();
      const { address } = await execAsync(
        `${iexecPath} dataset deploy --raw`,
      ).then(JSON.parse);
      const receiverAddress = getRandomAddress();
      const res = await execAsync(
        `${iexecPath} dataset transfer ${address} --to ${receiverAddress} --force --raw`,
      ).then(JSON.parse);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(address);
      expect(res.to).toBe(receiverAddress);
      expect(res.txHash).toBeDefined();
    });
  });
});
