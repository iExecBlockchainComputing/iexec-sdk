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
  editCategory,
  globalSetup,
  globalTeardown,
  iexecPath,
  setAppUniqueName,
  setChain,
  setChainsPocoAdminWallet,
  setRandomWallet,
  setWallet,
} from './cli-test-utils';
import { NULL_ADDRESS, NULL_BYTES32 } from '../../src/common/utils/constant';

const DEFAULT_TIMEOUT = 120000;
jest.setTimeout(DEFAULT_TIMEOUT);

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec app', () => {
  let userWallet;
  let userFirstDeployedApp;

  beforeAll(async () => {
    await globalSetup('iexec-app');
    // init the project
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(testChain)();

    userWallet = await setRandomWallet();
    await execAsync(`${iexecPath} app init`);
    await setAppUniqueName();
    const deployed = await execAsync(`${iexecPath} app deploy --raw`).then(
      JSON.parse,
    );
    userFirstDeployedApp = deployed.address;
  });

  afterAll(async () => {
    await globalTeardown();
  });

  describe('init', () => {
    test('iexec app init', async () => {
      const raw = await execAsync(`${iexecPath} app init --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.app).toBeDefined();
      expect(res.app.owner).toBe(userWallet.address);
      expect(res.app.mrenclave).toBeUndefined();
    });

    test('--tee', async () => {
      const raw = await execAsync(`${iexecPath} app init --tee --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.app).toBeDefined();
      expect(res.app.mrenclave).toBeDefined();
      expect(res.app.mrenclave.framework).toBe('SCONE');
    });

    test('--tee-framework gramine', async () => {
      const raw = await execAsync(
        `${iexecPath} app init --tee-framework gramine --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.app).toBeDefined();
      expect(res.app.mrenclave).toBeDefined();
      expect(res.app.mrenclave.framework).toBe('GRAMINE');
    });

    test('--tee-framework scone', async () => {
      const raw = await execAsync(
        `${iexecPath} app init --tee-framework scone --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.app).toBeDefined();
      expect(res.app.mrenclave).toBeDefined();
      expect(res.app.mrenclave.framework).toBe('SCONE');
    });
  });

  describe('deploy', () => {
    test('iexec app deploy', async () => {
      await execAsync(`${iexecPath} app init --tee --raw`);
      await setAppUniqueName();
      const raw = await execAsync(`${iexecPath} app deploy --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBeDefined();
      expect(res.txHash).toBeDefined();
    });
  });

  describe('show', () => {
    test('iexec app show (from deployed.json)', async () => {
      await execAsync(`${iexecPath} app init --tee --raw`);
      await setAppUniqueName();
      const { address } = await execAsync(`${iexecPath} app deploy --raw`).then(
        JSON.parse,
      );
      const raw = await execAsync(`${iexecPath} app show --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(address);
      expect(res.app).toBeDefined();
      expect(res.app.owner).toBe(userWallet.address);
    });

    test('iexec app show [index] (of current user)', async () => {
      const raw = await execAsync(`${iexecPath} app show 0 --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(userFirstDeployedApp);
      expect(res.app).toBeDefined();
      expect(res.app.owner).toBe(userWallet.address);
    });

    test('iexec app show [appAddress]', async () => {
      const raw = await execAsync(
        `${iexecPath} app show ${userFirstDeployedApp} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(userFirstDeployedApp);
      expect(res.app).toBeDefined();
      expect(res.app.owner).toBe(userWallet.address);
    });
  });

  describe('count', () => {
    test('iexec app count (current user)', async () => {
      const raw = await execAsync(`${iexecPath} app count --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.count).toBeDefined();
      expect(res.count).not.toBe('0');
    });

    test('iexec app count --user [address]', async () => {
      const raw = await execAsync(
        `${iexecPath} app count --user ${getRandomAddress()} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.count).toBeDefined();
      expect(res.count).toBe('0');
    });
  });

  describe('transfer', () => {
    test('transfers the app ownership to', async () => {
      await execAsync(`${iexecPath} app init`);
      await setAppUniqueName();
      const { address } = await execAsync(`${iexecPath} app deploy --raw`).then(
        JSON.parse,
      );
      const receiverAddress = getRandomAddress();
      const res = await execAsync(
        `${iexecPath} app transfer ${address} --to ${receiverAddress} --force --raw`,
      ).then(JSON.parse);
      expect(res.ok).toBe(true);
      expect(res.address).toBe(address);
      expect(res.to).toBe(receiverAddress);
      expect(res.txHash).toBeDefined();
    });
  });

  describe('run', () => {
    let userApp;
    let userWokerpool;
    let userDataset;
    let noDurationCatid;
    beforeAll(async () => {
      // create category (require admin wallet)
      await setChainsPocoAdminWallet(testChain)();
      await execAsync(`${iexecPath} category init --raw`);
      await editCategory({ workClockTimeRef: '0' });
      const createCatRes = await runIExecCliRaw(`${iexecPath} category create`);
      noDurationCatid = createCatRes.catid;
      // restore user wallet
      await setWallet(userWallet.privateKey);
      await execAsync(`${iexecPath} app init`);
      await setAppUniqueName();
      await execAsync(`${iexecPath} dataset init`);
      await execAsync(`${iexecPath} workerpool init`);
      userApp = await execAsync(`${iexecPath} app deploy --raw`).then(
        (res) => JSON.parse(res).address,
      );
      userDataset = await execAsync(`${iexecPath} dataset deploy --raw`).then(
        (res) => JSON.parse(res).address,
      );
      userWokerpool = await execAsync(
        `${iexecPath} workerpool deploy --raw`,
      ).then((res) => JSON.parse(res).address);
    });

    test('iexec app run --workerpool deployed', async () => {
      const raw = await execAsync(
        `${iexecPath} app run --workerpool deployed --skip-preflight-check --force --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.deals).toBeDefined();
      expect(res.deals.length).toBe(1);
      expect(res.deals[0].volume).toBe('1');
      expect(res.deals[0].dealid).toBeDefined();
      expect(res.deals[0].txHash).toBeDefined();

      const rawDeal = await execAsync(
        `${iexecPath} deal show ${res.deals[0].dealid} --raw`,
      );
      const resDeal = JSON.parse(rawDeal);
      expect(resDeal.ok).toBe(true);
      expect(resDeal.deal).toBeDefined();
      expect(resDeal.deal.app.pointer).toBe(userApp);
      expect(resDeal.deal.app.price).toBe('0');
      expect(resDeal.deal.dataset.pointer).toBe(NULL_ADDRESS);
      expect(resDeal.deal.dataset.price).toBe('0');
      expect(resDeal.deal.workerpool.pointer).toBe(userWokerpool);
      expect(resDeal.deal.workerpool.price).toBe('0');
      expect(resDeal.deal.category).toBe('0');
      expect(resDeal.deal.params).toBe(
        `{"iexec_result_storage_provider":"ipfs","iexec_result_storage_proxy":"${testChain.resultProxyURL}"}`,
      );
      expect(resDeal.deal.callback).toBe(NULL_ADDRESS);
      expect(resDeal.deal.requester).toBe(userWallet.address);
      expect(resDeal.deal.beneficiary).toBe(userWallet.address);
      expect(resDeal.deal.botFirst).toBe('0');
      expect(resDeal.deal.botSize).toBe('1');
      expect(resDeal.deal.tag).toBe(NULL_BYTES32);
      expect(resDeal.deal.trust).toBe('1');
      expect(Object.keys(resDeal.deal.tasks).length).toBe(1);
      expect(resDeal.deal.tasks['0']).toBeDefined();
    });

    test('iexec app run --workerpool deployed --dataset 0x0000000000000000000000000000000000000000', async () => {
      const raw = await execAsync(
        `${iexecPath} app run --workerpool deployed --dataset 0x0000000000000000000000000000000000000000 --skip-preflight-check --force --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.deals).toBeDefined();
      expect(res.deals.length).toBe(1);
      expect(res.deals[0].volume).toBe('1');
      expect(res.deals[0].dealid).toBeDefined();
      expect(res.deals[0].txHash).toBeDefined();

      const rawDeal = await execAsync(
        `${iexecPath} deal show ${res.deals[0].dealid} --raw`,
      );
      const resDeal = JSON.parse(rawDeal);
      expect(resDeal.ok).toBe(true);
      expect(resDeal.deal).toBeDefined();
      expect(resDeal.deal.app.pointer).toBe(userApp);
      expect(resDeal.deal.app.price).toBe('0');
      expect(resDeal.deal.dataset.pointer).toBe(NULL_ADDRESS);
      expect(resDeal.deal.dataset.price).toBe('0');
      expect(resDeal.deal.workerpool.pointer).toBe(userWokerpool);
      expect(resDeal.deal.workerpool.price).toBe('0');
      expect(resDeal.deal.category).toBe('0');
      expect(resDeal.deal.params).toBe(
        `{"iexec_result_storage_provider":"ipfs","iexec_result_storage_proxy":"${testChain.resultProxyURL}"}`,
      );
      expect(resDeal.deal.callback).toBe(NULL_ADDRESS);
      expect(resDeal.deal.requester).toBe(userWallet.address);
      expect(resDeal.deal.beneficiary).toBe(userWallet.address);
      expect(resDeal.deal.botFirst).toBe('0');
      expect(resDeal.deal.botSize).toBe('1');
      expect(resDeal.deal.tag).toBe(NULL_BYTES32);
      expect(resDeal.deal.trust).toBe('1');
      expect(Object.keys(resDeal.deal.tasks).length).toBe(1);
      expect(resDeal.deal.tasks['0']).toBeDefined();
    });

    test('iexec app run --workerpool deployed --dataset deployed --params <params> --tag <tag> --category <catid> --beneficiary <address> --callback <address>', async () => {
      const beneficiary = getRandomAddress();
      const raw = await execAsync(
        `${iexecPath} app run --workerpool deployed --dataset deployed --params '{"iexec_args":"test params"}' --tag tee,scone,gpu --category 1 --beneficiary 0x0000000000000000000000000000000000000000 --callback ${beneficiary} --skip-preflight-check --force --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.deals).toBeDefined();
      expect(res.deals.length).toBe(1);
      expect(res.deals[0].volume).toBe('1');
      expect(res.deals[0].dealid).toBeDefined();
      expect(res.deals[0].txHash).toBeDefined();

      const rawDeal = await execAsync(
        `${iexecPath} deal show ${res.deals[0].dealid} --raw`,
      );
      const resDeal = JSON.parse(rawDeal);
      expect(resDeal.ok).toBe(true);
      expect(resDeal.deal).toBeDefined();
      expect(resDeal.deal.app.pointer).toBe(userApp);
      expect(resDeal.deal.app.price).toBe('0');
      expect(resDeal.deal.dataset.pointer).toBe(userDataset);
      expect(resDeal.deal.dataset.price).toBe('0');
      expect(resDeal.deal.workerpool.pointer).toBe(userWokerpool);
      expect(resDeal.deal.workerpool.price).toBe('0');
      expect(resDeal.deal.category).toBe('1');
      expect(resDeal.deal.params).toBe('{"iexec_args":"test params"}');
      expect(resDeal.deal.callback).toBe(beneficiary);
      expect(resDeal.deal.requester).toBe(userWallet.address);
      expect(resDeal.deal.beneficiary).toBe(NULL_ADDRESS);
      expect(resDeal.deal.botFirst).toBe('0');
      expect(resDeal.deal.botSize).toBe('1');
      expect(resDeal.deal.tag).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000103',
      );
      expect(resDeal.deal.trust).toBe('1');
      expect(Object.keys(resDeal.deal.tasks).length).toBe(1);
      expect(resDeal.deal.tasks['0']).toBeDefined();
    });

    test('iexec app run --workerpool deployed --dataset deployed --args <args> --encrypt-result --input-files https://example.com/foo.txt,https://example.com/bar.zip --storage-provider dropbox --tag tee,scone', async () => {
      const raw = await execAsync(
        `${iexecPath} app run --workerpool deployed --args 'command --help' --encrypt-result --input-files https://example.com/foo.txt,https://example.com/bar.zip --storage-provider dropbox --tag tee,scone --skip-preflight-check --force --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.deals).toBeDefined();
      expect(res.deals.length).toBe(1);
      expect(res.deals[0].volume).toBe('1');
      expect(res.deals[0].dealid).toBeDefined();
      expect(res.deals[0].txHash).toBeDefined();

      const rawDeal = await execAsync(
        `${iexecPath} deal show ${res.deals[0].dealid} --raw`,
      );
      const resDeal = JSON.parse(rawDeal);
      expect(resDeal.ok).toBe(true);
      expect(resDeal.deal).toBeDefined();
      expect(resDeal.deal.app.pointer).toBe(userApp);
      expect(resDeal.deal.app.price).toBe('0');
      expect(resDeal.deal.dataset.pointer).toBe(NULL_ADDRESS);
      expect(resDeal.deal.dataset.price).toBe('0');
      expect(resDeal.deal.workerpool.pointer).toBe(userWokerpool);
      expect(resDeal.deal.workerpool.price).toBe('0');
      expect(resDeal.deal.category).toBe('0');
      expect(resDeal.deal.params).toBe(
        '{"iexec_args":"command --help","iexec_input_files":["https://example.com/foo.txt","https://example.com/bar.zip"],"iexec_result_storage_provider":"dropbox","iexec_result_encryption":true}',
      );
      expect(resDeal.deal.callback).toBe(NULL_ADDRESS);
      expect(resDeal.deal.requester).toBe(userWallet.address);
      expect(resDeal.deal.beneficiary).toBe(userWallet.address);
      expect(resDeal.deal.botFirst).toBe('0');
      expect(resDeal.deal.botSize).toBe('1');
      expect(resDeal.deal.tag).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000003',
      );
      expect(resDeal.deal.trust).toBe('1');
      expect(Object.keys(resDeal.deal.tasks).length).toBe(1);
      expect(resDeal.deal.tasks['0']).toBeDefined();
    });

    test('iexec app run --workerpool deployed --watch (timeout)', async () => {
      const raw = await execAsync(
        `${iexecPath} app run --workerpool deployed --category ${noDurationCatid} --watch --skip-preflight-check --force --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.deals).toBeDefined();
      expect(res.deals.length).toBe(1);
      expect(res.deals[0].volume).toBe('1');
      expect(res.deals[0].dealid).toBeDefined();
      expect(res.deals[0].txHash).toBeDefined();
      expect(res.tasks).toBeDefined();
      expect(res.tasks.length).toBe(1);
      expect(res.tasks[0].idx).toBe('0');
      expect(res.tasks[0].taskid).toBeDefined();
      expect(res.tasks[0].dealid).toBe(res.deals[0].dealid);
      expect(res.tasks[0].status).toBe(0);
      expect(res.tasks[0].statusName).toBe('TIMEOUT');
      expect(res.tasks[0].taskTimedOut).toBe(true);
      expect(res.failedTasks).toBeDefined();
      expect(res.failedTasks.length).toBe(1);
      expect(res.failedTasks[0].idx).toBe('0');
      expect(res.failedTasks[0].taskid).toBeDefined();
      expect(res.failedTasks[0].dealid).toBe(res.deals[0].dealid);
      expect(res.failedTasks[0].status).toBe(0);
      expect(res.failedTasks[0].statusName).toBe('TIMEOUT');
      expect(res.failedTasks[0].taskTimedOut).toBe(true);
    });
  });
});
