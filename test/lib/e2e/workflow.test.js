// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, test } from '@jest/globals';
import { BN } from 'bn.js';
import { getTestConfig } from '../lib-test-utils';
import {
  TEST_CHAINS,
  getId,
  initializeTask,
  setNRlcBalance,
} from '../../test-utils';
import '../../jest-setup';
import { errors } from '../../../src/lib';

const iexecTestChain = TEST_CHAINS['bellecour-fork'];

describe('[workflow]', () => {
  let noDurationCatId;
  let apporder;
  let datasetorder;
  let workerpoolorder;
  let workerpoolorderToClaim;

  test('create category', async () => {
    const { iexec } = getTestConfig(iexecTestChain)({
      privateKey: iexecTestChain.pocoAdminWallet.privateKey,
    });
    const res = await iexec.hub.createCategory({
      name: 'custom',
      description: 'desc',
      workClockTimeRef: '0',
    });
    noDurationCatId = res.catid.toString();
    expect(res).toBeDefined();
    expect(res.catid).toBeDefined();
    expect(res.txHash).toBeDefined();
  });

  test('deploy and sell app', async () => {
    const { iexec } = getTestConfig(iexecTestChain)();
    const owner = await iexec.wallet.getAddress();
    const appName = `My app${getId()}`;
    const appDeployRes = await iexec.app.deployApp({
      owner,
      name: appName,
      type: 'DOCKER',
      multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
      checksum:
        '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
    });
    expect(appDeployRes.address).toBeDefined();
    expect(appDeployRes.txHash).toBeDefined();

    const appShowRes = await iexec.app.showApp(appDeployRes.address);
    expect(appShowRes.objAddress).toBe(appDeployRes.address);
    expect(appShowRes.app.owner).toBe(owner);
    expect(appShowRes.app.appName).toBe(appName);
    expect(appShowRes.app.appType).toBe('DOCKER');
    expect(appShowRes.app.appMultiaddr).toBe(
      'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
    );
    expect(appShowRes.app.appChecksum).toBe(
      '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
    );
    expect(appShowRes.app.appMREnclave).toBe('');

    const order = await iexec.order.createApporder({
      app: appDeployRes.address,
      appprice: '1000000000',
      volume: '1000',
    });
    const signedorder = await iexec.order.signApporder(order, {
      preflightCheck: false,
    });
    apporder = signedorder;
    expect(signedorder.sign).toBeDefined();
  });

  test('deploy and sell dataset', async () => {
    const { iexec } = getTestConfig(iexecTestChain)();
    const owner = await iexec.wallet.getAddress();
    const datasetName = `My dataset${getId()}`;
    const datasetDeployRes = await iexec.dataset.deployDataset({
      owner,
      name: datasetName,
      multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
      checksum:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
    });
    expect(datasetDeployRes.address).toBeDefined();
    expect(datasetDeployRes.txHash).toBeDefined();

    const datasetShowRes = await iexec.dataset.showDataset(
      datasetDeployRes.address,
    );
    expect(datasetShowRes.objAddress).toBe(datasetDeployRes.address);
    expect(datasetShowRes.dataset.owner).toBe(owner);
    expect(datasetShowRes.dataset.datasetName).toBe(datasetName);
    expect(datasetShowRes.dataset.datasetMultiaddr).toBe(
      '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
    );
    expect(datasetShowRes.dataset.datasetChecksum).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );

    const order = await iexec.order.createDatasetorder({
      dataset: datasetDeployRes.address,
      datasetprice: '1000000000',
      volume: '1000',
    });
    const signedorder = await iexec.order.signDatasetorder(order, {
      preflightCheck: false,
    });
    datasetorder = signedorder;
    expect(signedorder.sign).toBeDefined();
  });

  test('deploy and sell computing power', async () => {
    const { iexec, wallet } = getTestConfig(iexecTestChain)();
    const workerpoolPrice = '1000000000';
    await setNRlcBalance(iexecTestChain)(wallet.address, workerpoolPrice);
    const owner = await iexec.wallet.getAddress();
    const desc = `workerpool${getId()}`;
    const workerpoolDeployRes = await iexec.workerpool.deployWorkerpool({
      owner,
      description: desc,
    });
    expect(workerpoolDeployRes.address).toBeDefined();
    expect(workerpoolDeployRes.txHash).toBeDefined();

    const workerpoolShowRes = await iexec.workerpool.showWorkerpool(
      workerpoolDeployRes.address,
    );
    expect(workerpoolShowRes.objAddress).toBe(workerpoolDeployRes.address);
    expect(workerpoolShowRes.workerpool.owner).toBe(owner);
    expect(workerpoolShowRes.workerpool.workerpoolDescription).toBe(desc);
    expect(workerpoolShowRes.workerpool.schedulerRewardRatioPolicy).not.toBe(
      undefined,
    );
    expect(workerpoolShowRes.workerpool.workerStakeRatioPolicy).not.toBe(
      undefined,
    );

    const order = await iexec.order.createWorkerpoolorder({
      workerpool: workerpoolDeployRes.address,
      workerpoolprice: workerpoolPrice,
      category: '2',
      volume: '1000',
    });
    await iexec.account.deposit(order.workerpoolprice);
    const signedorder = await iexec.order.signWorkerpoolorder(order);
    workerpoolorder = signedorder;
    expect(signedorder.sign).toBeDefined();
    // generate no duration order
    const orderToClaim = await iexec.order.createWorkerpoolorder({
      workerpool: workerpoolDeployRes.address,
      workerpoolprice: '0',
      category: noDurationCatId,
      volume: '1000',
    });
    workerpoolorderToClaim =
      await iexec.order.signWorkerpoolorder(orderToClaim);
    expect(workerpoolorderToClaim.sign).toBeDefined();
  });

  test('buy computation', async () => {
    const { iexec, wallet } = getTestConfig(iexecTestChain)();
    const order = await iexec.order.createRequestorder({
      app: apporder.app,
      appmaxprice: apporder.appprice,
      dataset: datasetorder.dataset,
      datasetmaxprice: datasetorder.datasetprice,
      workerpoolmaxprice: workerpoolorder.workerpoolprice,
      requester: await iexec.wallet.getAddress(),
      category: workerpoolorder.category,
      volume: '1',
      params: {
        iexec_args: 'test',
      },
    });
    const signedorder = await iexec.order.signRequestorder(
      {
        ...order,
        params: {
          iexec_args: 'test',
        },
      },
      { preflightCheck: false },
    );
    const totalPrice = new BN(order.appmaxprice)
      .add(new BN(order.datasetmaxprice))
      .add(new BN(order.workerpoolmaxprice));
    await setNRlcBalance(iexecTestChain)(wallet.address, totalPrice);
    await iexec.account.deposit(totalPrice);
    expect(signedorder.sign).toBeDefined();

    const matchOrdersRes = await iexec.order.matchOrders(
      {
        apporder,
        datasetorder,
        workerpoolorder,
        requestorder: signedorder,
      },
      { preflightCheck: false },
    );
    expect(matchOrdersRes).toBeDefined();
    expect(matchOrdersRes.dealid).toBeDefined();
    expect(matchOrdersRes.txHash).toBeDefined();
    expect(matchOrdersRes.volume.eq(new BN(1))).toBe(true);
  });

  test('show & claim task, show & claim deal (initialized & uninitialized tasks)', async () => {
    const { iexec, wallet } = getTestConfig(iexecTestChain)();
    const order = await iexec.order.createRequestorder({
      app: apporder.app,
      appmaxprice: apporder.appprice,
      dataset: datasetorder.dataset,
      datasetmaxprice: datasetorder.datasetprice,
      workerpoolmaxprice: workerpoolorderToClaim.workerpoolprice,
      requester: await iexec.wallet.getAddress(),
      category: workerpoolorderToClaim.category,
      volume: '10',
    });
    const signedorder = await iexec.order.signRequestorder(order, {
      preflightCheck: false,
    });
    const totalPrice = new BN(order.appmaxprice)
      .add(new BN(order.datasetmaxprice))
      .add(new BN(order.workerpoolmaxprice))
      .mul(new BN(order.volume));
    await setNRlcBalance(iexecTestChain)(wallet.address, totalPrice);
    await iexec.account.deposit(totalPrice);
    expect(signedorder.sign).toBeDefined();
    const matchOrdersRes = await iexec.order.matchOrders(
      {
        apporder,
        datasetorder,
        workerpoolorder: workerpoolorderToClaim,
        requestorder: signedorder,
      },
      { preflightCheck: false },
    );
    expect(matchOrdersRes).toBeDefined();
    expect(matchOrdersRes.dealid).toBeDefined();
    expect(matchOrdersRes.txHash).toBeDefined();
    expect(matchOrdersRes.volume.eq(new BN(10))).toBe(true);

    const showDealRes = await iexec.deal.show(matchOrdersRes.dealid);
    expect(showDealRes).toBeDefined();
    expect(showDealRes.app).toBeDefined();
    expect(showDealRes.app.pointer).toBe(apporder.app);
    expect(showDealRes.app.owner).toBeDefined();
    expect(showDealRes.app.price.eq(new BN(apporder.appprice))).toBe(true);
    expect(showDealRes.dataset).toBeDefined();
    expect(showDealRes.dataset.pointer).toBe(datasetorder.dataset);
    expect(showDealRes.dataset.owner).toBeDefined();
    expect(
      showDealRes.dataset.price.eq(new BN(datasetorder.datasetprice)),
    ).toBe(true);
    expect(showDealRes.workerpool).toBeDefined();
    expect(showDealRes.workerpool.pointer).toBe(
      workerpoolorderToClaim.workerpool,
    );
    expect(showDealRes.workerpool.owner).toBeDefined();
    expect(
      showDealRes.workerpool.price.eq(
        new BN(workerpoolorderToClaim.workerpoolprice),
      ),
    ).toBe(true);
    expect(showDealRes.trust.eq(new BN(1))).toBe(true);
    expect(showDealRes.category.eq(new BN(signedorder.category))).toBe(true);
    expect(showDealRes.tag).toBe(signedorder.tag);
    expect(showDealRes.params).toBe(signedorder.params);
    expect(showDealRes.startTime instanceof BN).toBe(true);
    expect(showDealRes.finalTime instanceof BN).toBe(true);
    expect(showDealRes.finalTime.gte(showDealRes.startTime)).toBe(true);
    expect(showDealRes.deadlineReached).toBe(true);
    expect(showDealRes.botFirst.eq(new BN(0))).toBe(true);
    expect(showDealRes.botSize.eq(new BN(10))).toBe(true);
    expect(showDealRes.workerStake.eq(new BN(0))).toBe(true);
    expect(showDealRes.schedulerRewardRatio.eq(new BN(1))).toBe(true);
    expect(showDealRes.requester).toBe(signedorder.requester);
    expect(showDealRes.beneficiary).toBe(signedorder.beneficiary);
    expect(showDealRes.callback).toBe(signedorder.callback);
    expect(typeof showDealRes.tasks).toBe('object');
    expect(showDealRes.tasks[0]).toBeDefined();
    expect(showDealRes.tasks[9]).toBeDefined();
    expect(showDealRes.tasks[10]).toBeUndefined();

    const showTaskUnsetRes = await iexec.task
      .show(showDealRes.tasks[0])
      .catch((e) => e);
    expect(showTaskUnsetRes instanceof errors.ObjectNotFoundError).toBe(true);
    expect(showTaskUnsetRes.message).toBe(
      `No task found for id ${showDealRes.tasks[0]} on chain ${iexecTestChain.chainId}`,
    );

    const taskIdxToInit = 1;
    await initializeTask(iexecTestChain)(matchOrdersRes.dealid, taskIdxToInit);
    const showTaskActiveRes = await iexec.task.show(
      showDealRes.tasks[taskIdxToInit],
    );
    expect(showTaskActiveRes.status).toBe(1);
    expect(showTaskActiveRes.dealid).toBe(matchOrdersRes.dealid);
    expect(showTaskActiveRes.idx.eq(new BN(taskIdxToInit))).toBe(true);
    expect(showTaskActiveRes.timeref.eq(new BN(0))).toBe(true);
    expect(
      showTaskActiveRes.contributionDeadline.eq(showDealRes.finalTime),
    ).toBe(true);
    expect(showTaskActiveRes.finalDeadline.eq(showDealRes.finalTime)).toBe(
      true,
    );
    expect(showTaskActiveRes.revealCounter.eq(new BN(0))).toBe(true);
    expect(showTaskActiveRes.winnerCounter.eq(new BN(0))).toBe(true);
    expect(showTaskActiveRes.contributors).toStrictEqual([]);
    expect(showTaskActiveRes.consensusValue).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
    expect(showTaskActiveRes.resultDigest).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
    expect(showTaskActiveRes.results).toStrictEqual({ storage: 'none' });
    expect(showTaskActiveRes.idx.eq(new BN(taskIdxToInit))).toBe(true);
    expect(showTaskActiveRes.statusName).toBe('TIMEOUT');
    expect(showTaskActiveRes.taskTimedOut).toBe(true);

    const taskIdxToClaim = 2;
    await initializeTask(iexecTestChain)(matchOrdersRes.dealid, taskIdxToClaim);
    const claimTaskRes = await iexec.task.claim(
      showDealRes.tasks[taskIdxToClaim],
    );
    expect(claimTaskRes).toBeDefined();

    const claimDealRes = await iexec.deal.claim(matchOrdersRes.dealid);
    expect(claimDealRes).toBeDefined();
    expect(claimDealRes.transactions).toBeDefined();
    expect(claimDealRes.transactions.length).toBe(2);
    expect(claimDealRes.transactions[0]).toBeDefined();
    expect(claimDealRes.transactions[0].type).toBe('claimArray');
    expect(claimDealRes.transactions[1]).toBeDefined();
    expect(claimDealRes.transactions[1].type).toBe('initializeAndClaimArray');
    expect(claimDealRes.claimed).toBeDefined();
    expect(Object.keys(claimDealRes.claimed).length).toBe(9);
    expect(claimDealRes.claimed[0]).toBeDefined();
  });
});
