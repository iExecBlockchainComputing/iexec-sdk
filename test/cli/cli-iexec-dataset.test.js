// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { TEST_CHAINS, execAsync, getRandomAddress } from '../test-utils';
import {
  setDatasetUniqueName,
  setChain,
  globalSetup,
  globalTeardown,
  runIExecCliRaw,
  setRandomWallet,
  iexecPath,
} from './cli-test-utils';
import { NULL_ADDRESS, NULL_BYTES32 } from '../../src/common/utils/constant';

const DEFAULT_TIMEOUT = 120000;
jest.setTimeout(DEFAULT_TIMEOUT);

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec dataset', () => {
  let userWallet;
  let userFirstDeployedDatasetAddress;

  beforeAll(async () => {
    await globalSetup('iexec-dataset');
    // init the project
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(testChain)();
    userWallet = await setRandomWallet();
    await execAsync(`${iexecPath} dataset init`);
    await setDatasetUniqueName();
    const deployed = await runIExecCliRaw(`${iexecPath} dataset deploy`);
    userFirstDeployedDatasetAddress = deployed.address;
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
      const tx = await testChain.provider.getTransaction(res.txHash);
      expect(tx).toBeDefined();
      expect(tx.gasPrice.toString()).toBe('0');
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
      expect(res.address).toBe(userFirstDeployedDatasetAddress);
      expect(res.dataset).toBeDefined();
      expect(res.dataset.owner).toBe(userWallet.address);
    });

    test('iexec dataset show [datasetAddress]', async () => {
      const raw = await execAsync(
        `${iexecPath} dataset show ${userFirstDeployedDatasetAddress} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(userFirstDeployedDatasetAddress);
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

  describe('publish', () => {
    test('from deployed', async () => {
      await setDatasetUniqueName();
      const { address } = await runIExecCliRaw(`${iexecPath} dataset deploy`);
      const res = await runIExecCliRaw(`${iexecPath} dataset publish --force`);
      expect(res.ok).toBe(true);
      expect(res.orderHash).toBeDefined();
      const orderShowRes = JSON.parse(
        await execAsync(
          `${iexecPath} order show --dataset ${res.orderHash} --raw`,
        ),
      );
      expect(orderShowRes.datasetorder.order).toEqual({
        dataset: address,
        datasetprice: 0,
        volume: 1000000,
        tag: NULL_BYTES32,
        apprestrict: NULL_ADDRESS,
        workerpoolrestrict: NULL_ADDRESS,
        requesterrestrict: NULL_ADDRESS,
        sign: orderShowRes.datasetorder.order.sign,
        salt: orderShowRes.datasetorder.order.salt,
      });
    });

    test('from dataset address with options', async () => {
      const appAddress = getRandomAddress();
      await expect(
        execAsync(
          `${iexecPath} dataset publish ${userFirstDeployedDatasetAddress} --price 0.1 RLC --volume 100 --tag tee,scone --app-restrict ${appAddress} --force`,
        ),
      ).rejects.toThrow(
        `Dataset encryption key is not set for dataset ${userFirstDeployedDatasetAddress} in the SMS. Dataset decryption will fail.`,
      );
      const res = await runIExecCliRaw(
        `${iexecPath} dataset publish ${userFirstDeployedDatasetAddress} --price 0.1 RLC --volume 100 --app-restrict ${appAddress} --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.orderHash).toBeDefined();
      const orderShowRes = JSON.parse(
        await execAsync(
          `${iexecPath} order show --dataset ${res.orderHash} --raw`,
        ),
      );
      expect(orderShowRes.datasetorder.order).toEqual({
        dataset: userFirstDeployedDatasetAddress,
        datasetprice: 100000000,
        volume: 100,
        tag: '0x0000000000000000000000000000000000000000000000000000000000000000',
        apprestrict: appAddress,
        workerpoolrestrict: NULL_ADDRESS,
        requesterrestrict: NULL_ADDRESS,
        sign: orderShowRes.datasetorder.order.sign,
        salt: orderShowRes.datasetorder.order.salt,
      });
    });
  });

  describe('unpublish', () => {
    test('latest from deployed', async () => {
      await setDatasetUniqueName();
      await runIExecCliRaw(`${iexecPath} dataset deploy`);
      await runIExecCliRaw(`${iexecPath} dataset publish --force`);
      const { orderHash: lastOrderHash } = await runIExecCliRaw(
        `${iexecPath} dataset publish --force`,
      );
      const res = await runIExecCliRaw(
        `${iexecPath} dataset unpublish --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.unpublished).toBe(lastOrderHash);
      await runIExecCliRaw(`${iexecPath} dataset unpublish --force`);
      const resErr = await runIExecCliRaw(
        `${iexecPath} dataset unpublish --force`,
      );
      expect(resErr.ok).toBe(false);
    });

    test('from dataset address --all', async () => {
      const { orderHash } = await runIExecCliRaw(
        `${iexecPath} dataset publish ${userFirstDeployedDatasetAddress} --force`,
      );
      const { orderHash: lastOrderHash } = await runIExecCliRaw(
        `${iexecPath} dataset publish ${userFirstDeployedDatasetAddress} --force`,
      );
      const res = await runIExecCliRaw(
        `${iexecPath} dataset unpublish ${userFirstDeployedDatasetAddress} --all --force`,
      );
      expect(res.ok).toBe(true);
      expect(res.unpublished).toEqual(
        expect.arrayContaining([orderHash, lastOrderHash]),
      );
      const resErr = await runIExecCliRaw(
        `${iexecPath} dataset unpublish --all --force --raw`,
      );
      expect(resErr.ok).toBe(false);
    });
  });
});
