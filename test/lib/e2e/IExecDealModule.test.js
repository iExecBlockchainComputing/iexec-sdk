// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import {
  deployAndGetApporder,
  deployAndGetDatasetorder,
  deployAndGetWorkerpoolorder,
  getMatchableRequestorder,
  getTestConfig,
  runObservableSubscribe,
} from '../lib-test-utils';
import {
  TEST_CHAINS,
  NULL_BYTES32,
  initializeTask,
  sleep,
  adminCreateCategory,
} from '../../test-utils';
import '../../jest-setup';

import { errors } from '../../../src/lib/index';

const { ObjectNotFoundError } = errors;

const iexecTestChain = TEST_CHAINS['bellecour-fork'];
describe('deal', () => {
  describe('fetchRequesterDeals()', () => {
    test('shows past deals', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const requesterAddress = await iexec.wallet.getAddress();
      const apporder = await deployAndGetApporder(iexec);
      const datasetorder = await deployAndGetDatasetorder(iexec);
      const workerpoolorder = await deployAndGetWorkerpoolorder(iexec);
      const requestorder = await getMatchableRequestorder(iexec, {
        apporder,
        datasetorder,
        workerpoolorder,
      });
      const res = await iexec.deal.fetchRequesterDeals(
        await iexec.wallet.getAddress(),
      );
      expect(typeof res.count).toBe('number');
      const { dealid } = await iexec.order.matchOrders(
        {
          apporder,
          datasetorder,
          workerpoolorder,
          requestorder,
        },
        { preflightCheck: false },
      );
      await sleep(5000);
      const resAfterMatch =
        await iexec.deal.fetchRequesterDeals(requesterAddress);
      expect(res.count).toBe(resAfterMatch.count - 1);
      const resAppFiltered = await iexec.deal.fetchRequesterDeals(
        requesterAddress,
        {
          appAddress: apporder.app,
        },
      );
      expect(resAppFiltered.count).toBe(1);
      expect(resAppFiltered.deals[0].dealid).toBe(dealid);
      expect(resAppFiltered.deals[0].app.pointer).toBe(apporder.app);
      const resDatasetFiltered = await iexec.deal.fetchRequesterDeals(
        requesterAddress,
        {
          datasetAddress: datasetorder.dataset,
        },
      );
      expect(resDatasetFiltered.count).toBe(1);
      expect(resDatasetFiltered.deals[0].dealid).toBe(dealid);
      expect(resDatasetFiltered.deals[0].dataset.pointer).toBe(
        datasetorder.dataset,
      );
      const resWorkerpoolFiltered = await iexec.deal.fetchRequesterDeals(
        requesterAddress,
        {
          workerpoolAddress: workerpoolorder.workerpool,
        },
      );
      expect(resWorkerpoolFiltered.deals[0].dealid).toBe(dealid);
      expect(resWorkerpoolFiltered.count).toBe(1);
      expect(resWorkerpoolFiltered.deals[0].workerpool.pointer).toBe(
        workerpoolorder.workerpool,
      );
    });
  });

  describe('fetchDealsByApporder()', () => {
    test('shows past deals', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const apporder = await deployAndGetApporder(iexec);
      const datasetorder = await deployAndGetDatasetorder(iexec);
      const workerpoolorder = await deployAndGetWorkerpoolorder(iexec);
      const requestorder = await getMatchableRequestorder(iexec, {
        apporder,
        datasetorder,
        workerpoolorder,
      });
      const orderHash = await iexec.order.hashApporder(apporder);
      const res = await iexec.deal.fetchDealsByApporder(orderHash);
      expect(res.count).toBe(0);
      const { dealid } = await iexec.order.matchOrders(
        {
          apporder,
          datasetorder,
          workerpoolorder,
          requestorder,
        },
        { preflightCheck: false },
      );
      await sleep(5000);
      const resAfterMatch = await iexec.deal.fetchDealsByApporder(orderHash);
      expect(resAfterMatch.count).toBe(1);
      expect(resAfterMatch.deals[0].dealid).toBe(dealid);
      expect(resAfterMatch.deals[0].app.pointer).toBe(apporder.app);
    });
  });

  describe('fetchDealsByDatasetorder()', () => {
    test('shows past deals', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const apporder = await deployAndGetApporder(iexec);
      const datasetorder = await deployAndGetDatasetorder(iexec);
      const workerpoolorder = await deployAndGetWorkerpoolorder(iexec);
      const requestorder = await getMatchableRequestorder(iexec, {
        apporder,
        datasetorder,
        workerpoolorder,
      });
      const orderHash = await iexec.order.hashDatasetorder(datasetorder);
      const res = await iexec.deal.fetchDealsByDatasetorder(orderHash);
      expect(res.count).toBe(0);
      const { dealid } = await iexec.order.matchOrders(
        {
          apporder,
          datasetorder,
          workerpoolorder,
          requestorder,
        },
        { preflightCheck: false },
      );
      await sleep(5000);
      const resAfterMatch =
        await iexec.deal.fetchDealsByDatasetorder(orderHash);
      expect(resAfterMatch.count).toBe(1);
      expect(resAfterMatch.deals[0].dealid).toBe(dealid);
      expect(resAfterMatch.deals[0].dataset.pointer).toBe(datasetorder.dataset);
    });
  });

  describe('fetchDealsByWorkerpoolorder()', () => {
    test('shows past deals', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const apporder = await deployAndGetApporder(iexec);
      const datasetorder = await deployAndGetDatasetorder(iexec);
      const workerpoolorder = await deployAndGetWorkerpoolorder(iexec);
      const requestorder = await getMatchableRequestorder(iexec, {
        apporder,
        datasetorder,
        workerpoolorder,
      });
      const orderHash = await iexec.order.hashWorkerpoolorder(workerpoolorder);
      const res = await iexec.deal.fetchDealsByWorkerpoolorder(orderHash);
      expect(res.count).toBe(0);
      const { dealid } = await iexec.order.matchOrders(
        {
          apporder,
          datasetorder,
          workerpoolorder,
          requestorder,
        },
        { preflightCheck: false },
      );
      await sleep(5000);
      const resAfterMatch =
        await iexec.deal.fetchDealsByWorkerpoolorder(orderHash);
      expect(resAfterMatch.count).toBe(1);
      expect(resAfterMatch.deals[0].dealid).toBe(dealid);
      expect(resAfterMatch.deals[0].workerpool.pointer).toBe(
        workerpoolorder.workerpool,
      );
    });
  });

  describe('fetchDealsByRequestorder()', () => {
    test('shows past deals', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const apporder = await deployAndGetApporder(iexec);
      const datasetorder = await deployAndGetDatasetorder(iexec);
      const workerpoolorder = await deployAndGetWorkerpoolorder(iexec);
      const requestorder = await getMatchableRequestorder(iexec, {
        apporder,
        datasetorder,
        workerpoolorder,
      });
      const orderHash = await iexec.order.hashRequestorder(requestorder);
      const res = await iexec.deal.fetchDealsByRequestorder(orderHash);
      expect(res.count).toBe(0);
      const { dealid } = await iexec.order.matchOrders(
        {
          apporder,
          datasetorder,
          workerpoolorder,
          requestorder,
        },
        { preflightCheck: false },
      );
      await sleep(5000);
      const resAfterMatch =
        await iexec.deal.fetchDealsByRequestorder(orderHash);
      expect(resAfterMatch.count).toBe(1);
      expect(resAfterMatch.deals[0].dealid).toBe(dealid);
      expect(resAfterMatch.deals[0].requester).toBe(requestorder.requester);
    });
  });

  describe.skip('obsDeal()', () => {
    test('emits deal updates', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const catid = (
        await adminCreateCategory(iexecTestChain)({
          name: 'custom',
          description: 'desc',
          workClockTimeRef: 10,
        })
      ).catid.toString();
      const apporder = await deployAndGetApporder(iexec, { volume: 10 });
      const workerpoolorder = await deployAndGetWorkerpoolorder(iexec, {
        category: catid,
        volume: 5,
      });
      const requestorder = await getMatchableRequestorder(iexec, {
        apporder,
        workerpoolorder,
      });
      const { dealid } = await iexec.order.matchOrders(
        {
          apporder,
          workerpoolorder,
          requestorder,
        },
        { preflightCheck: false },
      );

      const dealObservable = await iexec.deal.obsDeal(dealid);

      const runnerUnsubAfterInit = runObservableSubscribe(dealObservable);
      const runnerUnsubBeforeInit = runObservableSubscribe(dealObservable);
      await sleep(6000);
      runnerUnsubBeforeInit.unsubscribe();
      await initializeTask(iexecTestChain)(dealid, 3);
      await initializeTask(iexecTestChain)(dealid, 0);
      await sleep(6000);
      runnerUnsubAfterInit.unsubscribe();

      const [unsubAfterInitRes, unsubBeforeInitRes] = await Promise.all([
        runnerUnsubAfterInit.wait(),
        runnerUnsubBeforeInit.wait(),
      ]);

      expect(unsubAfterInitRes.messages.length).toBe(3);

      expect(unsubAfterInitRes.messages[0].message).toBe('DEAL_UPDATED');
      expect(unsubAfterInitRes.messages[0].tasksCount).toBe(5);
      expect(unsubAfterInitRes.messages[0].completedTasksCount).toBe(0);
      expect(unsubAfterInitRes.messages[0].failedTasksCount).toBe(0);
      expect(unsubAfterInitRes.messages[0].deal.dealid).toBe(dealid);
      expect(Object.entries(unsubAfterInitRes.messages[0].tasks).length).toBe(
        5,
      );
      expect(unsubAfterInitRes.messages[0].tasks[0].status).toBe(0);
      expect(unsubAfterInitRes.messages[0].tasks[1].status).toBe(0);
      expect(unsubAfterInitRes.messages[0].tasks[2].status).toBe(0);
      expect(unsubAfterInitRes.messages[0].tasks[3].status).toBe(0);
      expect(unsubAfterInitRes.messages[0].tasks[4].status).toBe(0);

      expect(unsubAfterInitRes.messages[1].message).toBe('DEAL_UPDATED');

      expect(unsubAfterInitRes.messages[2].message).toBe('DEAL_UPDATED');
      expect(unsubAfterInitRes.messages[2].tasksCount).toBe(5);
      expect(unsubAfterInitRes.messages[2].completedTasksCount).toBe(0);
      expect(unsubAfterInitRes.messages[2].failedTasksCount).toBe(0);
      expect(unsubAfterInitRes.messages[2].deal.dealid).toBe(dealid);
      expect(Object.entries(unsubAfterInitRes.messages[2].tasks).length).toBe(
        5,
      );
      expect(unsubAfterInitRes.messages[2].tasks[0].status).toBe(1);
      expect(unsubAfterInitRes.messages[2].tasks[1].status).toBe(0);
      expect(unsubAfterInitRes.messages[2].tasks[2].status).toBe(0);
      expect(unsubAfterInitRes.messages[2].tasks[3].status).toBe(1);
      expect(unsubAfterInitRes.messages[2].tasks[4].status).toBe(0);

      expect(unsubBeforeInitRes.messages.length).toBe(1);

      expect(unsubBeforeInitRes.messages[0].message).toBe('DEAL_UPDATED');
      expect(unsubBeforeInitRes.messages[0].tasksCount).toBe(5);
      expect(unsubBeforeInitRes.messages[0].completedTasksCount).toBe(0);
      expect(unsubBeforeInitRes.messages[0].failedTasksCount).toBe(0);
      expect(unsubBeforeInitRes.messages[0].deal.dealid).toBe(dealid);
      expect(Object.entries(unsubBeforeInitRes.messages[0].tasks).length).toBe(
        5,
      );
      expect(unsubBeforeInitRes.messages[0].tasks[0].status).toBe(0);
      expect(unsubBeforeInitRes.messages[0].tasks[1].status).toBe(0);
      expect(unsubBeforeInitRes.messages[0].tasks[2].status).toBe(0);
      expect(unsubBeforeInitRes.messages[0].tasks[3].status).toBe(0);
      expect(unsubBeforeInitRes.messages[0].tasks[4].status).toBe(0);
    });

    test('exits on deal timeout', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const catid = (
        await adminCreateCategory(iexecTestChain)({
          name: 'custom',
          description: 'desc',
          workClockTimeRef: 2,
        })
      ).catid.toString();
      const apporder = await deployAndGetApporder(iexec, { volume: 10 });
      const workerpoolorder = await deployAndGetWorkerpoolorder(iexec, {
        category: catid,
        volume: 5,
      });
      const requestorder = await getMatchableRequestorder(iexec, {
        apporder,
        workerpoolorder,
      });
      const { dealid } = await iexec.order.matchOrders(
        {
          apporder,
          workerpoolorder,
          requestorder,
        },
        { preflightCheck: false },
      );

      const dealObservable = await iexec.deal.obsDeal(dealid);
      const wrongDealObservable = await iexec.deal.obsDeal(NULL_BYTES32);

      const runner = runObservableSubscribe(dealObservable);
      const runnerUnsub = runObservableSubscribe(dealObservable);
      const runnerWrongDealid = runObservableSubscribe(wrongDealObservable);

      const [wrongDealidRes, completedRes, unsubRes] = await Promise.all([
        runnerWrongDealid.wait(),
        runner.wait(),
        sleep(3000).then(() => {
          runnerUnsub.unsubscribe();
          return runnerUnsub.wait();
        }),
        initializeTask(iexecTestChain)(dealid, 3)
          .then(sleep(5000))
          .then(() => initializeTask(iexecTestChain)(dealid, 0)),
      ]);

      expect(wrongDealidRes.error).toStrictEqual(
        new ObjectNotFoundError('deal', NULL_BYTES32, iexecTestChain.chainId),
      );
      expect(wrongDealidRes.messages.length).toBe(0);
      expect(wrongDealidRes.completed).toBe(false);

      expect(completedRes.error).toBeUndefined();
      expect(completedRes.completed).toBe(true);
      completedRes.messages.forEach((data) => {
        expect(data.tasksCount).toBe(5);
        expect(data.completedTasksCount).toBe(0);
        expect(data.deal.dealid).toBe(dealid);
        expect(data.deal.tasks.length).toBe(5);
      });
      expect(completedRes.messages.at(0).message).toBe('DEAL_UPDATED');
      expect(completedRes.messages.at(-1).message).toBe('DEAL_TIMEDOUT');
      expect(completedRes.messages.at(-1).failedTasksCount).toBe(5);
      expect(completedRes.messages.at(-1).tasks[0].status).toBe(1);
      expect(completedRes.messages.at(-1).tasks[3].status).toBe(1);

      expect(unsubRes.error).toBeUndefined();
      expect(unsubRes.completed).toBe(false);
      unsubRes.messages.forEach((data) => {
        expect(data.tasksCount).toBe(5);
        expect(data.completedTasksCount).toBe(0);
        expect(data.deal.dealid).toBe(dealid);
        expect(data.deal.tasks.length).toBe(5);
      });
      expect(unsubRes.messages.at(0).message).toBe('DEAL_UPDATED');
      expect(unsubRes.messages.at(-1).message).toBe('DEAL_UPDATED');
    });
  });
});
