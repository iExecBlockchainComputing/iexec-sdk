// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { TEST_CHAINS, execAsync, initializeTask } from '../test-utils';
import {
  editCategory,
  globalSetup,
  globalTeardown,
  iexecPath,
  runIExecCliRaw,
  setChain,
  setChainsPocoAdminWallet,
  setRandomWallet,
} from './cli-test-utils';
import { NULL_BYTES32 } from '../../src/common/utils/constant';

const DEFAULT_TIMEOUT = 120000;
jest.setTimeout(DEFAULT_TIMEOUT);

const testChain = TEST_CHAINS['bellecour-fork'];

describe('iexec task', () => {
  let userWallet;
  let userApp;
  let userWorkerpool;
  let userDataset;
  let noDurationCatid;

  beforeAll(async () => {
    await globalSetup('iexec-task');
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
  });

  afterAll(async () => {
    await globalTeardown();
  });

  describe('show', () => {
    test('iexec task show (not initialized)', async () => {
      const dealid = await runIExecCliRaw(
        `${iexecPath} app run ${userApp.address} --workerpool ${userWorkerpool.address} --dataset ${userDataset.address} --category ${noDurationCatid} --force`,
      ).then((res) => res.deals[0].dealid);
      const taskid = await runIExecCliRaw(
        `${iexecPath} deal show ${dealid}`,
      ).then((res) => res.deal.tasks[0]);
      const res = await runIExecCliRaw(
        `${iexecPath} task show ${taskid}`,
      ).catch((e) => e.message);
      expect(res.ok).toBe(false);
      expect(res.task).toBeUndefined();
    });

    test('iexec task show (initialized)', async () => {
      const dealid = await runIExecCliRaw(
        `${iexecPath} app run ${userApp.address} --workerpool ${userWorkerpool.address} --dataset ${userDataset.address} --category 0 --force`,
      ).then((res) => res.deals[0].dealid);
      const taskid = await runIExecCliRaw(
        `${iexecPath} deal show ${dealid}`,
      ).then((res) => res.deal.tasks[0]);
      await initializeTask(testChain)(dealid, 0);
      const res = await runIExecCliRaw(`${iexecPath} task show ${taskid}`);
      expect(res.ok).toBe(true);
      expect(res.task).toBeDefined();
      expect(res.task.dealid).toBe(dealid);
      expect(res.task.idx).toBe('0');
      expect(res.task.timeref).toBeDefined();
      expect(res.task.contributionDeadline).toBeDefined();
      expect(res.task.contributionDeadline).toBeDefined();
      expect(res.task.finalDeadline).toBeDefined();
      expect(res.task.consensusValue).toBe(NULL_BYTES32);
      expect(res.task.revealCounter).toBe('0');
      expect(res.task.winnerCounter).toBe('0');
      expect(res.task.contributors).toStrictEqual([]);
      expect(res.task.resultDigest).toBe(NULL_BYTES32);
      expect(res.task.results).toStrictEqual({ storage: 'none' });
      expect(res.task.statusName).toBe('ACTIVE');
      expect(res.task.taskTimedOut).toBe(false);
      expect(res.claimable).toBe(false);
    });

    test('iexec task show (claimable)', async () => {
      const dealid = await runIExecCliRaw(
        `${iexecPath} app run ${userApp.address} --workerpool ${userWorkerpool.address} --dataset ${userDataset.address} --category ${noDurationCatid} --force`,
      ).then((res) => res.deals[0].dealid);
      const taskid = await runIExecCliRaw(
        `${iexecPath} deal show ${dealid}`,
      ).then((res) => res.deal.tasks[0]);
      await initializeTask(testChain)(dealid, 0);
      const res = await runIExecCliRaw(`${iexecPath} task show ${taskid}`);
      expect(res.ok).toBe(true);
      expect(res.task).toBeDefined();
      expect(res.task.dealid).toBe(dealid);
      expect(res.task.idx).toBe('0');
      expect(res.task.timeref).toBeDefined();
      expect(res.task.contributionDeadline).toBeDefined();
      expect(res.task.contributionDeadline).toBeDefined();
      expect(res.task.finalDeadline).toBeDefined();
      expect(res.task.consensusValue).toBe(NULL_BYTES32);
      expect(res.task.revealCounter).toBe('0');
      expect(res.task.winnerCounter).toBe('0');
      expect(res.task.contributors).toStrictEqual([]);
      expect(res.task.resultDigest).toBe(NULL_BYTES32);
      expect(res.task.results).toStrictEqual({ storage: 'none' });
      expect(res.task.statusName).toBe('TIMEOUT');
      expect(res.task.taskTimedOut).toBe(true);
      expect(res.claimable).toBe(true);
    });

    test('iexec task show (claimed)', async () => {
      const dealid = await runIExecCliRaw(
        `${iexecPath} app run ${userApp.address} --workerpool ${userWorkerpool.address} --dataset ${userDataset.address} --category ${noDurationCatid} --force`,
      ).then((res) => res.deals[0].dealid);
      const taskid = await runIExecCliRaw(
        `${iexecPath} deal show ${dealid}`,
      ).then((res) => res.deal.tasks[0]);
      await runIExecCliRaw(`${iexecPath} deal claim ${dealid}`);
      const res = await runIExecCliRaw(`${iexecPath} task show ${taskid}`);
      expect(res.ok).toBe(true);
      expect(res.task).toBeDefined();
      expect(res.task.dealid).toBe(dealid);
      expect(res.task.idx).toBe('0');
      expect(res.task.timeref).toBeDefined();
      expect(res.task.contributionDeadline).toBeDefined();
      expect(res.task.contributionDeadline).toBeDefined();
      expect(res.task.finalDeadline).toBeDefined();
      expect(res.task.consensusValue).toBe(NULL_BYTES32);
      expect(res.task.revealCounter).toBe('0');
      expect(res.task.winnerCounter).toBe('0');
      expect(res.task.contributors).toStrictEqual([]);
      expect(res.task.resultDigest).toBe(NULL_BYTES32);
      expect(res.task.results).toStrictEqual({ storage: 'none' });
      expect(res.task.statusName).toBe('FAILED');
      expect(res.task.taskTimedOut).toBe(true);
      expect(res.claimable).toBe(false);
    });
  });

  describe('claim', () => {
    test('iexec task claim', async () => {
      const dealid = await runIExecCliRaw(
        `${iexecPath} app run ${userApp.address} --workerpool ${userWorkerpool.address} --dataset ${userDataset.address} --category ${noDurationCatid} --force`,
      ).then((res) => res.deals[0].dealid);
      const taskid = await runIExecCliRaw(
        `${iexecPath} deal show ${dealid}`,
      ).then((res) => res.deal.tasks[0]);
      await initializeTask(testChain)(dealid, 0);
      const res = await runIExecCliRaw(`${iexecPath} task claim ${taskid}`);
      expect(res.ok).toBe(true);
      expect(res.txHash).toBeDefined();
      const tx = await testChain.provider.getTransaction(res.txHash);
      expect(tx).toBeDefined();
    });
  });
});
