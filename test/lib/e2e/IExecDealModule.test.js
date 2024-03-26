// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest, describe, test } from '@jest/globals';
import {
  deployAndGetApporder,
  deployAndGetDatasetorder,
  deployAndGetWorkerpoolorder,
  getMatchableRequestorder,
  getTestConfig,
} from '../lib-test-utils';
import { TEST_CHAINS, initializeTask } from '../../test-utils';
import { sleep } from '../../../src/common/utils/utils';
import { NULL_BYTES32 } from '../../../src/lib/utils';
import { ObjectNotFoundError } from '../../../src/lib/errors';

const DEFAULT_TIMEOUT = 120000;
jest.setTimeout(DEFAULT_TIMEOUT);

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

  describe('obsDeal()', () => {
    test('emits deals updates', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const { iexec: iexecAdmin } = getTestConfig(iexecTestChain)({
        privateKey: iexecTestChain.pocoAdminWallet.privateKey,
      });
      const catid = (
        await iexecAdmin.hub.createCategory({
          name: 'custom',
          description: 'desc',
          workClockTimeRef: 10,
        })
      ).catid.toString();
      const apporder = await deployAndGetApporder(iexec, { volume: 10 });
      const workerpoolorder = await deployAndGetWorkerpoolorder(iexec, {
        category: catid,
        volume: 10,
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

      const obsDealValues = [];
      const obsDealUnsubBeforeNextValues = [];

      let unsubObsDeal;
      let unsubObsDealBeforeNext;

      await Promise.all([
        new Promise((resolve, reject) => {
          iexec.deal
            .obsDeal(dealid)
            .then((obs) => {
              unsubObsDeal = obs.subscribe({
                next: (value) => {
                  obsDealValues.push(value);
                },
                error: () => reject(Error('obsDeal should not call error')),
                complete: () =>
                  reject(Error('obsDeal should not call complete')),
              });
              sleep(10000).then(resolve);
            })
            .catch(reject);
        }),
        new Promise((resolve, reject) => {
          iexec.deal
            .obsDeal(dealid)
            .then((obs) => {
              unsubObsDealBeforeNext = obs.subscribe({
                next: (value) => {
                  obsDealUnsubBeforeNextValues.push(value);
                  try {
                    unsubObsDealBeforeNext();
                  } catch (e) {
                    reject(e);
                  }
                },
                error: () =>
                  reject(
                    Error('obsDeal unsub before next should not call error'),
                  ),
                complete: () =>
                  reject(
                    Error('obsDeal unsub before next should not call complete'),
                  ),
              });
              sleep(10000).then(resolve);
            })
            .catch(reject);
        }),
        new Promise((resolve, reject) => {
          sleep(1000).then(() => {
            initializeTask(iexecTestChain)(dealid, 5)
              .then(() => {
                sleep(6000).then(() => {
                  initializeTask(iexecTestChain)(dealid, 0)
                    .then(() => sleep(6000).then(resolve))
                    .catch(reject);
                });
              })
              .catch(reject);
          });
        }),
      ]);

      expect(unsubObsDeal).toBeInstanceOf(Function);
      expect(unsubObsDealBeforeNext).toBeInstanceOf(Function);

      unsubObsDeal();

      expect(obsDealValues.length).toBe(3);

      expect(obsDealValues[0].message).toBe('DEAL_UPDATED');
      expect(obsDealValues[0].tasksCount).toBe(10);
      expect(obsDealValues[0].completedTasksCount).toBe(0);
      expect(obsDealValues[0].failedTasksCount).toBe(0);
      expect(obsDealValues[0].deal.dealid).toBe(dealid);
      expect(Object.entries(obsDealValues[0].tasks).length).toBe(10);
      expect(obsDealValues[0].tasks[0].status).toBe(0);
      expect(obsDealValues[0].tasks[1].status).toBe(0);
      expect(obsDealValues[0].tasks[2].status).toBe(0);
      expect(obsDealValues[0].tasks[3].status).toBe(0);
      expect(obsDealValues[0].tasks[4].status).toBe(0);
      expect(obsDealValues[0].tasks[5].status).toBe(0);
      expect(obsDealValues[0].tasks[6].status).toBe(0);
      expect(obsDealValues[0].tasks[7].status).toBe(0);
      expect(obsDealValues[0].tasks[8].status).toBe(0);
      expect(obsDealValues[0].tasks[9].status).toBe(0);

      expect(obsDealValues[1].message).toBe('DEAL_UPDATED');
      expect(obsDealValues[1].tasksCount).toBe(10);
      expect(obsDealValues[1].completedTasksCount).toBe(0);
      expect(obsDealValues[1].failedTasksCount).toBe(0);
      expect(obsDealValues[1].deal.dealid).toBe(dealid);
      expect(Object.entries(obsDealValues[1].tasks).length).toBe(10);
      expect(obsDealValues[1].tasks[0].status).toBe(0);
      expect(obsDealValues[1].tasks[1].status).toBe(0);
      expect(obsDealValues[1].tasks[2].status).toBe(0);
      expect(obsDealValues[1].tasks[3].status).toBe(0);
      expect(obsDealValues[1].tasks[4].status).toBe(0);
      expect(obsDealValues[1].tasks[5].status).toBe(1);
      expect(obsDealValues[1].tasks[6].status).toBe(0);
      expect(obsDealValues[1].tasks[7].status).toBe(0);
      expect(obsDealValues[1].tasks[8].status).toBe(0);
      expect(obsDealValues[1].tasks[9].status).toBe(0);

      expect(obsDealValues[2].message).toBe('DEAL_UPDATED');
      expect(obsDealValues[2].tasksCount).toBe(10);
      expect(obsDealValues[2].completedTasksCount).toBe(0);
      expect(obsDealValues[2].failedTasksCount).toBe(0);
      expect(obsDealValues[2].deal.dealid).toBe(dealid);
      expect(Object.entries(obsDealValues[2].tasks).length).toBe(10);
      expect(obsDealValues[2].tasks[0].status).toBe(1);
      expect(obsDealValues[2].tasks[1].status).toBe(0);
      expect(obsDealValues[2].tasks[2].status).toBe(0);
      expect(obsDealValues[2].tasks[3].status).toBe(0);
      expect(obsDealValues[2].tasks[4].status).toBe(0);
      expect(obsDealValues[2].tasks[5].status).toBe(1);
      expect(obsDealValues[2].tasks[6].status).toBe(0);
      expect(obsDealValues[2].tasks[7].status).toBe(0);
      expect(obsDealValues[2].tasks[8].status).toBe(0);
      expect(obsDealValues[2].tasks[9].status).toBe(0);

      expect(obsDealUnsubBeforeNextValues.length).toBe(1);

      expect(obsDealUnsubBeforeNextValues[0].message).toBe('DEAL_UPDATED');
      expect(obsDealUnsubBeforeNextValues[0].tasksCount).toBe(10);
      expect(obsDealUnsubBeforeNextValues[0].completedTasksCount).toBe(0);
      expect(obsDealUnsubBeforeNextValues[0].failedTasksCount).toBe(0);
      expect(obsDealUnsubBeforeNextValues[0].deal.dealid).toBe(dealid);
      expect(Object.entries(obsDealUnsubBeforeNextValues[0].tasks).length).toBe(
        10,
      );
      expect(obsDealUnsubBeforeNextValues[0].tasks[0].status).toBe(0);
      expect(obsDealUnsubBeforeNextValues[0].tasks[1].status).toBe(0);
      expect(obsDealUnsubBeforeNextValues[0].tasks[2].status).toBe(0);
      expect(obsDealUnsubBeforeNextValues[0].tasks[3].status).toBe(0);
      expect(obsDealUnsubBeforeNextValues[0].tasks[4].status).toBe(0);
      expect(obsDealUnsubBeforeNextValues[0].tasks[5].status).toBe(0);
      expect(obsDealUnsubBeforeNextValues[0].tasks[6].status).toBe(0);
      expect(obsDealUnsubBeforeNextValues[0].tasks[7].status).toBe(0);
      expect(obsDealUnsubBeforeNextValues[0].tasks[8].status).toBe(0);
      expect(obsDealUnsubBeforeNextValues[0].tasks[9].status).toBe(0);
    });

    test('exits on deal timeout', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const { iexec: iexecAdmin } = getTestConfig(iexecTestChain)({
        privateKey: iexecTestChain.pocoAdminWallet.privateKey,
      });
      const catid = (
        await iexecAdmin.hub.createCategory({
          name: 'custom',
          description: 'desc',
          workClockTimeRef: 2,
        })
      ).catid.toString();
      const apporder = await deployAndGetApporder(iexec, { volume: 10 });
      const workerpoolorder = await deployAndGetWorkerpoolorder(iexec, {
        category: catid,
        volume: 10,
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

      const obsDealCompleteValues = [];
      const obsDealWithWrongDealidValues = [];
      const obsDealUnsubBeforeCompleteValues = [];

      let unsubObsDealBeforeComplete;

      const [
        obsDealComplete,
        obsDealWithWrongDealidError,
        obsDealUnsubBeforeComplete,
      ] = await Promise.all([
        new Promise((resolve, reject) => {
          iexec.deal
            .obsDeal(dealid)
            .then((obs) => {
              obs.subscribe({
                next: (value) => {
                  obsDealCompleteValues.push(value);
                },
                error: () => reject(Error('obsDeal should not call error')),
                complete: resolve,
              });
            })
            .catch(reject);
        }),
        new Promise((resolve, reject) => {
          iexec.deal
            .obsDeal(NULL_BYTES32)
            .then((obs) => {
              obs.subscribe({
                next: (value) => {
                  obsDealWithWrongDealidValues.push(value);
                },
                error: resolve,
                complete: () =>
                  reject(
                    Error('obsDeal with wrong dealid should not call complete'),
                  ),
              });
            })
            .catch(reject);
        }),
        new Promise((resolve, reject) => {
          iexec.deal
            .obsDeal(dealid)
            .then((obs) => {
              unsubObsDealBeforeComplete = obs.subscribe({
                next: (value) => {
                  unsubObsDealBeforeComplete();
                  obsDealUnsubBeforeCompleteValues.push(value);
                },
                error: () =>
                  reject(
                    Error(
                      'obsDeal unsub before complete should not call error',
                    ),
                  ),
                complete: () =>
                  reject(
                    Error(
                      'obsDeal unsub before complete should not call complete',
                    ),
                  ),
              });
              sleep(10000).then(resolve);
            })
            .catch(reject);
        }),
        sleep(5000)
          .then(() => initializeTask(iexecTestChain)(dealid, 5))
          .then(() => sleep(1000))
          .then(() => initializeTask(iexecTestChain)(dealid, 0)),
      ]);

      expect(obsDealComplete).toBeUndefined();
      expect(obsDealWithWrongDealidError).toEqual(
        new ObjectNotFoundError('deal', NULL_BYTES32, iexecTestChain.chainId),
      );
      expect(obsDealUnsubBeforeComplete).toBeUndefined();

      expect(obsDealCompleteValues.length).toBe(13);

      expect(obsDealCompleteValues[0].message).toBe('DEAL_UPDATED');
      expect(obsDealCompleteValues[0].tasksCount).toBe(10);
      expect(obsDealCompleteValues[0].completedTasksCount).toBe(0);
      expect(obsDealCompleteValues[0].failedTasksCount).toBe(0);
      expect(obsDealCompleteValues[0].deal.dealid).toBe(dealid);
      expect(Object.entries(obsDealCompleteValues[0].tasks).length).toBe(10);
      expect(obsDealCompleteValues[0].tasks[0].status).toBe(0);
      expect(obsDealCompleteValues[0].tasks[1].status).toBe(0);
      expect(obsDealCompleteValues[0].tasks[2].status).toBe(0);
      expect(obsDealCompleteValues[0].tasks[3].status).toBe(0);
      expect(obsDealCompleteValues[0].tasks[4].status).toBe(0);
      expect(obsDealCompleteValues[0].tasks[5].status).toBe(0);
      expect(obsDealCompleteValues[0].tasks[6].status).toBe(0);
      expect(obsDealCompleteValues[0].tasks[7].status).toBe(0);
      expect(obsDealCompleteValues[0].tasks[8].status).toBe(0);
      expect(obsDealCompleteValues[0].tasks[9].status).toBe(0);

      expect(obsDealCompleteValues[2].message).toBe('DEAL_UPDATED');
      expect(obsDealCompleteValues[2].tasksCount).toBe(10);
      expect(obsDealCompleteValues[2].completedTasksCount).toBe(0);
      expect(obsDealCompleteValues[2].failedTasksCount).toBe(0);
      expect(obsDealCompleteValues[2].deal.dealid).toBe(dealid);
      expect(Object.entries(obsDealCompleteValues[2].tasks).length).toBe(10);
      expect(obsDealCompleteValues[2].tasks[0].status).toBe(1);
      expect(obsDealCompleteValues[2].tasks[1].status).toBe(0);
      expect(obsDealCompleteValues[2].tasks[2].status).toBe(0);
      expect(obsDealCompleteValues[2].tasks[3].status).toBe(0);
      expect(obsDealCompleteValues[2].tasks[4].status).toBe(0);
      expect(obsDealCompleteValues[2].tasks[5].status).toBe(1);
      expect(obsDealCompleteValues[2].tasks[6].status).toBe(0);
      expect(obsDealCompleteValues[2].tasks[7].status).toBe(0);
      expect(obsDealCompleteValues[2].tasks[8].status).toBe(0);
      expect(obsDealCompleteValues[2].tasks[9].status).toBe(0);

      expect(obsDealCompleteValues[11].message).toBe('DEAL_UPDATED');
      expect(obsDealCompleteValues[11].tasksCount).toBe(10);
      expect(obsDealCompleteValues[11].completedTasksCount).toBe(0);
      expect(obsDealCompleteValues[11].failedTasksCount).toBe(9);
      expect(obsDealCompleteValues[11].deal.dealid).toBe(dealid);
      expect(Object.entries(obsDealCompleteValues[11].tasks).length).toBe(10);
      expect(obsDealCompleteValues[11].tasks[0].status).toBe(1);
      expect(obsDealCompleteValues[11].tasks[1].status).toBe(0);
      expect(obsDealCompleteValues[11].tasks[2].status).toBe(0);
      expect(obsDealCompleteValues[11].tasks[3].status).toBe(0);
      expect(obsDealCompleteValues[11].tasks[4].status).toBe(0);
      expect(obsDealCompleteValues[11].tasks[5].status).toBe(1);
      expect(obsDealCompleteValues[11].tasks[6].status).toBe(0);
      expect(obsDealCompleteValues[11].tasks[7].status).toBe(0);
      expect(obsDealCompleteValues[11].tasks[8].status).toBe(0);
      expect(obsDealCompleteValues[11].tasks[9].status).toBe(0);

      expect(obsDealCompleteValues[12].message).toBe('DEAL_TIMEDOUT');
      expect(obsDealCompleteValues[12].tasksCount).toBe(10);
      expect(obsDealCompleteValues[12].completedTasksCount).toBe(0);
      expect(obsDealCompleteValues[12].failedTasksCount).toBe(10);
      expect(obsDealCompleteValues[12].deal.dealid).toBe(dealid);
      expect(Object.entries(obsDealCompleteValues[12].tasks).length).toBe(10);
      expect(obsDealCompleteValues[12].tasks[0].status).toBe(1);
      expect(obsDealCompleteValues[12].tasks[1].status).toBe(0);
      expect(obsDealCompleteValues[12].tasks[2].status).toBe(0);
      expect(obsDealCompleteValues[12].tasks[3].status).toBe(0);
      expect(obsDealCompleteValues[12].tasks[4].status).toBe(0);
      expect(obsDealCompleteValues[12].tasks[5].status).toBe(1);
      expect(obsDealCompleteValues[12].tasks[6].status).toBe(0);
      expect(obsDealCompleteValues[12].tasks[7].status).toBe(0);
      expect(obsDealCompleteValues[12].tasks[8].status).toBe(0);
      expect(obsDealCompleteValues[12].tasks[9].status).toBe(0);

      expect(obsDealWithWrongDealidValues.length).toBe(0);

      expect(obsDealUnsubBeforeCompleteValues.length).toBe(1);

      expect(obsDealUnsubBeforeCompleteValues[0].message).toBe('DEAL_UPDATED');
      expect(obsDealUnsubBeforeCompleteValues[0].tasksCount).toBe(10);
      expect(obsDealUnsubBeforeCompleteValues[0].completedTasksCount).toBe(0);
      expect(obsDealUnsubBeforeCompleteValues[0].failedTasksCount).toBe(0);
      expect(obsDealUnsubBeforeCompleteValues[0].deal.dealid).toBe(dealid);
      expect(
        Object.entries(obsDealUnsubBeforeCompleteValues[0].tasks).length,
      ).toBe(10);
      expect(obsDealUnsubBeforeCompleteValues[0].tasks[0].status).toBe(0);
      expect(obsDealUnsubBeforeCompleteValues[0].tasks[1].status).toBe(0);
      expect(obsDealUnsubBeforeCompleteValues[0].tasks[2].status).toBe(0);
      expect(obsDealUnsubBeforeCompleteValues[0].tasks[3].status).toBe(0);
      expect(obsDealUnsubBeforeCompleteValues[0].tasks[4].status).toBe(0);
      expect(obsDealUnsubBeforeCompleteValues[0].tasks[5].status).toBe(0);
      expect(obsDealUnsubBeforeCompleteValues[0].tasks[6].status).toBe(0);
      expect(obsDealUnsubBeforeCompleteValues[0].tasks[7].status).toBe(0);
      expect(obsDealUnsubBeforeCompleteValues[0].tasks[8].status).toBe(0);
      expect(obsDealUnsubBeforeCompleteValues[0].tasks[9].status).toBe(0);
    });
  });
});
