// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import {
  TEST_CHAINS,
  createVoucher,
  createVoucherType,
  execAsync,
} from '../test-utils.js';
import {
  editApporder,
  editDatasetorder,
  editRequestorder,
  editWorkerpoolorder,
  globalSetup,
  globalTeardown,
  iexecPath,
  setChain,
  setRandomWallet,
} from './cli-test-utils.js';
import '../jest-setup.js';

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec order', () => {
  let userWallet;
  let userApp;
  let userDataset;
  let userWorkerpool;

  beforeAll(async () => {
    await globalSetup('cli-iexec-order');
    // init the project
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(testChain)();
    userWallet = await setRandomWallet();
    await execAsync(`${iexecPath} app init`);
    await execAsync(`${iexecPath} dataset init`);
    await execAsync(`${iexecPath} workerpool init`);
    userApp = await execAsync(`${iexecPath} app deploy --raw`).then(
      (res) => JSON.parse(res).address,
    );
    userDataset = await execAsync(`${iexecPath} dataset deploy --raw`).then(
      (res) => JSON.parse(res).address,
    );
    userWorkerpool = await execAsync(
      `${iexecPath} workerpool deploy --raw`,
    ).then((res) => JSON.parse(res).address);
  });
  afterAll(async () => {
    await globalTeardown();
  });

  test('iexec order init (no deployed.json)', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(`${iexecPath} order init --raw`);
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeDefined();
    expect(res.datasetorder).toBeDefined();
    expect(res.workerpoolorder).toBeDefined();
    expect(res.requestorder).toBeDefined();
    expect(res.requestorder.requester).toBe(userWallet.address);
    expect(res.requestorder.beneficiary).toBe(userWallet.address);
  });

  test('iexec order init --app ', async () => {
    const raw = await execAsync(`${iexecPath} order init --app --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeDefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.apporder.app).toBe(userApp);
  });

  test('iexec order init --dataset ', async () => {
    const raw = await execAsync(`${iexecPath} order init --dataset --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeDefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.datasetorder.dataset).toBe(userDataset);
  });

  test('iexec order init --workerpool', async () => {
    const raw = await execAsync(`${iexecPath} order init --workerpool --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeDefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.workerpoolorder.workerpool).toBe(userWorkerpool);
  });

  test('iexec order init --request', async () => {
    const raw = await execAsync(`${iexecPath} order init --request --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeDefined();
    expect(res.requestorder.requester).toBe(userWallet.address);
    expect(res.requestorder.beneficiary).toBe(userWallet.address);
  });

  test('iexec order sign', async () => {
    await execAsync(`${iexecPath} order init`);
    await editRequestorder({
      app: userApp,
      dataset: userDataset,
      workerpool: userWorkerpool,
      category: '0',
    });
    await editWorkerpoolorder({
      category: '0',
    });
    const raw = await execAsync(
      `${iexecPath} order sign --raw --skip-preflight-check`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeDefined();
    expect(res.datasetorder).toBeDefined();
    expect(res.workerpoolorder).toBeDefined();
    expect(res.requestorder).toBeDefined();
    expect(res.apporder.app).toBeDefined();
    expect(res.datasetorder.dataset).toBeDefined();
    expect(res.workerpoolorder.workerpool).toBeDefined();
    expect(res.requestorder.app).toBeDefined();

    await editRequestorder({
      tag: ['tee', 'scone'],
    });
    await editWorkerpoolorder({
      tag: ['tee'],
    });
    await editApporder({ tag: ['tee', 'scone'] });
    await editDatasetorder({ tag: ['tee', 'scone'] });
    const failRes = await execAsync(`${iexecPath} order sign --raw`).then(
      JSON.parse,
    );
    expect(failRes.ok).toBe(false);
    expect(failRes.fail).toStrictEqual([
      'apporder: App requirements check failed: Tag mismatch the TEE framework specified by app (If you consider this is not an issue, use --skip-preflight-check to skip preflight requirement check)',
      `datasetorder: Dataset requirements check failed: Dataset encryption key is not set for dataset ${userDataset} in the SMS. Dataset decryption will fail. (If you consider this is not an issue, use --skip-preflight-check to skip preflight requirement check)`,
      "workerpoolorder: 'tee' tag must be used with a tee framework ('scone'|'gramine')",
      `requestorder: Request requirements check failed: Dataset encryption key is not set for dataset ${userDataset} in the SMS. Dataset decryption will fail. (If you consider this is not an issue, use --skip-preflight-check to skip preflight requirement check)`,
    ]);
  });

  test('iexec order fill', async () => {
    const raw = await execAsync(
      `${iexecPath} order fill --skip-preflight-check --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.volume).toBe('1');
    expect(res.dealid).toBeDefined();
    expect(res.txHash).toBeDefined();
    await testChain.provider.getTransaction(res.txHash).then((tx) => {
      expect(tx.gasPrice.toString()).toBe('0');
    });
  });

  test('iexec order sign --app', async () => {
    await execAsync(`${iexecPath} order init --app`);
    const raw = await execAsync(`${iexecPath} order sign --app --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeDefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.apporder.app).toBeDefined();
  });

  test('iexec order sign --dataset', async () => {
    await execAsync(`${iexecPath} order init --dataset`);
    const raw = await execAsync(`${iexecPath} order sign --dataset --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeDefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.datasetorder.dataset).toBeDefined();
  });

  test('iexec order sign --workerpool', async () => {
    await execAsync(`${iexecPath} order init --workerpool`);
    await editWorkerpoolorder({
      category: 0,
      volume: '6',
    });
    const raw = await execAsync(`${iexecPath} order sign --workerpool --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeDefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.workerpoolorder.workerpool).toBeDefined();
  });

  test('iexec order sign --request', async () => {
    await execAsync(`${iexecPath} order init --request`);
    await editRequestorder({
      app: userApp,
      dataset: userDataset,
      workerpool: userWorkerpool,
      category: 0,
      volume: '5',
    });
    const raw = await execAsync(
      `${iexecPath} order sign --request --skip-preflight-check --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeDefined();
    expect(res.requestorder.app).toBeDefined();
  });

  test('iexec order fill (BoT 5)', async () => {
    const raw = await execAsync(
      `${iexecPath} order fill --skip-preflight-check --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.volume).toBe('5');
    expect(res.dealid).toBeDefined();
    expect(res.txHash).toBeDefined();
  });

  test('iexec order fill --params <params> --force', async () => {
    const raw = await execAsync(
      `${iexecPath} order fill --params 'arg --option "multiple words"' --skip-preflight-check --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.volume).toBe('1');
    expect(res.dealid).toBeDefined();
    expect(res.txHash).toBeDefined();
  });

  test('iexec order cancel --app', async () => {
    await execAsync(`${iexecPath} order sign --app --raw`);
    const raw = await execAsync(
      `${iexecPath} order cancel --app --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeDefined();
    expect(res.apporder.txHash).toBeDefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.fail).toBeUndefined();
    await testChain.provider.getTransaction(res.apporder.txHash).then((tx) => {
      expect(tx.gasPrice.toString()).toBe('0');
    });
  });

  test('iexec order cancel --dataset', async () => {
    await execAsync(`${iexecPath} order sign --dataset --raw`);
    const raw = await execAsync(
      `${iexecPath} order cancel --dataset --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeDefined();
    expect(res.datasetorder.txHash).toBeDefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.fail).toBeUndefined();
    await testChain.provider
      .getTransaction(res.datasetorder.txHash)
      .then((tx) => {
        expect(tx.gasPrice.toString()).toBe('0');
      });
  });

  test('iexec order cancel --workerpool', async () => {
    await execAsync(`${iexecPath} order sign --workerpool --raw`);
    const raw = await execAsync(
      `${iexecPath} order cancel --workerpool --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeDefined();
    expect(res.workerpoolorder.txHash).toBeDefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.fail).toBeUndefined();
    await testChain.provider
      .getTransaction(res.workerpoolorder.txHash)
      .then((tx) => {
        expect(tx.gasPrice.toString()).toBe('0');
      });
  });

  test('iexec order cancel --request', async () => {
    await execAsync(
      `${iexecPath} order sign --request --skip-preflight-check --raw`,
    );
    const raw = await execAsync(
      `${iexecPath} order cancel --request --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeDefined();
    expect(res.requestorder.txHash).toBeDefined();
    expect(res.fail).toBeUndefined();
    await testChain.provider
      .getTransaction(res.requestorder.txHash)
      .then((tx) => {
        expect(tx.gasPrice.toString()).toBe('0');
      });
  });

  describe('iexec order fill --use-voucher', () => {
    beforeAll(async () => {
      await execAsync(`${iexecPath} order init --app`);
      await execAsync(`${iexecPath} order sign --app --raw`);

      await execAsync(`${iexecPath} order init --dataset`);
      await execAsync(`${iexecPath} order sign --dataset --raw`);

      await execAsync(`${iexecPath} order init --workerpool`);
      await editWorkerpoolorder({
        category: 0,
        volume: '1',
      });
      await execAsync(`${iexecPath} order sign --workerpool --raw`);

      await execAsync(`${iexecPath} order init --request`);
      await editRequestorder({
        app: userApp,
        dataset: userDataset,
        workerpool: userWorkerpool,
        category: 0,
        volume: '1',
      });
      await execAsync(
        `${iexecPath} order sign --request --skip-preflight-check --raw`,
      );
    });

    test('fail without voucher', async () => {
      const raw = await execAsync(
        `${iexecPath} order fill --use-voucher --skip-preflight-check --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe(
        `No voucher available for the requester ${userWallet.address}`,
      );
    });

    test('should match orders with voucher', async () => {
      const voucherType = await createVoucherType(testChain)({});
      await createVoucher(testChain)({
        owner: userWallet.address,
        voucherType,
        value: 1000,
      });

      const raw = await execAsync(
        `${iexecPath} order fill --use-voucher --skip-preflight-check --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.volume).toBe('1');
      expect(res.dealid).toBeDefined();
      expect(res.txHash).toBeDefined();
      await testChain.provider.getTransaction(res.txHash).then((tx) => {
        expect(tx.gasPrice.toString()).toBe('0');
      });
    });
  });
});
