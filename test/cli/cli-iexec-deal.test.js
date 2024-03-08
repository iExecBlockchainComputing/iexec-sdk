// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import {
  TEST_CHAINS,
  execAsync,
  initializeTask,
  runIExecCliRaw,
} from '../test-utils';
import {
  editCategory,
  globalSetup,
  globalTeardown,
  iexecPath,
  setChain,
  setChainsPocoAdminWallet,
  setRandomWallet,
} from './cli-test-utils';

const DEFAULT_TIMEOUT = 120000;
jest.setTimeout(DEFAULT_TIMEOUT);

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec deal', () => {
  let userWallet;
  let userApp;
  let userWorkerpool;
  let userDataset;
  let noDurationCatid;
  let dealid;

  beforeAll(async () => {
    await globalSetup('iexec-deal');
    // init the project
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setChain(testChain)();
    // create category (require admin wallet)
    await setChainsPocoAdminWallet(testChain)();
    await execAsync(`${iexecPath} category init`);
    await editCategory({ workClockTimeRef: '0' });
    const createCatRes = await runIExecCliRaw(`${iexecPath} category create`);
    noDurationCatid = createCatRes.catid;
    // restore user wallet
    userWallet = await setRandomWallet();
    await execAsync(`${iexecPath} app init`);
    await execAsync(`${iexecPath} dataset init`);
    await execAsync(`${iexecPath} workerpool init`);
    userApp = await runIExecCliRaw(`${iexecPath} app deploy`);
    userDataset = await runIExecCliRaw(`${iexecPath} dataset deploy`);
    userWorkerpool = await runIExecCliRaw(`${iexecPath} workerpool deploy`);
    dealid = await runIExecCliRaw(
      `${iexecPath} app run ${userApp.address} --workerpool ${userWorkerpool.address} --dataset ${userDataset.address} --category ${noDurationCatid} --force`,
    ).then((res) => res.deals[0].dealid);
  });

  afterAll(async () => {
    await globalTeardown();
  });

  describe('show', () => {
    test('iexec deal show', async () => {
      const res = await runIExecCliRaw(`${iexecPath} deal show ${dealid}`);
      expect(res.ok).toBe(true);
      expect(res.deal).toBeDefined();
      expect(res.deal.app.pointer).toBe(userApp.address);
      expect(res.deal.dataset.pointer).toBe(userDataset.address);
      expect(res.deal.workerpool.pointer).toBe(userWorkerpool.address);
      expect(res.deal.requester).toBe(userWallet.address);
      expect(res.deal.beneficiary).toBe(userWallet.address);
      expect(res.deal.botFirst).toBe('0');
      expect(res.deal.botSize).toBe('1');
      expect(res.deal.startTime).toBeDefined();
      expect(res.deal.finalTime).toBeDefined();
      expect(res.deal.deadlineReached).toBe(true);
      expect(res.deal.tasks).toBeDefined();
      expect(Object.keys(res.deal.tasks).length).toBe(1);
      expect(res.deal.tasks['0']).toBeDefined();
    });

    test('iexec deal show --watch (deal timeout)', async () => {
      const res = await runIExecCliRaw(
        `${iexecPath} deal show ${dealid} --watch`,
      );
      expect(res.ok).toBe(true);
      expect(res.deal).toBeDefined();
      expect(res.deal.app.pointer).toBe(userApp.address);
      expect(res.deal.dataset.pointer).toBe(userDataset.address);
      expect(res.deal.workerpool.pointer).toBe(userWorkerpool.address);
      expect(res.deal.requester).toBe(userWallet.address);
      expect(res.deal.beneficiary).toBe(userWallet.address);
      expect(res.deal.botFirst).toBe('0');
      expect(res.deal.botSize).toBe('1');
      expect(res.deal.startTime).toBeDefined();
      expect(res.deal.finalTime).toBeDefined();
      expect(res.deal.deadlineReached).toBe(true);
      expect(res.deal.tasks).toBeDefined();
      expect(Object.keys(res.deal.tasks).length).toBe(1);
      expect(res.deal.tasks['0']).toBeDefined();
      expect(res.tasksCount).toBe(1);
      expect(res.completedTasksCount).toBe(0);
      expect(res.failedTasksCount).toBe(1);
      expect(res.tasks.length).toBe(1);
      expect(res.tasks[0].idx).toBe('0');
      expect(res.tasks[0].dealid).toBe(dealid);
      expect(res.tasks[0].taskTimedOut).toBe(true);
      expect(res.tasks[0].statusName).toBe('TIMEOUT');
      expect(res.failedTasks.length).toBe(1);
      expect(res.failedTasks[0].idx).toBe('0');
      expect(res.failedTasks[0].dealid).toBe(dealid);
      expect(res.failedTasks[0].taskTimedOut).toBe(true);
      expect(res.failedTasks[0].statusName).toBe('TIMEOUT');
    });

    test('iexec deal show (no deal)', async () => {
      const fakeDealId =
        '0x194488f76903579d3a3acd89cb75420d52e31e03ab194a74b95247339cf2180f';
      const res = await runIExecCliRaw(
        `${iexecPath} deal show ${fakeDealId}`,
      ).catch((e) => e.message);
      expect(res.ok).toBe(false);
      expect(res.deal).toBeUndefined();
    });
  });

  describe('claim', () => {
    test('iexec deal claim (task not initialized)', async () => {
      const claimableDealid = await runIExecCliRaw(
        `${iexecPath} app run ${userApp.address} --workerpool ${userWorkerpool.address} --dataset ${userDataset.address} --category ${noDurationCatid} --force`,
      ).then((res) => res.deals[0].dealid);
      const res = await runIExecCliRaw(
        `${iexecPath} deal claim ${claimableDealid}`,
      );
      expect(res.ok).toBe(true);
      expect(res.transactions).toBeDefined();
      expect(res.transactions.length).toBe(1);
      expect(res.transactions[0].type).toBe('initializeAndClaimArray');
      expect(res.claimed).toBeDefined();
      expect(Object.keys(res.claimed).length).toBe(1);
    });

    test('iexec deal claim (task initialized)', async () => {
      const claimableDealid = await runIExecCliRaw(
        `${iexecPath} app run ${userApp.address} --workerpool ${userWorkerpool.address} --dataset ${userDataset.address} --category ${noDurationCatid} --force`,
      ).then((res) => res.deals[0].dealid);
      await initializeTask(testChain)(claimableDealid, 0);
      const res = await runIExecCliRaw(
        `${iexecPath} deal claim ${claimableDealid}`,
      );
      expect(res.ok).toBe(true);
      expect(res.transactions).toBeDefined();
      expect(res.transactions.length).toBe(1);
      expect(res.transactions[0].type).toBe('claimArray');
      expect(res.claimed).toBeDefined();
      expect(Object.keys(res.claimed).length).toBe(1);
    });
  });
});
