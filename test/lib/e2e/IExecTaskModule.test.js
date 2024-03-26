// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest, describe, test } from '@jest/globals';
import {
  deployAndGetApporder,
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

describe('task', () => {
  describe('obsTask()', () => {
    test('emits task updates', async () => {
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
      const apporder = await deployAndGetApporder(iexec);
      const workerpoolorder = await deployAndGetWorkerpoolorder(iexec, {
        category: catid,
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
      const { tasks } = await iexec.deal.show(dealid);
      const taskid = tasks[0];

      const obsTaskWithDealidValues = [];
      const obsTaskUnsubBeforeNextValues = [];
      const obsTaskAfterInitValues = [];

      let unsubObsTaskWithDealid;
      let unsubObsTaskBeforeNext;
      let unsubObsTaskAfterInit;

      await Promise.all([
        new Promise((resolve, reject) => {
          iexec.task
            .obsTask(taskid, { dealid })
            .then((obs) => {
              unsubObsTaskWithDealid = obs.subscribe({
                next: (value) => {
                  obsTaskWithDealidValues.push(value);
                },
                error: () =>
                  reject(Error('obsTask with dealid should not call error')),
                complete: () =>
                  reject(Error('obsTask with dealid should not call complete')),
              });
              sleep(10000).then(resolve);
            })
            .catch(reject);
        }),
        new Promise((resolve, reject) => {
          iexec.task
            .obsTask(taskid, { dealid })
            .then((obs) => {
              unsubObsTaskBeforeNext = obs.subscribe({
                next: (value) => {
                  obsTaskUnsubBeforeNextValues.push(value);
                  try {
                    unsubObsTaskBeforeNext();
                  } catch (e) {
                    reject(e);
                  }
                },
                error: () =>
                  reject(
                    Error('obsTask unsub before next should not call error'),
                  ),
                complete: () =>
                  reject(
                    Error('obsTask unsub before next should not call complete'),
                  ),
              });
              sleep(10000).then(resolve);
            })
            .catch(reject);
        }),
        new Promise((resolve, reject) => {
          sleep(5000).then(() => {
            iexec.task
              .obsTask(taskid)
              .then((obs) => {
                unsubObsTaskAfterInit = obs.subscribe({
                  next: (value) => {
                    obsTaskAfterInitValues.push(value);
                  },
                  error: () =>
                    reject(Error('obsTask after init should not call error')),
                  complete: () =>
                    reject(
                      Error('obsTask after init should not call complete'),
                    ),
                });
                sleep(5000).then(resolve);
              })
              .catch(reject);
          });
        }),
        sleep(1000).then(() => initializeTask(iexecTestChain)(dealid, 0)),
      ]);

      expect(unsubObsTaskWithDealid).toBeInstanceOf(Function);
      expect(unsubObsTaskBeforeNext).toBeInstanceOf(Function);
      expect(unsubObsTaskAfterInit).toBeInstanceOf(Function);

      unsubObsTaskWithDealid();
      unsubObsTaskAfterInit();

      expect(obsTaskWithDealidValues.length).toBe(2);

      expect(obsTaskWithDealidValues[0].message).toBe('TASK_UPDATED');
      expect(obsTaskWithDealidValues[0].task.taskid).toBe(taskid);
      expect(obsTaskWithDealidValues[0].task.dealid).toBe(dealid);
      expect(obsTaskWithDealidValues[0].task.status).toBe(0);
      expect(obsTaskWithDealidValues[0].task.statusName).toBe('UNSET');
      expect(obsTaskWithDealidValues[0].task.taskTimedOut).toBe(false);

      expect(obsTaskWithDealidValues[1].message).toBe('TASK_UPDATED');
      expect(obsTaskWithDealidValues[1].task.taskid).toBe(taskid);
      expect(obsTaskWithDealidValues[1].task.dealid).toBe(dealid);
      expect(obsTaskWithDealidValues[1].task.status).toBe(1);
      expect(obsTaskWithDealidValues[1].task.statusName).toBe('ACTIVE');
      expect(obsTaskWithDealidValues[1].task.taskTimedOut).toBe(false);

      expect(obsTaskUnsubBeforeNextValues.length).toBe(1);

      expect(obsTaskUnsubBeforeNextValues[0].message).toBe('TASK_UPDATED');
      expect(obsTaskUnsubBeforeNextValues[0].task.taskid).toBe(taskid);
      expect(obsTaskUnsubBeforeNextValues[0].task.dealid).toBe(dealid);
      expect(obsTaskUnsubBeforeNextValues[0].task.status).toBe(0);
      expect(obsTaskUnsubBeforeNextValues[0].task.statusName).toBe('UNSET');
      expect(obsTaskUnsubBeforeNextValues[0].task.taskTimedOut).toBe(false);

      expect(obsTaskAfterInitValues.length).toBe(1);

      expect(obsTaskAfterInitValues[0].message).toBe('TASK_UPDATED');
      expect(obsTaskAfterInitValues[0].task.taskid).toBe(taskid);
      expect(obsTaskAfterInitValues[0].task.dealid).toBe(dealid);
      expect(obsTaskAfterInitValues[0].task.status).toBe(1);
      expect(obsTaskAfterInitValues[0].task.statusName).toBe('ACTIVE');
      expect(obsTaskAfterInitValues[0].task.taskTimedOut).toBe(false);
    });

    test('exits on task (deal) timeout', async () => {
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
      const apporder = await deployAndGetApporder(iexec);
      const workerpoolorder = await deployAndGetWorkerpoolorder(iexec, {
        category: catid,
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
      const { tasks } = await iexec.deal.show(dealid);
      const taskid = tasks[0];

      const obsTaskWithDealidValues = [];
      const obsTaskWithWrongDealidValues = [];
      const obsTaskBeforeInitValues = [];
      const obsTaskAfterInitValues = [];
      const obsTaskUnsubBeforeCompleteValues = [];

      let unsubObsTaskBeforeComplete;

      const [
        obsTaskWithDealidComplete,
        obsTaskWithWrongDealidError,
        obsTaskBeforeInitError,
        obsTaskAfterInitComplete,
      ] = await Promise.all([
        new Promise((resolve, reject) => {
          iexec.task
            .obsTask(taskid, { dealid })
            .then((obs) => {
              obs.subscribe({
                next: (value) => {
                  obsTaskWithDealidValues.push(value);
                },
                error: () =>
                  reject(Error('obsTask with dealid should not call error')),
                complete: resolve,
              });
            })
            .catch(reject);
        }),
        new Promise((resolve, reject) => {
          iexec.task
            .obsTask(taskid, { dealid: NULL_BYTES32 })
            .then((obs) => {
              obs.subscribe({
                next: (value) => {
                  obsTaskWithWrongDealidValues.push(value);
                },
                error: resolve,
                complete: () =>
                  reject(
                    Error('obsTask with wrong dealid should not call complete'),
                  ),
              });
            })
            .catch(reject);
        }),
        new Promise((resolve, reject) => {
          iexec.task
            .obsTask(taskid)
            .then((obs) => {
              obs.subscribe({
                next: (value) => {
                  obsTaskBeforeInitValues.push(value);
                },
                error: resolve,
                complete: () =>
                  reject(Error('obsTask before init should not call complete')),
              });
            })
            .catch(reject);
        }),
        new Promise((resolve, reject) => {
          sleep(5000).then(() => {
            iexec.task
              .obsTask(taskid)
              .then((obs) => {
                obs.subscribe({
                  next: (value) => {
                    obsTaskAfterInitValues.push(value);
                  },
                  error: () =>
                    reject(Error('obsTask after init should not call error')),
                  complete: resolve,
                });
              })
              .catch(reject);
          });
        }),
        new Promise((resolve, reject) => {
          iexec.task
            .obsTask(taskid, { dealid })
            .then((obs) => {
              unsubObsTaskBeforeComplete = obs.subscribe({
                next: (value) => {
                  obsTaskUnsubBeforeCompleteValues.push(value);
                },
                error: () =>
                  reject(
                    Error('obsTask unsubscribed should nol call complete'),
                  ),
                complete: () =>
                  reject(
                    Error('obsTask unsubscribed should nol call complete'),
                  ),
              });
              sleep(2000).then(resolve);
            })
            .catch(reject);
        }),
        sleep(2000).then(() => {
          unsubObsTaskBeforeComplete();
          initializeTask(iexecTestChain)(dealid, 0);
        }),
      ]);

      expect(obsTaskWithDealidComplete).toBeUndefined();
      expect(obsTaskWithWrongDealidError).toEqual(
        new ObjectNotFoundError('deal', NULL_BYTES32, iexecTestChain.chainId),
      );
      expect(obsTaskBeforeInitError).toEqual(
        new ObjectNotFoundError('task', taskid, iexecTestChain.chainId),
      );
      expect(obsTaskAfterInitComplete).toBeUndefined();

      expect(obsTaskWithDealidValues.length).toBe(3);

      expect(obsTaskWithDealidValues[0].message).toBe('TASK_UPDATED');
      expect(obsTaskWithDealidValues[0].task.taskid).toBe(taskid);
      expect(obsTaskWithDealidValues[0].task.dealid).toBe(dealid);
      expect(obsTaskWithDealidValues[0].task.status).toBe(0);
      expect(obsTaskWithDealidValues[0].task.statusName).toBe('UNSET');
      expect(obsTaskWithDealidValues[0].task.taskTimedOut).toBe(false);

      expect(obsTaskWithDealidValues[1].message).toBe('TASK_UPDATED');
      expect(obsTaskWithDealidValues[1].task.taskid).toBe(taskid);
      expect(obsTaskWithDealidValues[1].task.dealid).toBe(dealid);
      expect(obsTaskWithDealidValues[1].task.status).toBe(1);
      expect(obsTaskWithDealidValues[1].task.statusName).toBe('ACTIVE');
      expect(obsTaskWithDealidValues[1].task.taskTimedOut).toBe(false);

      expect(obsTaskWithDealidValues[2].message).toBe('TASK_TIMEDOUT');
      expect(obsTaskWithDealidValues[2].task.taskid).toBe(taskid);
      expect(obsTaskWithDealidValues[2].task.dealid).toBe(dealid);
      expect(obsTaskWithDealidValues[2].task.status).toBe(1);
      expect(obsTaskWithDealidValues[2].task.statusName).toBe('TIMEOUT');
      expect(obsTaskWithDealidValues[2].task.taskTimedOut).toBe(true);

      expect(obsTaskWithWrongDealidValues.length).toBe(0);

      expect(obsTaskBeforeInitValues.length).toBe(0);

      expect(obsTaskAfterInitValues.length).toBe(2);

      expect(obsTaskAfterInitValues[0].message).toBe('TASK_UPDATED');
      expect(obsTaskAfterInitValues[0].task.taskid).toBe(taskid);
      expect(obsTaskAfterInitValues[0].task.dealid).toBe(dealid);
      expect(obsTaskAfterInitValues[0].task.status).toBe(1);
      expect(obsTaskAfterInitValues[0].task.statusName).toBe('ACTIVE');
      expect(obsTaskAfterInitValues[0].task.taskTimedOut).toBe(false);

      expect(obsTaskAfterInitValues[1].message).toBe('TASK_TIMEDOUT');
      expect(obsTaskAfterInitValues[1].task.taskid).toBe(taskid);
      expect(obsTaskAfterInitValues[1].task.dealid).toBe(dealid);
      expect(obsTaskAfterInitValues[1].task.status).toBe(1);
      expect(obsTaskAfterInitValues[1].task.statusName).toBe('TIMEOUT');
      expect(obsTaskAfterInitValues[1].task.taskTimedOut).toBe(true);

      expect(obsTaskUnsubBeforeCompleteValues.length).toBe(1);

      expect(obsTaskUnsubBeforeCompleteValues[0].message).toBe('TASK_UPDATED');
      expect(obsTaskUnsubBeforeCompleteValues[0].task.taskid).toBe(taskid);
      expect(obsTaskUnsubBeforeCompleteValues[0].task.dealid).toBe(dealid);
      expect(obsTaskUnsubBeforeCompleteValues[0].task.status).toBe(0);
      expect(obsTaskUnsubBeforeCompleteValues[0].task.statusName).toBe('UNSET');
      expect(obsTaskUnsubBeforeCompleteValues[0].task.taskTimedOut).toBe(false);
    });
  });
});
