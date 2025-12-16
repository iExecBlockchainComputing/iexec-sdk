import { describe, test, expect, beforeAll } from '@jest/globals';
import {
  deployAndGetApporder,
  deployAndGetWorkerpoolorder,
  expectAsyncCustomError,
  getMatchableRequestorder,
  getTestConfig,
} from '../lib-test-utils.js';
import {
  NULL_BYTES32,
  SERVICE_HTTP_500_URL,
  SERVICE_UNREACHABLE_URL,
  TEST_CHAINS,
  adminCreateCategory,
  initializeTask,
  sleep,
} from '../../test-utils.js';
import '../../jest-setup.js';
import { errors, IExec } from '../../../src/lib/index.js';
import { WorkerpoolCallError } from '../../../src/lib/errors.js';

const { ObjectNotFoundError, IpfsGatewayCallError } = errors;

const iexecTestChain = TEST_CHAINS['bellecour-fork'];

describe('task', () => {
  describe('fetchResults()', () => {
    const BELLECOUR_COMPLETED_TASK_ID =
      '0x71a9ccb619dd7712b1cd6ee88c018ef4da05820d95e3bfd6693f4914cae39181';

    test("throw a IpfsGatewayCallError when the IPFS gateway can't be reached", async () => {
      const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
        readOnly: true,
        options: {
          ipfsGatewayURL: SERVICE_UNREACHABLE_URL,
        },
      });
      await expectAsyncCustomError(
        iexecReadOnly.task.fetchResults(BELLECOUR_COMPLETED_TASK_ID),
        {
          constructor: IpfsGatewayCallError,
          message: `IPFS gateway error: Connection to ${SERVICE_UNREACHABLE_URL} failed with a network error`,
        },
      );
    });

    test('throw a IpfsGatewayCallError when the IPFS gateway encounters an error', async () => {
      const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
        readOnly: true,
        options: {
          ipfsGatewayURL: SERVICE_HTTP_500_URL,
        },
      });
      await expectAsyncCustomError(
        iexecReadOnly.task.fetchResults(BELLECOUR_COMPLETED_TASK_ID),
        {
          constructor: IpfsGatewayCallError,
          message: `IPFS gateway error: Server at ${SERVICE_HTTP_500_URL} encountered an internal error`,
        },
      );
    });

    test('downloads the result archive from IPFS', async () => {
      const iexecReadOnly = new IExec({ ethProvider: 'bellecour' });
      const res = await iexecReadOnly.task.fetchResults(
        BELLECOUR_COMPLETED_TASK_ID,
      );
      expect(res).toBeInstanceOf(Response);
    });
  });

  describe.skip('obsTask()', () => {
    test('emits task updates', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      const catid = (
        await adminCreateCategory(iexecTestChain)({
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
                    new Error(
                      'obsTask unsub before next should not call error',
                    ),
                  ),
                complete: () =>
                  reject(
                    new Error(
                      'obsTask unsub before next should not call complete',
                    ),
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
                      new Error('obsTask after init should not call complete'),
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
      const catid = (
        await adminCreateCategory(iexecTestChain)({
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
                    new Error(
                      'obsTask with wrong dealid should not call complete',
                    ),
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
                    new Error('obsTask unsubscribed should nol call complete'),
                  ),
                complete: () =>
                  reject(
                    new Error('obsTask unsubscribed should nol call complete'),
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

  describe('fetchOffchainInfo()', () => {
    test('throw when workerpool API is not configured', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      await expect(
        iexec.task.fetchOffchainInfo(
          '0xf835e22624dd305c6a1f6c6b5688b92231455778847e7ef3bee1091e627e8786',
        ),
      ).rejects.toThrow(
        new Error(
          'Impossible to resolve API url for workerpool 0x13EE8c43Abd7dFAcfa4C42554Dff72d9fbcF3330',
        ),
      );
    });

    describe('when workerpool API is configured', () => {
      const { iexec: iexecRequester } = getTestConfig(iexecTestChain)();
      const { iexec: iexecWorkerpoolOwner } = getTestConfig(iexecTestChain)();
      let taskid;
      let workerpool;

      beforeAll(async () => {
        const workerpoolorder =
          await deployAndGetWorkerpoolorder(iexecWorkerpoolOwner);
        const apporder = await deployAndGetApporder(iexecWorkerpoolOwner);

        workerpool = workerpoolorder.workerpool;
        const { name: workerpoolEns } =
          await iexecWorkerpoolOwner.ens.claimName(
            workerpool.toLowerCase(),
            await iexecWorkerpoolOwner.ens.getDefaultDomain(workerpool),
          );
        await iexecWorkerpoolOwner.ens.configureResolution(
          workerpoolEns,
          workerpool,
        );
        const requestorder = await getMatchableRequestorder(iexecRequester, {
          workerpoolorder,
          apporder,
        });
        const { dealid } = await iexecRequester.order.matchOrders({
          apporder,
          workerpoolorder,
          requestorder,
        });
        await initializeTask(iexecTestChain)(dealid, 0);
        taskid = await iexecRequester.deal.computeTaskId(dealid, 0);
      });

      test('throw WorkerpoolCallError when the workerpool API is unreachable', async () => {
        await iexecWorkerpoolOwner.workerpool.setWorkerpoolApiUrl(
          workerpool,
          SERVICE_UNREACHABLE_URL,
        );
        await expect(
          iexecRequester.task.fetchOffchainInfo(taskid),
        ).rejects.toThrow(
          new WorkerpoolCallError(
            `Connection to ${SERVICE_UNREACHABLE_URL} failed with a network error`,
          ),
        );
      });

      test('throw WorkerpoolCallError when the workerpool API answers with error', async () => {
        await iexecWorkerpoolOwner.workerpool.setWorkerpoolApiUrl(
          workerpool,
          SERVICE_HTTP_500_URL,
        );
        await expect(
          iexecRequester.task.fetchOffchainInfo(taskid),
        ).rejects.toThrow(
          new WorkerpoolCallError(
            `Server at ${SERVICE_HTTP_500_URL} encountered an internal error`,
            new Error('Server internal error: 500 Internal Server Error'),
          ),
        );
      });
    });
  });

  describe('fetchLogs()', () => {
    test('throw when workerpool API is not configured', async () => {
      const { iexec } = getTestConfig(iexecTestChain)();
      await expect(
        iexec.task.fetchLogs(
          '0xf835e22624dd305c6a1f6c6b5688b92231455778847e7ef3bee1091e627e8786',
        ),
      ).rejects.toThrow(
        new Error(
          'Impossible to resolve API url for workerpool 0x13EE8c43Abd7dFAcfa4C42554Dff72d9fbcF3330',
        ),
      );
    });

    describe('when workerpool API is configured', () => {
      const { iexec: iexecRequester } = getTestConfig(iexecTestChain)();
      const { iexec: iexecWorkerpoolOwner } = getTestConfig(iexecTestChain)();
      let taskid;
      let workerpool;

      beforeAll(async () => {
        const workerpoolorder =
          await deployAndGetWorkerpoolorder(iexecWorkerpoolOwner);
        const apporder = await deployAndGetApporder(iexecWorkerpoolOwner);

        workerpool = workerpoolorder.workerpool;
        const { name: workerpoolEns } =
          await iexecWorkerpoolOwner.ens.claimName(
            workerpool.toLowerCase(),
            await iexecWorkerpoolOwner.ens.getDefaultDomain(workerpool),
          );
        await iexecWorkerpoolOwner.ens.configureResolution(
          workerpoolEns,
          workerpool,
        );
        const requestorder = await getMatchableRequestorder(iexecRequester, {
          workerpoolorder,
          apporder,
        });
        const { dealid } = await iexecRequester.order.matchOrders({
          apporder,
          workerpoolorder,
          requestorder,
        });
        await initializeTask(iexecTestChain)(dealid, 0);
        taskid = await iexecRequester.deal.computeTaskId(dealid, 0);
      });

      test('throw when user is not the requester', async () => {
        const { iexec } = getTestConfig(iexecTestChain)();
        await iexecWorkerpoolOwner.workerpool.setWorkerpoolApiUrl(
          workerpool,
          SERVICE_UNREACHABLE_URL,
        );
        await expect(iexec.task.fetchLogs(taskid)).rejects.toThrow(
          new Error(
            `Only task requester ${await iexecRequester.wallet.getAddress()} can access replicates logs`,
          ),
        );
      });

      test('throw WorkerpoolCallError when the workerpool API is unreachable', async () => {
        await iexecWorkerpoolOwner.workerpool.setWorkerpoolApiUrl(
          workerpool,
          SERVICE_UNREACHABLE_URL,
        );
        await expect(iexecRequester.task.fetchLogs(taskid)).rejects.toThrow(
          new WorkerpoolCallError(
            `Connection to ${SERVICE_UNREACHABLE_URL} failed with a network error`,
          ),
        );
      });

      test('throw WorkerpoolCallError when the workerpool API answers with error', async () => {
        await iexecWorkerpoolOwner.workerpool.setWorkerpoolApiUrl(
          workerpool,
          SERVICE_HTTP_500_URL,
        );
        await expect(iexecRequester.task.fetchLogs(taskid)).rejects.toThrow(
          new WorkerpoolCallError(
            `Server at ${SERVICE_HTTP_500_URL} encountered an internal error`,
            new Error('Server internal error: 500 Internal Server Error'),
          ),
        );
      });
    });
  });
});
