import { describe, test, expect } from '@jest/globals';
import {
  TEST_CHAINS,
  NULL_ADDRESS,
  execAsync,
  getRandomAddress,
} from '../test-utils.js';
import {
  setWorkerpoolUniqueDescription,
  setChain,
  globalSetup,
  globalTeardown,
  runIExecCliRaw,
  setRandomWallet,
  iexecPath,
} from './cli-test-utils.js';
import '../jest-setup.js';
import { encodeTag } from '../../src/lib/utils.js';
import { TDX_DEFAULT_TAG } from '../../src/common/utils/constant.js';

const testChain = TEST_CHAINS['arbitrum-sepolia-fork'];

describe('iexec workerpool', () => {
  let userWallet;
  let userFirstDeployedWorkerpoolAddress;

  beforeAll(async () => {
    await globalSetup('cli-iexec-workerpool');
    // init the project
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(testChain)();
    userWallet = await setRandomWallet(testChain)();
    await execAsync(`${iexecPath} workerpool init`);
    const deployed = await execAsync(
      `${iexecPath} workerpool deploy --raw`,
    ).then(JSON.parse);
    userFirstDeployedWorkerpoolAddress = deployed.address;
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

  describe('show', () => {
    test('iexec workerpool show 0 (current user)', async () => {
      const raw = await execAsync(`${iexecPath} workerpool show 0 --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(userFirstDeployedWorkerpoolAddress);
      expect(res.workerpool).toBeDefined();
      expect(res.workerpool.owner).toBe(userWallet.address);
    });

    test('iexec workerpool show [workerpoolAddress]', async () => {
      const raw = await execAsync(
        `${iexecPath} workerpool show ${userFirstDeployedWorkerpoolAddress} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(userFirstDeployedWorkerpoolAddress);
      expect(res.workerpool).toBeDefined();
      expect(res.workerpool.owner).toBe(userWallet.address);
    });

    test('iexec workerpool show 0 --user [address]', async () => {
      const raw = await execAsync(
        `${iexecPath} workerpool show 0 --user ${userWallet.address} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(userFirstDeployedWorkerpoolAddress);
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

  describe('publish', () => {
    test('from deployed', async () => {
      await setWorkerpoolUniqueDescription();
      const { address } = await runIExecCliRaw(
        `${iexecPath} workerpool deploy`,
      );
      const res = await runIExecCliRaw(
        `${iexecPath} workerpool publish --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.orderHash).toBeDefined();
      const orderShowRes = JSON.parse(
        await execAsync(
          `${iexecPath} order show --workerpool ${res.orderHash} --raw`,
        ),
      );
      expect(orderShowRes.workerpoolorder.order).toEqual({
        workerpool: address,
        workerpoolprice: 0,
        volume: 1,
        tag: TDX_DEFAULT_TAG,
        trust: 0,
        category: 0,
        apprestrict: NULL_ADDRESS,
        datasetrestrict: NULL_ADDRESS,
        requesterrestrict: NULL_ADDRESS,
        sign: orderShowRes.workerpoolorder.order.sign,
        salt: orderShowRes.workerpoolorder.order.salt,
      });
    });

    test('from workerpool address with options', async () => {
      const res = await runIExecCliRaw(
        `${iexecPath} workerpool publish ${userFirstDeployedWorkerpoolAddress} --price 0.000000002 RLC --volume 5 --tag tee,tdx --trust 20 --category 1 --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.orderHash).toBeDefined();
      const orderShowRes = JSON.parse(
        await execAsync(
          `${iexecPath} order show --workerpool ${res.orderHash} --raw`,
        ),
      );
      expect(orderShowRes.workerpoolorder.order).toEqual({
        workerpool: userFirstDeployedWorkerpoolAddress,
        workerpoolprice: 2,
        volume: 5,
        tag: encodeTag(['tee', 'tdx']),
        trust: 20,
        category: 1,
        apprestrict: NULL_ADDRESS,
        datasetrestrict: NULL_ADDRESS,
        requesterrestrict: NULL_ADDRESS,
        sign: orderShowRes.workerpoolorder.order.sign,
        salt: orderShowRes.workerpoolorder.order.salt,
      });
    });
  });

  describe('unpublish', () => {
    test('latest from deployed', async () => {
      await setWorkerpoolUniqueDescription();
      await runIExecCliRaw(`${iexecPath} workerpool deploy`);
      await runIExecCliRaw(`${iexecPath} workerpool publish --force`);
      const { orderHash: lastOrderHash } = await runIExecCliRaw(
        `${iexecPath} workerpool publish --force`,
      );
      const res = await runIExecCliRaw(
        `${iexecPath} workerpool unpublish --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.unpublished).toBe(lastOrderHash);
      await runIExecCliRaw(`${iexecPath} workerpool unpublish --force`);
      const resErr = await runIExecCliRaw(
        `${iexecPath} workerpool unpublish --force`,
      );
      expect(resErr.ok).toBe(false);
    });

    test('from workerpool address --all', async () => {
      const { orderHash } = await runIExecCliRaw(
        `${iexecPath} workerpool publish ${userFirstDeployedWorkerpoolAddress} --force`,
      );
      const { orderHash: lastOrderHash } = await runIExecCliRaw(
        `${iexecPath} workerpool publish ${userFirstDeployedWorkerpoolAddress} --force`,
      );
      const res = await runIExecCliRaw(
        `${iexecPath} workerpool unpublish ${userFirstDeployedWorkerpoolAddress} --all --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.unpublished).toEqual(
        expect.arrayContaining([orderHash, lastOrderHash]),
      );
      const resErr = await runIExecCliRaw(
        `${iexecPath} workerpool unpublish --all --force --raw`,
      );
      expect(resErr.ok).toBe(false);
    });
  });
});
