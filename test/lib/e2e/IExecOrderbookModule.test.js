// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test, expect } from '@jest/globals';
import {
  deployAndGetApporder,
  deployAndGetDatasetorder,
  deployAndGetWorkerpoolorder,
  expectAsyncCustomError,
  getMatchableRequestorder,
  getTestConfig,
} from '../lib-test-utils';
import {
  TEST_CHAINS,
  NULL_ADDRESS,
  getRandomAddress,
  SERVICE_UNREACHABLE_URL,
  SERVICE_HTTP_500_URL,
  getRandomBytes32,
} from '../../test-utils';
import '../../jest-setup';
import { MarketCallError } from '../../../src/lib/errors';

const iexecTestChain = TEST_CHAINS['bellecour-fork'];

describe('orderbook', () => {
  describe('fetch...Order()', () => {
    test("throw a MarketCallError when the Market API can't be reached", async () => {
      const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
        readOnly: true,
        options: {
          iexecGatewayURL: SERVICE_UNREACHABLE_URL,
        },
      });
      await expectAsyncCustomError(
        iexecReadOnly.orderbook.fetchApporder(getRandomBytes32()),
        {
          constructor: MarketCallError,
          message: `Market API error: Connection to ${SERVICE_UNREACHABLE_URL} failed with a network error`,
        },
      );
    });

    test('throw a MarketCallError when the Market API encounters an error', async () => {
      const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
        readOnly: true,
        options: {
          iexecGatewayURL: SERVICE_HTTP_500_URL,
        },
      });
      await expectAsyncCustomError(
        iexecReadOnly.orderbook.fetchApporder(getRandomBytes32()),
        {
          constructor: MarketCallError,
          message: `Market API error: Server at ${SERVICE_HTTP_500_URL} encountered an internal error`,
        },
      );
    });

    describe('fetchApporder()', () => {
      test('anyone can get a published order by hash', async () => {
        const { iexec } = getTestConfig(iexecTestChain)();
        const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
          readOnly: true,
        });
        const apporder = await deployAndGetApporder(iexec);
        const orderHash = await iexecReadOnly.order.hashApporder(apporder);
        await expect(
          iexecReadOnly.orderbook.fetchApporder(orderHash),
        ).rejects.toThrow(Error('API error: apporder not found'));
        await iexec.order.publishApporder(apporder);
        const found = await iexecReadOnly.orderbook.fetchApporder(orderHash);
        expect(found.order).toLooseEqual(apporder);
        expect(found.status).toBe('open');
        expect(found.remaining).toBe(1);
        expect(found.publicationTimestamp).toBeDefined();
      });
    });

    describe('fetchDatasetorder()', () => {
      test('anyone can get a published order by hash', async () => {
        const { iexec } = getTestConfig(iexecTestChain)();
        const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
          readOnly: true,
        });
        const datasetorder = await deployAndGetDatasetorder(iexec);
        const orderHash = await iexec.order.hashDatasetorder(datasetorder);
        await expect(
          iexecReadOnly.orderbook.fetchDatasetorder(orderHash),
        ).rejects.toThrow(Error('API error: datasetorder not found'));
        await iexec.order.publishDatasetorder(datasetorder, {
          preflightCheck: false,
        });
        const found =
          await iexecReadOnly.orderbook.fetchDatasetorder(orderHash);
        expect(found.order).toLooseEqual(datasetorder);
        expect(found.status).toBe('open');
        expect(found.remaining).toBe(1);
        expect(found.publicationTimestamp).toBeDefined();
      });
    });

    describe('fetchWorkerpoolorder()', () => {
      test('anyone can get a published order by hash', async () => {
        const { iexec } = getTestConfig(iexecTestChain)();
        const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
          readOnly: true,
        });
        const workerpoolorder = await deployAndGetWorkerpoolorder(iexec);
        const orderHash =
          await iexec.order.hashWorkerpoolorder(workerpoolorder);
        await expect(
          iexecReadOnly.orderbook.fetchWorkerpoolorder(orderHash),
        ).rejects.toThrow(Error('API error: workerpoolorder not found'));
        await iexec.order.publishWorkerpoolorder(workerpoolorder);
        const found =
          await iexecReadOnly.orderbook.fetchWorkerpoolorder(orderHash);
        expect(found.order).toLooseEqual(workerpoolorder);
        expect(found.status).toBe('open');
        expect(found.remaining).toBe(1);
        expect(found.publicationTimestamp).toBeDefined();
      });
    });

    describe('fetchRequestorder()', () => {
      test('anyone can get a published order by hash', async () => {
        const { iexec, wallet } = getTestConfig(iexecTestChain)();
        const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
          readOnly: true,
        });
        const apporder = await deployAndGetApporder(iexec);
        await iexec.order.publishApporder(apporder);
        const requestorder = await iexec.order
          .createRequestorder({
            requester: wallet.address,
            app: apporder.app,
            appmaxprice: apporder.appprice,
            dataset: NULL_ADDRESS,
            datasetmaxprice: 0,
            workerpool: NULL_ADDRESS,
            workerpoolmaxprice: 0,
            category: 1,
            trust: 0,
            volume: 1,
          })
          .then((o) =>
            iexec.order.signRequestorder(o, { preflightCheck: false }),
          );
        const orderHash = await iexec.order.hashRequestorder(requestorder);
        await expect(
          iexecReadOnly.orderbook.fetchRequestorder(orderHash),
        ).rejects.toThrow(Error('API error: requestorder not found'));
        await iexec.order.publishRequestorder(requestorder, {
          preflightCheck: false,
        });
        const found =
          await iexecReadOnly.orderbook.fetchRequestorder(orderHash);
        expect(found.order).toLooseEqual(requestorder);
        expect(found.status).toBe('open');
        expect(found.remaining).toBe(1);
        expect(found.publicationTimestamp).toBeDefined();
      });
    });
  });

  describe('fetch...Orderbook()', () => {
    test("throw a MarketCallError when the Market API can't be reached", async () => {
      const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
        readOnly: true,
        options: {
          iexecGatewayURL: SERVICE_UNREACHABLE_URL,
        },
      });
      await expectAsyncCustomError(
        iexecReadOnly.orderbook.fetchAppOrderbook(getRandomAddress()),
        {
          constructor: MarketCallError,
          message: `Market API error: Connection to ${SERVICE_UNREACHABLE_URL} failed with a network error`,
        },
      );
    });

    test('throw a MarketCallError when the Market API encounters an error', async () => {
      const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
        readOnly: true,
        options: {
          iexecGatewayURL: SERVICE_HTTP_500_URL,
        },
      });
      await expectAsyncCustomError(
        iexecReadOnly.orderbook.fetchAppOrderbook(getRandomAddress()),
        {
          constructor: MarketCallError,
          message: `Market API error: Server at ${SERVICE_HTTP_500_URL} encountered an internal error`,
        },
      );
    });
    describe('fetchAppOrderbook()', () => {
      test('returns orders available fo anyone', async () => {
        const { iexec } = getTestConfig(iexecTestChain)();
        const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
          readOnly: true,
        });
        const appAddress = getRandomAddress();
        const res = await iexec.orderbook.fetchAppOrderbook(appAddress);
        expect(res.count).toBe(0);
        expect(res.orders).toStrictEqual([]);
        const apporder = await deployAndGetApporder(iexec);

        for (let i = 0; i < 22; i += 1) {
          await iexec.order
            .signApporder(apporder)
            .then((o) => iexec.order.publishApporder(o));
        }
        for (let i = 0; i < 2; i += 1) {
          await iexec.order
            .signApporder({ ...apporder, datasetrestrict: getRandomAddress() })
            .then((o) => iexec.order.publishApporder(o));
        }
        for (let i = 0; i < 3; i += 1) {
          await iexec.order
            .signApporder({
              ...apporder,
              workerpoolrestrict: getRandomAddress(),
            })
            .then((o) => iexec.order.publishApporder(o));
        }
        for (let i = 0; i < 4; i += 1) {
          await iexec.order
            .signApporder({
              ...apporder,
              requesterrestrict: getRandomAddress(),
            })
            .then((o) => iexec.order.publishApporder(o));
        }
        await deployAndGetApporder(iexec).then((o) =>
          iexec.order.publishApporder(o),
        );

        const res1 = await iexecReadOnly.orderbook.fetchAppOrderbook(
          apporder.app,
        );
        expect(res1.count).toBe(22);
        expect(res1.orders.length).toBe(20);
        expect(res1.more).toBeDefined();
        const res2 = await res1.more();
        expect(res2.count).toBe(22);
        expect(res2.orders.length).toBe(2);
        expect(res2.more).toBeUndefined();
        const res3 = await iexecReadOnly.orderbook.fetchAppOrderbook(
          apporder.app,
          {
            dataset: 'any',
          },
        );
        expect(res3.count).toBe(24);
        const res4 = await iexecReadOnly.orderbook.fetchAppOrderbook(
          apporder.app,
          {
            workerpool: 'any',
          },
        );
        expect(res4.count).toBe(25);
        const res5 = await iexecReadOnly.orderbook.fetchAppOrderbook(
          apporder.app,
          {
            requester: 'any',
          },
        );
        expect(res5.count).toBe(26);
        const res6 = await iexecReadOnly.orderbook.fetchAppOrderbook(
          apporder.app,
          {
            dataset: 'any',
            requester: 'any',
            workerpool: 'any',
          },
        );
        expect(res6.count).toBe(31);
        const res7 = await iexecReadOnly.orderbook.fetchAppOrderbook('any', {
          dataset: 'any',
          requester: 'any',
          workerpool: 'any',
        });
        expect(res7.count >= 32).toBe(true);
      });

      test('strict option allow filtering only orders for specified dataset, workerpool or requester', async () => {
        const { iexec } = getTestConfig(iexecTestChain)();
        const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
          readOnly: true,
        });

        // 1 and 2: orders without any restrictions
        const emptyAppOrder = await deployAndGetApporder(iexec);
        const appAddress = emptyAppOrder.app;

        await iexec.order
          .signApporder(emptyAppOrder)
          .then((o) => iexec.order.publishApporder(o));
        await iexec.order
          .signApporder(emptyAppOrder)
          .then((o) => iexec.order.publishApporder(o));

        // 3: dataset restricted order
        const datasetAddress = getRandomAddress();
        emptyAppOrder.datasetrestrict = datasetAddress;
        await iexec.order
          .signApporder(emptyAppOrder)
          .then((o) => iexec.order.publishApporder(o));
        // reset to empty
        emptyAppOrder.datasetrestrict = NULL_ADDRESS;

        // 4: workerpool restricted order
        const workerpoolAddress = getRandomAddress();
        emptyAppOrder.workerpoolrestrict = workerpoolAddress;
        await iexec.order
          .signApporder(emptyAppOrder)
          .then((o) => iexec.order.publishApporder(o));
        // reset to empty
        emptyAppOrder.workerpoolrestrict = NULL_ADDRESS;

        // 5: requester restricted order
        const requesterAddress = getRandomAddress();
        emptyAppOrder.requesterrestrict = requesterAddress;
        await iexec.order
          .signApporder(emptyAppOrder)
          .then((o) => iexec.order.publishApporder(o));
        // reset to empty
        emptyAppOrder.requesterrestrict = NULL_ADDRESS;

        // all orders (1,2,3,4,5)
        const allAppOrders = await iexecReadOnly.orderbook.fetchAppOrderbook(
          appAddress,
          {
            dataset: 'any',
            requester: 'any',
            workerpool: 'any',
          },
        );
        expect(allAppOrders.count).toBe(5);
        expect(allAppOrders.orders.length).toBe(5);

        // all orders without restrictions (1, 2)
        const unrestrictedAppOrders =
          await iexecReadOnly.orderbook.fetchAppOrderbook(appAddress);
        expect(unrestrictedAppOrders.count).toBe(2);
        expect(unrestrictedAppOrders.orders.length).toBe(2);
        expect(unrestrictedAppOrders.orders[0].order.datasetrestrict).toEqual(
          NULL_ADDRESS,
        );
        expect(
          unrestrictedAppOrders.orders[0].order.workerpoolrestrict,
        ).toEqual(NULL_ADDRESS);
        expect(unrestrictedAppOrders.orders[0].order.requesterrestrict).toEqual(
          NULL_ADDRESS,
        );
        expect(unrestrictedAppOrders.orders[1].order.datasetrestrict).toEqual(
          NULL_ADDRESS,
        );
        expect(
          unrestrictedAppOrders.orders[0].order.workerpoolrestrict,
        ).toEqual(NULL_ADDRESS);
        expect(unrestrictedAppOrders.orders[0].order.requesterrestrict).toEqual(
          NULL_ADDRESS,
        );

        // all orders without dataset restriction(1,2) and with dataset restriction(3)
        const datasetRestrictedAppOrders =
          await iexecReadOnly.orderbook.fetchAppOrderbook(appAddress, {
            dataset: datasetAddress,
          });
        expect(datasetRestrictedAppOrders.count).toBe(3);
        expect(datasetRestrictedAppOrders.orders.length).toBe(3);

        // all orders with dataset restriction and strict(3)
        const datasetStrictAppOrder =
          await iexecReadOnly.orderbook.fetchAppOrderbook(appAddress, {
            dataset: datasetAddress,
            isDatasetStrict: true,
          });
        expect(datasetStrictAppOrder.count).toBe(1);
        expect(datasetStrictAppOrder.orders.length).toBe(1);
        expect(datasetStrictAppOrder.orders[0].order.datasetrestrict).toEqual(
          datasetAddress,
        );

        // all orders without workerpool restriction(1,2) and with workerpool restriction(4)
        const workerpoolRestrictedAppOrders =
          await iexecReadOnly.orderbook.fetchAppOrderbook(appAddress, {
            workerpool: workerpoolAddress,
          });
        expect(workerpoolRestrictedAppOrders.count).toBe(3);
        expect(workerpoolRestrictedAppOrders.orders.length).toBe(3);

        // all orders with workerpool restriction and strict(4)
        const workerpoolStrictAppOrder =
          await iexecReadOnly.orderbook.fetchAppOrderbook(appAddress, {
            workerpool: workerpoolAddress,
            isWorkerpoolStrict: true,
          });
        expect(workerpoolStrictAppOrder.count).toBe(1);
        expect(workerpoolStrictAppOrder.orders.length).toBe(1);
        expect(
          workerpoolStrictAppOrder.orders[0].order.workerpoolrestrict,
        ).toEqual(workerpoolAddress);

        // all orders without requester restriction(1,2) and with requester restriction(5)
        const requesterRestrictedAppOrders =
          await iexecReadOnly.orderbook.fetchAppOrderbook(appAddress, {
            requester: requesterAddress,
          });
        expect(requesterRestrictedAppOrders.count).toBe(3);
        expect(requesterRestrictedAppOrders.orders.length).toBe(3);

        // all orders with requester restriction and strict(5)
        const requesterStrictAppOrders =
          await iexecReadOnly.orderbook.fetchAppOrderbook(appAddress, {
            requester: requesterAddress,
            isRequesterStrict: true,
          });
        expect(requesterStrictAppOrders.count).toBe(1);
        expect(requesterStrictAppOrders.orders.length).toBe(1);
        expect(
          requesterStrictAppOrders.orders[0].order.requesterrestrict,
        ).toEqual(requesterAddress);

        // all orders with requester, dataset, workerpool restriction and not strict (1,2,3,4,5)
        const unstrictAppOrders =
          await iexecReadOnly.orderbook.fetchAppOrderbook(appAddress, {
            dataset: datasetAddress,
            isDatasetStrict: false,
            requester: requesterAddress,
            isRequesterStrict: false,
            workerpool: workerpoolAddress,
            isWorkerpoolStrict: false,
          });
        expect(unstrictAppOrders.count).toBe(5);
        expect(unstrictAppOrders.orders.length).toBe(5);

        // all orders with requester, dataset, workerpool restriction and strict
        const strictAppOrders = await iexecReadOnly.orderbook.fetchAppOrderbook(
          appAddress,
          {
            dataset: datasetAddress,
            isDatasetStrict: true,
            requester: requesterAddress,
            isRequesterStrict: true,
            workerpool: workerpoolAddress,
            isWorkerpoolStrict: true,
          },
        );
        expect(strictAppOrders.count).toBe(0);
        expect(strictAppOrders.orders.length).toBe(0);
      });
    });

    describe('fetchDatasetOrderbook()', () => {
      test('returns orders available fo anyone', async () => {
        const { iexec } = getTestConfig(iexecTestChain)();
        const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
          readOnly: true,
        });
        const datasetAddress = getRandomAddress();
        const res =
          await iexecReadOnly.orderbook.fetchDatasetOrderbook(datasetAddress);
        expect(res.count).toBe(0);
        expect(res.orders).toStrictEqual([]);
        const datasetorder = await deployAndGetDatasetorder(iexec);
        for (let i = 0; i < 23; i += 1) {
          await iexec.order
            .signDatasetorder(datasetorder, { preflightCheck: false })
            .then((o) =>
              iexec.order.publishDatasetorder(o, { preflightCheck: false }),
            );
        }
        for (let i = 0; i < 2; i += 1) {
          await iexec.order
            .signDatasetorder(
              { ...datasetorder, apprestrict: getRandomAddress() },
              { preflightCheck: false },
            )
            .then((o) =>
              iexec.order.publishDatasetorder(o, { preflightCheck: false }),
            );
        }
        for (let i = 0; i < 3; i += 1) {
          await iexec.order
            .signDatasetorder(
              { ...datasetorder, workerpoolrestrict: getRandomAddress() },
              { preflightCheck: false },
            )
            .then((o) =>
              iexec.order.publishDatasetorder(o, { preflightCheck: false }),
            );
        }
        for (let i = 0; i < 4; i += 1) {
          await iexec.order
            .signDatasetorder(
              { ...datasetorder, requesterrestrict: getRandomAddress() },
              { preflightCheck: false },
            )
            .then((o) =>
              iexec.order.publishDatasetorder(o, { preflightCheck: false }),
            );
        }
        await deployAndGetDatasetorder(iexec).then((o) =>
          iexec.order.publishDatasetorder(o, { preflightCheck: false }),
        );

        const res1 = await iexecReadOnly.orderbook.fetchDatasetOrderbook(
          datasetorder.dataset,
        );
        expect(res1.count).toBe(23);
        expect(res1.orders.length).toBe(20);
        expect(res1.more).toBeDefined();
        const res2 = await res1.more();
        expect(res2.count).toBe(23);
        expect(res2.orders.length).toBe(3);
        expect(res2.more).toBeUndefined();
        const res3 = await iexecReadOnly.orderbook.fetchDatasetOrderbook(
          datasetorder.dataset,
          { app: 'any' },
        );
        expect(res3.count).toBe(25);
        const res4 = await iexecReadOnly.orderbook.fetchDatasetOrderbook(
          datasetorder.dataset,
          { workerpool: 'any' },
        );
        expect(res4.count).toBe(26);
        const res5 = await iexecReadOnly.orderbook.fetchDatasetOrderbook(
          datasetorder.dataset,
          { requester: 'any' },
        );
        expect(res5.count).toBe(27);
        const res6 = await iexecReadOnly.orderbook.fetchDatasetOrderbook(
          datasetorder.dataset,
          { app: 'any', workerpool: 'any', requester: 'any' },
        );
        expect(res6.count).toBe(32);
        const res7 = await iexecReadOnly.orderbook.fetchDatasetOrderbook(
          'any',
          {
            app: 'any',
            requester: 'any',
            workerpool: 'any',
          },
        );
        expect(res7.count >= 33).toBe(true);
      });

      test('strict option allow filtering only orders for specified app, workerpool or requester', async () => {
        const { iexec } = getTestConfig(iexecTestChain)();
        const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
          readOnly: true,
        });
        // 1 and 2: orders without any restrictions
        const emptyDatasetOrder = await deployAndGetDatasetorder(iexec);
        const datasetAddress = emptyDatasetOrder.dataset;

        await iexec.order
          .signDatasetorder(emptyDatasetOrder, { preflightCheck: false })
          .then((o) =>
            iexec.order.publishDatasetorder(o, { preflightCheck: false }),
          );
        await iexec.order
          .signDatasetorder(emptyDatasetOrder, { preflightCheck: false })
          .then((o) =>
            iexec.order.publishDatasetorder(o, { preflightCheck: false }),
          );

        // 3: app restricted order
        const appAddress = getRandomAddress();
        emptyDatasetOrder.apprestrict = appAddress;
        await iexec.order
          .signDatasetorder(emptyDatasetOrder, { preflightCheck: false })
          .then((o) =>
            iexec.order.publishDatasetorder(o, { preflightCheck: false }),
          );
        // reset to empty
        emptyDatasetOrder.apprestrict = NULL_ADDRESS;

        // 4: workerpool restricted order
        const workerpoolAddress = getRandomAddress();
        emptyDatasetOrder.workerpoolrestrict = workerpoolAddress;
        await iexec.order
          .signDatasetorder(emptyDatasetOrder, { preflightCheck: false })
          .then((o) =>
            iexec.order.publishDatasetorder(o, { preflightCheck: false }),
          );
        // reset to empty
        emptyDatasetOrder.workerpoolrestrict = NULL_ADDRESS;

        // 5: requester restricted order
        const requesterAddress = getRandomAddress();
        emptyDatasetOrder.requesterrestrict = requesterAddress;
        await iexec.order
          .signDatasetorder(emptyDatasetOrder, { preflightCheck: false })
          .then((o) =>
            iexec.order.publishDatasetorder(o, { preflightCheck: false }),
          );
        // reset to empty
        emptyDatasetOrder.requesterrestrict = NULL_ADDRESS;

        // all orders (1,2,3,4,5)
        const allADatasetOrders =
          await iexecReadOnly.orderbook.fetchDatasetOrderbook(datasetAddress, {
            app: 'any',
            requester: 'any',
            workerpool: 'any',
          });
        expect(allADatasetOrders.count).toBe(5);
        expect(allADatasetOrders.orders.length).toBe(5);

        // all orders without restrictions (1, 2)
        const unrestrictedDatasetOrders =
          await iexecReadOnly.orderbook.fetchDatasetOrderbook(datasetAddress);
        expect(unrestrictedDatasetOrders.count).toBe(2);
        expect(unrestrictedDatasetOrders.orders.length).toBe(2);
        expect(unrestrictedDatasetOrders.orders[0].order.apprestrict).toEqual(
          NULL_ADDRESS,
        );
        expect(
          unrestrictedDatasetOrders.orders[0].order.workerpoolrestrict,
        ).toEqual(NULL_ADDRESS);
        expect(
          unrestrictedDatasetOrders.orders[0].order.requesterrestrict,
        ).toEqual(NULL_ADDRESS);
        expect(unrestrictedDatasetOrders.orders[1].order.apprestrict).toEqual(
          NULL_ADDRESS,
        );
        expect(
          unrestrictedDatasetOrders.orders[0].order.workerpoolrestrict,
        ).toEqual(NULL_ADDRESS);
        expect(
          unrestrictedDatasetOrders.orders[0].order.requesterrestrict,
        ).toEqual(NULL_ADDRESS);

        // all orders without app restriction(1,2) and with app restriction(3)
        const appRestrictedAppOrders =
          await iexecReadOnly.orderbook.fetchDatasetOrderbook(datasetAddress, {
            app: appAddress,
          });
        expect(appRestrictedAppOrders.count).toBe(3);
        expect(appRestrictedAppOrders.orders.length).toBe(3);

        // all orders with app restriction and strict(3)
        const appStrictAppOrder =
          await iexecReadOnly.orderbook.fetchDatasetOrderbook(datasetAddress, {
            app: appAddress,
            isAppStrict: true,
          });
        expect(appStrictAppOrder.count).toBe(1);
        expect(appStrictAppOrder.orders.length).toBe(1);
        expect(appStrictAppOrder.orders[0].order.apprestrict).toEqual(
          appAddress,
        );

        // all orders without workerpool restriction(1,2) and with workerpool restriction(4)
        const workerpoolRestrictedAppOrders =
          await iexecReadOnly.orderbook.fetchDatasetOrderbook(datasetAddress, {
            workerpool: workerpoolAddress,
          });
        expect(workerpoolRestrictedAppOrders.count).toBe(3);
        expect(workerpoolRestrictedAppOrders.orders.length).toBe(3);

        // all orders with workerpool restriction and strict(4)
        const workerpoolStrictAppOrder =
          await iexecReadOnly.orderbook.fetchDatasetOrderbook(datasetAddress, {
            workerpool: workerpoolAddress,
            isWorkerpoolStrict: true,
          });
        expect(workerpoolStrictAppOrder.count).toBe(1);
        expect(workerpoolStrictAppOrder.orders.length).toBe(1);
        expect(
          workerpoolStrictAppOrder.orders[0].order.workerpoolrestrict,
        ).toEqual(workerpoolAddress);

        // all orders without requester restriction(1,2) and with requester restriction(5)
        const requesterRestrictedAppOrders =
          await iexecReadOnly.orderbook.fetchDatasetOrderbook(datasetAddress, {
            requester: requesterAddress,
          });
        expect(requesterRestrictedAppOrders.count).toBe(3);
        expect(requesterRestrictedAppOrders.orders.length).toBe(3);

        // all orders with requester restriction and strict(5)
        const requesterStrictAppOrders =
          await iexecReadOnly.orderbook.fetchDatasetOrderbook(datasetAddress, {
            requester: requesterAddress,
            isRequesterStrict: true,
          });
        expect(requesterStrictAppOrders.count).toBe(1);
        expect(requesterStrictAppOrders.orders.length).toBe(1);
        expect(
          requesterStrictAppOrders.orders[0].order.requesterrestrict,
        ).toEqual(requesterAddress);

        // all orders with app, requester, workerpool restriction and not strict (1,2,3,4,5)
        const unstrictAppOrders =
          await iexecReadOnly.orderbook.fetchDatasetOrderbook(datasetAddress, {
            app: appAddress,
            isAppStrict: false,
            requester: requesterAddress,
            isRequesterStrict: false,
            workerpool: workerpoolAddress,
            isWorkerpoolStrict: false,
          });
        expect(unstrictAppOrders.count).toBe(5);
        expect(unstrictAppOrders.orders.length).toBe(5);

        // all orders with app, requester, workerpool restriction and strict
        const strictAppOrders =
          await iexecReadOnly.orderbook.fetchDatasetOrderbook(datasetAddress, {
            app: appAddress,
            isAppStrict: true,
            requester: requesterAddress,
            isRequesterStrict: true,
            workerpool: workerpoolAddress,
            isWorkerpoolStrict: true,
          });
        expect(strictAppOrders.count).toBe(0);
        expect(strictAppOrders.orders.length).toBe(0);
      });
    });

    describe('fetchWorkerpoolOrderbook()', () => {
      test('returns orders available fo anyone', async () => {
        const { iexec } = getTestConfig(iexecTestChain)();
        const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
          readOnly: true,
        });
        const workerpoolorder = await deployAndGetWorkerpoolorder(iexec);
        const res = await iexecReadOnly.orderbook.fetchWorkerpoolOrderbook({
          workerpool: workerpoolorder.workerpool,
          category: 2,
        });
        expect(res.count).toBe(0);
        expect(res.orders).toStrictEqual([]);
        for (let i = 0; i < 24; i += 1) {
          await iexec.order
            .signWorkerpoolorder(workerpoolorder)
            .then((o) => iexec.order.publishWorkerpoolorder(o));
        }
        for (let i = 0; i < 2; i += 1) {
          await iexec.order
            .signWorkerpoolorder({
              ...workerpoolorder,
              apprestrict: getRandomAddress(),
            })
            .then((o) => iexec.order.publishWorkerpoolorder(o));
        }
        for (let i = 0; i < 3; i += 1) {
          await iexec.order
            .signWorkerpoolorder({
              ...workerpoolorder,
              datasetrestrict: getRandomAddress(),
            })
            .then((o) => iexec.order.publishWorkerpoolorder(o));
        }
        for (let i = 0; i < 4; i += 1) {
          await iexec.order
            .signWorkerpoolorder({
              ...workerpoolorder,
              requesterrestrict: getRandomAddress(),
            })
            .then((o) => iexec.order.publishWorkerpoolorder(o));
        }
        const res1 = await iexecReadOnly.orderbook.fetchWorkerpoolOrderbook({
          workerpool: workerpoolorder.workerpool,
        });
        expect(res1.count).toBe(24);
        expect(res1.orders.length).toBe(20);
        expect(res1.more).toBeDefined();
        const res2 = await res1.more();
        expect(res2.count).toBe(24);
        expect(res2.orders.length).toBe(4);
        expect(res2.more).toBeUndefined();
        const res3 = await iexecReadOnly.orderbook.fetchWorkerpoolOrderbook({
          workerpool: workerpoolorder.workerpool,
          app: 'any',
        });
        expect(res3.count).toBe(26);
        const res4 = await iexecReadOnly.orderbook.fetchWorkerpoolOrderbook({
          workerpool: workerpoolorder.workerpool,
          dataset: 'any',
        });
        expect(res4.count).toBe(27);
        const res5 = await iexecReadOnly.orderbook.fetchWorkerpoolOrderbook({
          workerpool: workerpoolorder.workerpool,
          requester: 'any',
        });
        expect(res5.count).toBe(28);
        const res6 = await iexecReadOnly.orderbook.fetchWorkerpoolOrderbook({
          workerpool: workerpoolorder.workerpool,
          app: 'any',
          dataset: 'any',
          requester: 'any',
        });
        expect(res6.count).toBe(33);
        const res7 = await iexecReadOnly.orderbook.fetchWorkerpoolOrderbook({
          app: 'any',
          dataset: 'any',
          requester: 'any',
        });
        const res8 = await iexecReadOnly.orderbook.fetchWorkerpoolOrderbook({
          workerpool: 'any',
          app: 'any',
          dataset: 'any',
          requester: 'any',
        });
        expect(res7.count).toBe(res8.count);
      });

      test('strict option allow filtering only orders for specified app, dataset or requester', async () => {
        const { iexec } = getTestConfig(iexecTestChain)();
        const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
          readOnly: true,
        });
        // 1 and 2: orders without any restrictions
        const emptyWorkerpoolOrder = await deployAndGetWorkerpoolorder(iexec);
        const workerpoolAddress = emptyWorkerpoolOrder.workerpool;
        await iexec.order
          .signWorkerpoolorder(emptyWorkerpoolOrder)
          .then((o) => iexec.order.publishWorkerpoolorder(o));
        await iexec.order
          .signWorkerpoolorder(emptyWorkerpoolOrder)
          .then((o) => iexec.order.publishWorkerpoolorder(o));

        // 3: app restricted order
        const appAddress = getRandomAddress();
        emptyWorkerpoolOrder.apprestrict = appAddress;
        await iexec.order
          .signWorkerpoolorder(emptyWorkerpoolOrder)
          .then((o) => iexec.order.publishWorkerpoolorder(o));
        // reset to empty
        emptyWorkerpoolOrder.apprestrict = NULL_ADDRESS;

        // 4: dataset restricted order
        const datasetAddress = getRandomAddress();
        emptyWorkerpoolOrder.datasetrestrict = datasetAddress;
        await iexec.order
          .signWorkerpoolorder(emptyWorkerpoolOrder)
          .then((o) => iexec.order.publishWorkerpoolorder(o));
        // reset to empty
        emptyWorkerpoolOrder.datasetrestrict = NULL_ADDRESS;

        // 5: requester restricted order
        const requesterAddress = getRandomAddress();
        emptyWorkerpoolOrder.requesterrestrict = requesterAddress;
        await iexec.order
          .signWorkerpoolorder(emptyWorkerpoolOrder)
          .then((o) => iexec.order.publishWorkerpoolorder(o));
        // reset to empty
        emptyWorkerpoolOrder.requesterrestrict = NULL_ADDRESS;

        // all orders (1,2,3,4,5)
        const allWorkerpoolOrders =
          await iexecReadOnly.orderbook.fetchWorkerpoolOrderbook({
            workerpool: workerpoolAddress,
            app: 'any',
            requester: 'any',
            dataset: 'any',
          });

        expect(allWorkerpoolOrders.count).toBe(5);
        expect(allWorkerpoolOrders.orders.length).toBe(5);

        // all orders without restrictions (1, 2)
        const unrestrictedWorkerpoolOrders =
          await iexecReadOnly.orderbook.fetchWorkerpoolOrderbook({
            workerpool: workerpoolAddress,
          });
        expect(unrestrictedWorkerpoolOrders.count).toBe(2);
        expect(unrestrictedWorkerpoolOrders.orders.length).toBe(2);
        expect(
          unrestrictedWorkerpoolOrders.orders[0].order.apprestrict,
        ).toEqual(NULL_ADDRESS);
        expect(
          unrestrictedWorkerpoolOrders.orders[0].order.datasetrestrict,
        ).toEqual(NULL_ADDRESS);
        expect(
          unrestrictedWorkerpoolOrders.orders[0].order.requesterrestrict,
        ).toEqual(NULL_ADDRESS);
        expect(
          unrestrictedWorkerpoolOrders.orders[1].order.apprestrict,
        ).toEqual(NULL_ADDRESS);
        expect(
          unrestrictedWorkerpoolOrders.orders[0].order.datasetrestrict,
        ).toEqual(NULL_ADDRESS);
        expect(
          unrestrictedWorkerpoolOrders.orders[0].order.requesterrestrict,
        ).toEqual(NULL_ADDRESS);

        // all orders without app restriction(1,2) and with app restriction(3)
        const appRestrictedAppOrders =
          await iexecReadOnly.orderbook.fetchWorkerpoolOrderbook({
            workerpool: workerpoolAddress,
            app: appAddress,
          });
        expect(appRestrictedAppOrders.count).toBe(3);
        expect(appRestrictedAppOrders.orders.length).toBe(3);

        // all orders with app restriction and strict(3)
        const appStrictAppOrder =
          await iexecReadOnly.orderbook.fetchWorkerpoolOrderbook({
            workerpool: workerpoolAddress,
            app: appAddress,
            isAppStrict: true,
          });
        expect(appStrictAppOrder.count).toBe(1);
        expect(appStrictAppOrder.orders.length).toBe(1);
        expect(appStrictAppOrder.orders[0].order.apprestrict).toEqual(
          appAddress,
        );

        // all orders without dataset restriction(1,2) and with dataset restriction(4)
        const datasetRestrictedWorkerpoolOrders =
          await iexecReadOnly.orderbook.fetchWorkerpoolOrderbook({
            workerpool: workerpoolAddress,
            dataset: datasetAddress,
          });
        expect(datasetRestrictedWorkerpoolOrders.count).toBe(3);
        expect(datasetRestrictedWorkerpoolOrders.orders.length).toBe(3);

        // all orders with dataset restriction and strict(4)
        const datasetStrictAppOrder =
          await iexecReadOnly.orderbook.fetchWorkerpoolOrderbook({
            workerpool: workerpoolAddress,
            dataset: datasetAddress,
            isDatasetStrict: true,
          });
        expect(datasetStrictAppOrder.count).toBe(1);
        expect(datasetStrictAppOrder.orders.length).toBe(1);
        expect(datasetStrictAppOrder.orders[0].order.datasetrestrict).toEqual(
          datasetAddress,
        );

        // all orders without requester restriction(1,2) and with requester restriction(5)
        const requesterRestrictedAppOrders =
          await iexecReadOnly.orderbook.fetchWorkerpoolOrderbook({
            workerpool: workerpoolAddress,
            requester: requesterAddress,
          });
        expect(requesterRestrictedAppOrders.count).toBe(3);
        expect(requesterRestrictedAppOrders.orders.length).toBe(3);

        // all orders with requester restriction and strict(5)
        const requesterStrictAppOrders =
          await iexecReadOnly.orderbook.fetchWorkerpoolOrderbook({
            workerpool: workerpoolAddress,
            requester: requesterAddress,
            isRequesterStrict: true,
          });
        expect(requesterStrictAppOrders.count).toBe(1);
        expect(requesterStrictAppOrders.orders.length).toBe(1);
        expect(
          requesterStrictAppOrders.orders[0].order.requesterrestrict,
        ).toEqual(requesterAddress);

        // all orders with requester, dataset, workerpool restriction and not strict (1,2,3,4,5)
        const unstrictAppOrders =
          await iexecReadOnly.orderbook.fetchWorkerpoolOrderbook({
            workerpool: workerpoolAddress,
            app: appAddress,
            isAppStrict: false,
            requester: requesterAddress,
            isRequesterStrict: false,
            dataset: datasetAddress,
            isDatasetStrict: false,
          });
        expect(unstrictAppOrders.count).toBe(5);
        expect(unstrictAppOrders.orders.length).toBe(5);

        // all orders with requester, dataset, workerpool restriction and strict
        const strictAppOrders =
          await iexecReadOnly.orderbook.fetchWorkerpoolOrderbook({
            workerpool: workerpoolAddress,
            app: appAddress,
            isAppStrict: true,
            requester: requesterAddress,
            isRequesterStrict: true,
            dataset: datasetAddress,
            isDatasetStrict: true,
          });
        expect(strictAppOrders.count).toBe(0);
        expect(strictAppOrders.orders.length).toBe(0);
      });
    });

    describe('fetchRequestOrderbook()', () => {
      test('returns orders available fo anyone', async () => {
        const { iexec, wallet } = getTestConfig(iexecTestChain)();
        const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
          readOnly: true,
        });
        const apporder = await deployAndGetApporder(iexec);
        const workerpoolorder = await deployAndGetWorkerpoolorder(iexec, {
          category: 2,
        });
        const requestorder = await getMatchableRequestorder(iexec, {
          apporder,
          workerpoolorder,
        });
        await iexec.order.publishApporder(apporder);
        await iexec.order.publishWorkerpoolorder(workerpoolorder);
        for (let i = 0; i < 25; i += 1) {
          await iexec.order
            .signRequestorder(
              { ...requestorder, workerpool: NULL_ADDRESS },
              { preflightCheck: false },
            )
            .then((o) =>
              iexec.order.publishRequestorder(o, {
                preflightCheck: false,
              }),
            );
        }
        for (let i = 0; i < 2; i += 1) {
          await iexec.order
            .signRequestorder(
              { ...requestorder, workerpool: getRandomAddress() },
              { preflightCheck: false },
            )
            .then((o) =>
              iexec.order.publishRequestorder(o, {
                preflightCheck: false,
              }),
            );
        }
        const res1 = await iexecReadOnly.orderbook.fetchRequestOrderbook({
          requester: wallet.address,
          category: 2,
        });
        expect(res1.count).toBe(25);
        expect(res1.orders.length).toBe(20);
        expect(res1.more).toBeDefined();
        const res2 = await res1.more();
        expect(res2.count).toBe(25);
        expect(res2.orders.length >= 5).toBe(true);
        if (res2.orders.length < 20) {
          expect(res2.more).toBeUndefined();
        }
        const res3 = await iexecReadOnly.orderbook.fetchRequestOrderbook({
          requester: wallet.address,
          category: 2,
          workerpool: 'any',
        });
        expect(res3.count).toBe(27);
        const res4 = await iexecReadOnly.orderbook.fetchRequestOrderbook({
          workerpool: 'any',
        });
        const res5 = await iexecReadOnly.orderbook.fetchRequestOrderbook({
          requester: 'any',
          workerpool: 'any',
        });
        expect(res4.count).toBe(res5.count);
      });

      test('strict option allow filtering only orders for specified workerpool', async () => {
        const { iexec, wallet } = getTestConfig(iexecTestChain)();
        const { iexec: iexecReadOnly } = getTestConfig(iexecTestChain)({
          readOnly: true,
        });
        const requesterAddress = wallet.address;

        const apporder = await deployAndGetApporder(iexec);
        const appAddress = apporder.app;
        await iexec.order
          .signApporder(apporder)
          .then((o) => iexec.order.publishApporder(o));

        const datasetorder = await deployAndGetDatasetorder(iexec);
        const datasetAddress = datasetorder.dataset;
        await iexec.order
          .signDatasetorder(datasetorder)
          .then((o) =>
            iexec.order.publishDatasetorder(o, { preflightCheck: false }),
          );

        const workerpoolorder = await deployAndGetWorkerpoolorder(iexec);
        const workerpoolAddress = workerpoolorder.workerpool;
        await iexec.order
          .signWorkerpoolorder(workerpoolorder)
          .then((o) =>
            iexec.order.publishWorkerpoolorder(o, { preflightCheck: false }),
          );

        // first: request order for app without restrictions
        await iexec.order
          .createRequestorder({
            requester: requesterAddress,
            app: appAddress,
            appmaxprice: apporder.appprice,
            dataset: NULL_ADDRESS,
            datasetmaxprice: 0,
            workerpool: NULL_ADDRESS,
            workerpoolmaxprice: 0,
            category: 1,
            trust: 0,
            volume: 1,
          })
          .then((o) =>
            iexec.order.signRequestorder(o, { preflightCheck: false }),
          )
          .then((o) =>
            iexec.order.publishRequestorder(o, { preflightCheck: false }),
          );

        // second: request order for app with workerpool and dataset restrictions
        await iexec.order
          .createRequestorder({
            requester: requesterAddress,
            app: appAddress,
            appmaxprice: apporder.appprice,
            dataset: datasetAddress,
            datasetmaxprice: 0,
            workerpool: workerpoolAddress,
            workerpoolmaxprice: 0,
            category: 1,
            trust: 0,
            volume: 1,
          })
          .then((o) =>
            iexec.order.signRequestorder(o, { preflightCheck: false }),
          )
          .then((o) =>
            iexec.order.publishRequestorder(o, { preflightCheck: false }),
          );

        // request orders restricted by app - always strict (1,2)
        const appRestrictedRequestOrders =
          await iexecReadOnly.orderbook.fetchRequestOrderbook({
            requester: requesterAddress,
            workerpool: 'any',
            app: appAddress,
          });
        expect(appRestrictedRequestOrders.count).toBe(2);
        expect(appRestrictedRequestOrders.orders.length).toBe(2);

        // request orders restricted by dataset - always strict (2)
        const datasetRestrictedRequestOrders =
          await iexecReadOnly.orderbook.fetchRequestOrderbook({
            requester: requesterAddress,
            dataset: datasetAddress,
            workerpool: 'any',
          });
        expect(datasetRestrictedRequestOrders.count).toBe(1);
        expect(datasetRestrictedRequestOrders.orders.length).toBe(1);

        // request orders restricted by workerpool (2)
        const workerpoolRestrictedRequestOrders =
          await iexecReadOnly.orderbook.fetchRequestOrderbook({
            requester: requesterAddress,
            workerpool: workerpoolAddress,
            app: appAddress,
          });
        expect(workerpoolRestrictedRequestOrders.count).toBe(2);
        expect(workerpoolRestrictedRequestOrders.orders.length).toBe(2);

        // request orders restricted by workerpool and strict (1)
        const workerpoolSrictRequestOrders =
          await iexecReadOnly.orderbook.fetchRequestOrderbook({
            requester: requesterAddress,
            workerpool: workerpoolAddress,
            isWorkerpoolStrict: true,
            app: appAddress,
          });
        expect(workerpoolSrictRequestOrders.count).toBe(1);
        expect(workerpoolSrictRequestOrders.orders.length).toBe(1);
        expect(workerpoolSrictRequestOrders.orders[0].order.workerpool).toEqual(
          workerpoolAddress,
        );
      });
    });
  });
});
