const ethers = require('ethers');
const BN = require('bn.js');
const { utils, IExec, errors } = require('../src/iexec-lib');
const { sleep } = require('../src/utils');

console.log('Node version:', process.version);

// CONFIG
const { DRONE } = process.env;
// 1 block / tx
const ethereumHost = DRONE ? 'ethereum' : 'localhost';
const ethereumURL = `http://${ethereumHost}:8545`;
// blocktime 1s for concurrent tx test
const ethereumHost1s = DRONE ? 'ethereum1s' : 'localhost';
const ethereumURL1s = `http://${ethereumHost1s}:8545`;

const chainGasPrice = '20000000000';
const nativeChainGasPrice = '0';
let hubAddress;
let nativeHubAddress;
let networkId;

const PRIVATE_KEY = '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407';
const PUBLIC_KEY = '0x0463b6265f021cc1f249366d5ade5bcdf7d33debe594e9d94affdf1aa02255928490fc2c96990a386499b66d17565de1c12ba8fb4ae3af7539e6c61aa7f0113edd';
const ADDRESS = '0x7bd4783FDCAD405A28052a0d1f11236A741da593';
const ADDRESS2 = '0x650ae1d365369129c326Cd15Bf91793b52B7cf59';

// UTILS

const ethRPC = new ethers.providers.JsonRpcProvider(ethereumURL);
const ethRPC1s = new ethers.providers.JsonRpcProvider(ethereumURL1s);

const walletWithProvider = new ethers.Wallet(PRIVATE_KEY, ethRPC);

const initializeTask = async (hub, dealid, idx) => {
  const hubContract = new ethers.Contract(
    hub,
    [
      {
        constant: false,
        inputs: [
          {
            name: '_dealid',
            type: 'bytes32',
          },
          {
            name: 'idx',
            type: 'uint256',
          },
        ],
        name: 'initialize',
        outputs: [
          {
            name: '',
            type: 'bytes32',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ],
    walletWithProvider,
  );
  const initTx = await hubContract.initialize(dealid, idx);
  await initTx.wait();
};

const deployAndGetApporder = async (
  iexec,
  {
    appprice = 0,
    volume = 1,
    datasetrestrict,
    workerpoolrestrict,
    requesterrestrict,
    tag,
  } = {},
) => {
  const address = await iexec.wallet.getAddress();
  const appDeployRes = await iexec.app.deployApp({
    owner: address,
    name: 'My app',
    type: 'DOCKER',
    multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
    checksum:
      '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
    mrenclave: 'abc|123|test',
  });
  const app = appDeployRes.address;
  const apporder = await iexec.order
    .createApporder({
      app,
      appprice,
      volume,
      tag,
      datasetrestrict,
      workerpoolrestrict,
      requesterrestrict,
    })
    .then(iexec.order.signApporder);
  return apporder;
};

const deployAndGetDatasetorder = async (
  iexec,
  {
    datasetprice = 0,
    volume = 1,
    apprestrict,
    workerpoolrestrict,
    requesterrestrict,
    tag,
  } = {},
) => {
  const address = await iexec.wallet.getAddress();
  const datasetDeployRes = await iexec.dataset.deployDataset({
    owner: address,
    name: 'My dataset',
    multiaddr: '/ipfs/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
    checksum:
      '0x0000000000000000000000000000000000000000000000000000000000000000',
  });
  const dataset = datasetDeployRes.address;
  const datasetorder = await iexec.order
    .createDatasetorder({
      dataset,
      datasetprice,
      volume,
      tag,
      apprestrict,
      workerpoolrestrict,
      requesterrestrict,
    })
    .then(iexec.order.signDatasetorder);
  return datasetorder;
};

const deployAndGetWorkerpoolorder = async (
  iexec,
  {
    category = 0,
    workerpoolprice = 0,
    volume = 1,
    trust,
    apprestrict,
    datasetrestrict,
    requesterrestrict,
    tag,
  } = {},
) => {
  const address = await iexec.wallet.getAddress();
  const workerpoolDeployRes = await iexec.workerpool.deployWorkerpool({
    owner: address,
    description: 'My workerpool',
  });
  const workerpool = workerpoolDeployRes.address;
  const workerpoolorder = await iexec.order
    .createWorkerpoolorder({
      workerpool,
      workerpoolprice,
      volume,
      category,
      trust,
      tag,
      apprestrict,
      datasetrestrict,
      requesterrestrict,
    })
    .then(iexec.order.signWorkerpoolorder);
  return workerpoolorder;
};

const getMatchableRequestorder = async (
  iexec,
  { apporder, datasetorder, workerpoolorder } = {},
) => {
  const address = await iexec.wallet.getAddress();
  const requestorder = await iexec.order
    .createRequestorder({
      requester: address,
      app: apporder.app,
      appmaxprice: apporder.appprice,
      dataset: datasetorder ? datasetorder.dataset : utils.NULL_ADDRESS,
      datasetmaxprice: datasetorder ? datasetorder.datasetprice : 0,
      workerpool: workerpoolorder.workerpool,
      workerpoolmaxprice: workerpoolorder.workerpoolprice,
      category: workerpoolorder.category,
      trust: workerpoolorder.trust,
      volume: workerpoolorder.volume,
    })
    .then(iexec.order.signRequestorder);
  return requestorder;
};

const createCategory = async (iexec, { workClockTimeRef = 0 } = {}) => {
  const res = await iexec.hub.createCategory({
    name: 'custom',
    description: 'desc',
    workClockTimeRef,
  });
  const catid = res.catid.toString();
  return catid;
};

// TESTS
beforeAll(async () => {
  const { chainId } = await ethRPC.getNetwork();
  console.log('chainId', chainId);
  networkId = `${chainId}`;
  const block4 = await ethRPC.getBlock(4);
  hubAddress = (await ethRPC.getTransaction(block4.transactions[0])).creates;
  console.log('hubAddress', hubAddress);
  const block28 = await ethRPC.getBlock(28);
  nativeHubAddress = (await ethRPC.getTransaction(block28.transactions[0]))
    .creates;
  console.log('nativeHubAddress', nativeHubAddress);
}, 15000);

describe('[workflow]', () => {
  let noDurationCatId;
  let apporder;
  let datasetorder;
  let workerpoolorder;
  let workerpoolorderToClaim;
  test('create category', async () => {
    const signer = utils.getSignerFromPrivateKey(ethereumURL, PRIVATE_KEY);
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    const res = await iexec.hub.createCategory({
      name: 'custom',
      description: 'desc',
      workClockTimeRef: '0',
    });
    noDurationCatId = res.catid.toString();
    expect(res).not.toBe(undefined);
    expect(res.catid).not.toBe(undefined);
    expect(res.txHash).not.toBe(undefined);
  });
  test('deploy and sell app', async () => {
    const signer = utils.getSignerFromPrivateKey(ethereumURL, PRIVATE_KEY);
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    const owner = await iexec.wallet.getAddress();
    const appDeployRes = await iexec.app.deployApp({
      owner,
      name: 'My app',
      type: 'DOCKER',
      multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
      checksum:
        '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
      mrenclave: 'abc|123|test',
    });
    expect(appDeployRes.address).not.toBe(undefined);
    expect(appDeployRes.txHash).not.toBe(undefined);

    const appShowRes = await iexec.app.showApp(appDeployRes.address);
    expect(appShowRes.objAddress).toBe(appDeployRes.address);
    expect(appShowRes.app.owner).toBe(owner);
    expect(appShowRes.app.appName).toBe('My app');
    expect(appShowRes.app.appType).toBe('DOCKER');
    expect(appShowRes.app.appMultiaddr).toBe(
      'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
    );
    expect(appShowRes.app.appChecksum).toBe(
      '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
    );
    expect(appShowRes.app.appMREnclave).toBe('abc|123|test');

    const order = await iexec.order.createApporder({
      app: appDeployRes.address,
      appprice: '1000000000',
      volume: '1000',
    });
    const signedorder = await iexec.order.signApporder(order);
    apporder = signedorder;
    expect(signedorder.sign).not.toBe(undefined);
  });
  test('deploy and sell dataset', async () => {
    const signer = utils.getSignerFromPrivateKey(ethereumURL, PRIVATE_KEY);
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    const owner = await iexec.wallet.getAddress();
    const datasetDeployRes = await iexec.dataset.deployDataset({
      owner,
      name: 'My dataset',
      multiaddr: '/ipfs/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
      checksum:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
    });
    expect(datasetDeployRes.address).not.toBe(undefined);
    expect(datasetDeployRes.txHash).not.toBe(undefined);

    const datasetShowRes = await iexec.dataset.showDataset(
      datasetDeployRes.address,
    );
    expect(datasetShowRes.objAddress).toBe(datasetDeployRes.address);
    expect(datasetShowRes.dataset.owner).toBe(owner);
    expect(datasetShowRes.dataset.datasetName).toBe('My dataset');
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
    const signedorder = await iexec.order.signDatasetorder(order);
    datasetorder = signedorder;
    expect(signedorder.sign).not.toBe(undefined);
  });
  test('deploy and sell computing power', async () => {
    const signer = utils.getSignerFromPrivateKey(ethereumURL, PRIVATE_KEY);
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    const owner = await iexec.wallet.getAddress();
    const workerpoolDeployRes = await iexec.workerpool.deployWorkerpool({
      owner,
      description: 'My workerpool',
    });
    expect(workerpoolDeployRes.address).not.toBe(undefined);
    expect(workerpoolDeployRes.txHash).not.toBe(undefined);

    const workerpoolShowRes = await iexec.workerpool.showWorkerpool(
      workerpoolDeployRes.address,
    );
    expect(workerpoolShowRes.objAddress).toBe(workerpoolDeployRes.address);
    expect(workerpoolShowRes.workerpool.owner).toBe(owner);
    expect(workerpoolShowRes.workerpool.workerpoolDescription).toBe(
      'My workerpool',
    );
    expect(workerpoolShowRes.workerpool.schedulerRewardRatioPolicy).not.toBe(
      undefined,
    );
    expect(workerpoolShowRes.workerpool.workerStakeRatioPolicy).not.toBe(
      undefined,
    );

    const order = await iexec.order.createWorkerpoolorder({
      workerpool: workerpoolDeployRes.address,
      workerpoolprice: '1000000000',
      category: '2',
      volume: '1000',
    });
    await iexec.account.deposit(order.workerpoolprice);
    const signedorder = await iexec.order.signWorkerpoolorder(order);
    workerpoolorder = signedorder;
    expect(signedorder.sign).not.toBe(undefined);
    // generate no duration order
    const orderToClaim = await iexec.order.createWorkerpoolorder({
      workerpool: workerpoolDeployRes.address,
      workerpoolprice: '0',
      category: noDurationCatId,
      volume: '1000',
    });
    workerpoolorderToClaim = await iexec.order.signWorkerpoolorder(
      orderToClaim,
    );
    expect(workerpoolorderToClaim.sign).not.toBe(undefined);
  });
  test('buy computation', async () => {
    const signer = utils.getSignerFromPrivateKey(ethereumURL, PRIVATE_KEY);
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
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
      Object.assign({}, order, {
        params: {
          iexec_args: 'test',
        },
      }),
    );
    const totalPrice = new BN(order.appmaxprice)
      .add(new BN(order.datasetmaxprice))
      .add(new BN(order.workerpoolmaxprice));
    await iexec.account.deposit(totalPrice);
    expect(signedorder.sign).not.toBe(undefined);
    const matchOrdersRes = await iexec.order.matchOrders({
      apporder,
      datasetorder,
      workerpoolorder,
      requestorder: signedorder,
    });
    expect(matchOrdersRes).not.toBe(undefined);
    expect(matchOrdersRes.dealid).not.toBe(undefined);
    expect(matchOrdersRes.txHash).not.toBe(undefined);
    expect(matchOrdersRes.volume.eq(new BN(1))).toBe(true);
  });

  test('show & claim task, show & claim deal (initialized & uninitialized tasks)', async () => {
    const signer = utils.getSignerFromPrivateKey(ethereumURL, PRIVATE_KEY);
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    const order = await iexec.order.createRequestorder({
      app: apporder.app,
      appmaxprice: apporder.appprice,
      dataset: datasetorder.dataset,
      datasetmaxprice: datasetorder.datasetprice,
      workerpoolmaxprice: workerpoolorderToClaim.workerpoolprice,
      requester: await iexec.wallet.getAddress(),
      category: workerpoolorderToClaim.category,
      volume: '10',
      params: 'test',
    });
    const signedorder = await iexec.order.signRequestorder(order);
    const totalPrice = new BN(order.appmaxprice)
      .add(new BN(order.datasetmaxprice))
      .add(new BN(order.workerpoolmaxprice))
      .mul(new BN(order.volume));
    await iexec.account.deposit(totalPrice);
    expect(signedorder.sign).not.toBe(undefined);
    const matchOrdersRes = await iexec.order.matchOrders({
      apporder,
      datasetorder,
      workerpoolorder: workerpoolorderToClaim,
      requestorder: signedorder,
    });
    expect(matchOrdersRes).not.toBe(undefined);
    expect(matchOrdersRes.dealid).not.toBe(undefined);
    expect(matchOrdersRes.txHash).not.toBe(undefined);
    expect(matchOrdersRes.volume.eq(new BN(10))).toBe(true);

    const showDealRes = await iexec.deal.show(matchOrdersRes.dealid);
    expect(showDealRes).not.toBe(undefined);
    expect(showDealRes.app).not.toBe(undefined);
    expect(showDealRes.app.pointer).toBe(apporder.app);
    expect(showDealRes.app.owner).not.toBe(undefined);
    expect(showDealRes.app.price.eq(new BN(apporder.appprice))).toBe(true);
    expect(showDealRes.dataset).not.toBe(undefined);
    expect(showDealRes.dataset.pointer).toBe(datasetorder.dataset);
    expect(showDealRes.dataset.owner).not.toBe(undefined);
    expect(
      showDealRes.dataset.price.eq(new BN(datasetorder.datasetprice)),
    ).toBe(true);
    expect(showDealRes.workerpool).not.toBe(undefined);
    expect(showDealRes.workerpool.pointer).toBe(
      workerpoolorderToClaim.workerpool,
    );
    expect(showDealRes.workerpool.owner).not.toBe(undefined);
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
    expect(showDealRes.tasks[0]).not.toBe(undefined);
    expect(showDealRes.tasks[9]).not.toBe(undefined);
    expect(showDealRes.tasks[10]).toBe(undefined);

    const showTaskUnsetRes = await iexec.task
      .show(showDealRes.tasks[0])
      .catch(e => e);
    expect(showTaskUnsetRes instanceof errors.ObjectNotFoundError).toBe(true);
    expect(showTaskUnsetRes.message).toBe(
      `No task found for id ${showDealRes.tasks[0]} on chain ${networkId}`,
    );

    const taskIdxToInit = 1;
    await initializeTask(hubAddress, matchOrdersRes.dealid, taskIdxToInit);
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
    expect(showTaskActiveRes.contributors).toStrictEqual({});
    expect(showTaskActiveRes.consensusValue).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
    expect(showTaskActiveRes.resultDigest).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
    expect(showTaskActiveRes.results).toBe('0x');
    expect(showTaskActiveRes.idx.eq(new BN(taskIdxToInit))).toBe(true);
    expect(showTaskActiveRes.statusName).toBe('TIMEOUT');
    expect(showTaskActiveRes.taskTimedOut).toBe(true);

    const taskIdxToClaim = 2;
    await initializeTask(hubAddress, matchOrdersRes.dealid, taskIdxToClaim);
    const claimTaskRes = await iexec.task.claim(
      showDealRes.tasks[taskIdxToClaim],
    );
    expect(claimTaskRes).not.toBe(undefined);

    const claimDealRes = await iexec.deal.claim(matchOrdersRes.dealid);
    expect(claimDealRes).not.toBe(undefined);
    expect(claimDealRes.transactions).not.toBe(undefined);
    expect(claimDealRes.transactions.length).toBe(2);
    expect(claimDealRes.transactions[0]).not.toBe(undefined);
    expect(claimDealRes.transactions[0].type).toBe('claimArray');
    expect(claimDealRes.transactions[1]).not.toBe(undefined);
    expect(claimDealRes.transactions[1].type).toBe('initializeAndClaimArray');
    expect(claimDealRes.claimed).not.toBe(undefined);
    expect(Object.keys(claimDealRes.claimed).length).toBe(9);
    expect(claimDealRes.claimed[0]).not.toBe(undefined);
  }, 10000);
});

describe('[getSignerFromPrivateKey]', () => {
  test('sign tx send value', async () => {
    const amount = new BN(1000);
    const receiver = ADDRESS2;
    const signer = utils.getSignerFromPrivateKey(ethereumURL, PRIVATE_KEY);
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    const senderInitialBalances = await iexec.wallet.checkBalances(
      await iexec.wallet.getAddress(),
    );
    const receiverInitialBalances = await iexec.wallet.checkBalances(receiver);
    const txHash = await iexec.wallet.sendETH(amount, receiver);
    const senderFinalBalances = await iexec.wallet.checkBalances(
      await iexec.wallet.getAddress(),
    );
    const receiverFinalBalances = await iexec.wallet.checkBalances(receiver);
    expect(txHash).not.toBe(undefined);
    expect(txHash.length).toBe(66);
    expect(
      senderFinalBalances.wei
        .add(new BN(amount))
        .lte(senderInitialBalances.wei),
    ).toBe(true);
    expect(senderFinalBalances.nRLC.eq(senderInitialBalances.nRLC)).toBe(true);
    expect(
      receiverFinalBalances.wei
        .sub(new BN(amount))
        .eq(receiverInitialBalances.wei),
    ).toBe(true);
    const tx = await ethRPC.getTransaction(txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  });
  test('sign tx no value', async () => {
    const amount = '1000000000';
    const receiver = ADDRESS2;
    const signer = utils.getSignerFromPrivateKey(ethereumURL, PRIVATE_KEY);
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    const senderInitialBalances = await iexec.wallet.checkBalances(
      await iexec.wallet.getAddress(),
    );
    const receiverInitialBalances = await iexec.wallet.checkBalances(receiver);
    const txHash = await iexec.wallet.sendRLC(amount, receiver);
    const senderFinalBalances = await iexec.wallet.checkBalances(
      await iexec.wallet.getAddress(),
    );
    const receiverFinalBalances = await iexec.wallet.checkBalances(receiver);
    expect(txHash).not.toBe(undefined);
    expect(txHash.length).toBe(66);
    expect(senderFinalBalances.wei.lte(senderInitialBalances.wei)).toBe(true);
    expect(
      senderFinalBalances.nRLC
        .add(new BN(amount))
        .eq(senderInitialBalances.nRLC),
    ).toBe(true);
    expect(
      receiverFinalBalances.nRLC
        .sub(new BN(amount))
        .eq(receiverInitialBalances.nRLC),
    ).toBe(true);
    const tx = await ethRPC.getTransaction(txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  });
  test('gasPrice option', async () => {
    const amount = '1000000000';
    const gasPrice = '123456789';
    const receiver = ADDRESS2;
    const signer = utils.getSignerFromPrivateKey(ethereumURL, PRIVATE_KEY, {
      gasPrice,
    });
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    const senderInitialBalances = await iexec.wallet.checkBalances(
      await iexec.wallet.getAddress(),
    );
    const receiverInitialBalances = await iexec.wallet.checkBalances(receiver);
    const txHash = await iexec.wallet.sendRLC(amount, receiver);
    const senderFinalBalances = await iexec.wallet.checkBalances(
      await iexec.wallet.getAddress(),
    );
    const receiverFinalBalances = await iexec.wallet.checkBalances(receiver);
    expect(txHash).not.toBe(undefined);
    expect(txHash.length).toBe(66);
    expect(senderFinalBalances.wei.lte(senderInitialBalances.wei)).toBe(true);
    expect(
      senderFinalBalances.nRLC
        .add(new BN(amount))
        .eq(senderInitialBalances.nRLC),
    ).toBe(true);
    expect(
      receiverFinalBalances.nRLC
        .sub(new BN(amount))
        .eq(receiverInitialBalances.nRLC),
    ).toBe(true);
    const tx = await ethRPC.getTransaction(txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(gasPrice);
  });
  test('getTransactionCount option (custom nonce management, concurrent tx)', async () => {
    const amount = new BN(1000);
    const receiver = ADDRESS2;
    const nonceProvider = await (async (address) => {
      const initNonce = ethers.utils.bigNumberify(
        await ethRPC1s.send('eth_getTransactionCount', [address, 'latest']),
      );
      let i = 0;
      const getNonce = () => initNonce.add(ethers.utils.bigNumberify(i++)).toHexString();
      return {
        getNonce,
      };
    })(ADDRESS);

    const signer = utils.getSignerFromPrivateKey(ethereumURL1s, PRIVATE_KEY, {
      getTransactionCount: nonceProvider.getNonce,
    });

    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    const senderInitialBalances = await iexec.wallet.checkBalances(
      await iexec.wallet.getAddress(),
    );
    const receiverInitialBalances = await iexec.wallet.checkBalances(receiver);

    const resArray = await Promise.all([
      iexec.workerpool.deployWorkerpool({
        owner: ADDRESS,
        description: 'My workerpool',
      }),
      iexec.app.deployApp({
        owner: ADDRESS,
        name: 'My app',
        type: 'DOCKER',
        multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
        checksum:
          '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
        mrenclave: '',
      }),
      iexec.dataset.deployDataset({
        owner: ADDRESS,
        name: 'My dataset',
        multiaddr: '/ipfs/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
        checksum:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      }),
      iexec.wallet.sendETH(amount, receiver),
      iexec.wallet.sendETH(amount, receiver),
      iexec.wallet.sendETH(amount, receiver),
      iexec.account.deposit(amount),
    ]);

    expect(resArray).not.toBe(undefined);
    expect(resArray.length).toBe(7);
    const txHashArray = [
      resArray[0].txHash,
      resArray[1].txHash,
      resArray[2].txHash,
      resArray[3],
      resArray[4],
      resArray[5],
      resArray[6].txHash,
    ];
    expect(txHashArray[0].length).toBe(66);
    expect(txHashArray[1].length).toBe(66);
    expect(txHashArray[2].length).toBe(66);
    expect(txHashArray[3].length).toBe(66);
    expect(txHashArray[4].length).toBe(66);
    expect(txHashArray[5].length).toBe(66);
    expect(txHashArray[6].length).toBe(66);

    const tx0 = await ethRPC1s.getTransaction(txHashArray[0]);
    expect(tx0).not.toBe(undefined);
    expect(tx0.gasPrice.toString()).toBe(chainGasPrice);
    const tx1 = await ethRPC1s.getTransaction(txHashArray[1]);
    expect(tx1).not.toBe(undefined);
    expect(tx1.gasPrice.toString()).toBe(chainGasPrice);
    const tx2 = await ethRPC1s.getTransaction(txHashArray[2]);
    expect(tx2).not.toBe(undefined);
    expect(tx2.gasPrice.toString()).toBe(chainGasPrice);
    const tx3 = await ethRPC1s.getTransaction(txHashArray[3]);
    expect(tx3).not.toBe(undefined);
    expect(tx3.gasPrice.toString()).toBe(chainGasPrice);
    const tx4 = await ethRPC1s.getTransaction(txHashArray[4]);
    expect(tx4).not.toBe(undefined);
    expect(tx4.gasPrice.toString()).toBe(chainGasPrice);
    const tx5 = await ethRPC1s.getTransaction(txHashArray[5]);
    expect(tx5).not.toBe(undefined);
    expect(tx5.gasPrice.toString()).toBe(chainGasPrice);
    const tx6 = await ethRPC1s.getTransaction(txHashArray[6]);
    expect(tx6).not.toBe(undefined);
    expect(tx6.gasPrice.toString()).toBe(chainGasPrice);

    const senderFinalBalances = await iexec.wallet.checkBalances(
      await iexec.wallet.getAddress(),
    );
    const receiverFinalBalances = await iexec.wallet.checkBalances(receiver);
    expect(
      senderFinalBalances.wei
        .add(new BN(amount))
        .lte(senderInitialBalances.wei),
    ).toBe(true);
    expect(
      receiverFinalBalances.wei
        .sub(new BN(amount).mul(new BN(3)))
        .eq(receiverInitialBalances.wei),
    ).toBe(true);
    expect(
      senderInitialBalances.nRLC.eq(
        senderFinalBalances.nRLC.add(new BN(amount)),
      ),
    ).toBe(true);
  }, 20000);
});

describe('[observables]', () => {
  test('task.obsTask', async () => {
    const signer = utils.getSignerFromPrivateKey(ethereumURL, PRIVATE_KEY);
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    const catid = await createCategory(iexec, { workClockTimeRef: 10 });
    const apporder = await deployAndGetApporder(iexec);
    const workerpoolorder = await deployAndGetWorkerpoolorder(iexec, {
      category: catid,
    });
    const requestorder = await getMatchableRequestorder(iexec, {
      apporder,
      workerpoolorder,
    });
    const { dealid } = await iexec.order.matchOrders({
      apporder,
      workerpoolorder,
      requestorder,
    });
    const { tasks } = await iexec.deal.show(dealid);
    const taskid = tasks[0];

    const obsTaskWithDealidValues = [];
    const obsTaskUnsubBeforeNextValues = [];
    const obsTaskAfterInitValues = [];

    let unsubObsTaskWithDealid;
    let unsubObsTaskBeforeNext;
    let unsubObsTaskAfterInit;

    await Promise.race([
      new Promise((resolve, reject) => {
        unsubObsTaskWithDealid = iexec.task
          .obsTask(taskid, { dealid })
          .subscribe({
            next: (value) => {
              obsTaskWithDealidValues.push(value);
            },
            error: () => reject(Error('obsTask with dealid should not call error')),
            complete: () => reject(Error('obsTask with dealid should not call complete')),
          });
      }),
      new Promise(async (resolve, reject) => {
        unsubObsTaskBeforeNext = iexec.task
          .obsTask(taskid, { dealid })
          .subscribe({
            next: (value) => {
              obsTaskUnsubBeforeNextValues.push(value);
              try {
                unsubObsTaskBeforeNext();
              } catch (e) {
                reject(e);
              }
            },
            error: () => reject(Error('obsTask unsub before next should not call error')),
            complete: () => reject(
              Error('obsTask unsub before next should not call complete'),
            ),
          });
        await sleep(10000);
      }),
      new Promise(async (resolve, reject) => {
        await sleep(5000);
        unsubObsTaskAfterInit = iexec.task.obsTask(taskid).subscribe({
          next: (value) => {
            obsTaskAfterInitValues.push(value);
          },
          error: () => reject(Error('obsTask after init should not call error')),
          complete: () => reject(Error('obsTask after init should not call complete')),
        });
      }),
      sleep(1000).then(async () => {
        await initializeTask(hubAddress, dealid, 0);
        await sleep(6000);
      }),
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
  }, 30000);

  test('task.obsTask (task timeout)', async () => {
    const signer = utils.getSignerFromPrivateKey(ethereumURL, PRIVATE_KEY);
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    const catid = await createCategory(iexec, { workClockTimeRef: 1 });
    const apporder = await deployAndGetApporder(iexec);
    const workerpoolorder = await deployAndGetWorkerpoolorder(iexec, {
      category: catid,
    });
    const requestorder = await getMatchableRequestorder(iexec, {
      apporder,
      workerpoolorder,
    });
    const { dealid } = await iexec.order.matchOrders({
      apporder,
      workerpoolorder,
      requestorder,
    });
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
        iexec.task.obsTask(taskid, { dealid }).subscribe({
          next: (value) => {
            obsTaskWithDealidValues.push(value);
          },
          error: () => reject(Error('obsTask with dealid should not call error')),
          complete: resolve,
        });
      }),
      new Promise((resolve, reject) => {
        iexec.task.obsTask(taskid, { dealid: utils.NULL_BYTES32 }).subscribe({
          next: (value) => {
            obsTaskWithWrongDealidValues.push(value);
          },
          error: resolve,
          complete: () => reject(Error('obsTask with wrong dealid should not call complete')),
        });
      }),
      new Promise((resolve, reject) => {
        iexec.task.obsTask(taskid).subscribe({
          next: (value) => {
            obsTaskBeforeInitValues.push(value);
          },
          error: resolve,
          complete: () => reject(Error('obsTask before init should not call complete')),
        });
      }),
      new Promise(async (resolve, reject) => {
        await sleep(5000);
        iexec.task.obsTask(taskid).subscribe({
          next: (value) => {
            obsTaskAfterInitValues.push(value);
          },
          error: () => reject(Error('obsTask after init should not call error')),
          complete: resolve,
        });
      }),
      new Promise(async (resolve, reject) => {
        unsubObsTaskBeforeComplete = iexec.task
          .obsTask(taskid, { dealid })
          .subscribe({
            next: (value) => {
              obsTaskUnsubBeforeCompleteValues.push(value);
            },
            error: () => reject(Error('obsTask unsubscribed should nol call complete')),
            complete: () => reject(Error('obsTask unsubscribed should nol call complete')),
          });
        await sleep(1000);
        resolve();
      }),
      sleep(1000).then(() => {
        unsubObsTaskBeforeComplete();
        initializeTask(hubAddress, dealid, 0);
      }),
    ]);

    expect(obsTaskWithDealidComplete).toBeUndefined();
    expect(obsTaskWithWrongDealidError).toEqual(
      new errors.ObjectNotFoundError('deal', utils.NULL_BYTES32, networkId),
    );
    expect(obsTaskBeforeInitError).toEqual(
      new errors.ObjectNotFoundError('task', taskid, networkId),
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
  }, 30000);

  test('deal.obsDeal', async () => {
    const signer = utils.getSignerFromPrivateKey(ethereumURL, PRIVATE_KEY);
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    const catid = await createCategory(iexec, { workClockTimeRef: 10 });
    const apporder = await deployAndGetApporder(iexec, { volume: 10 });
    const workerpoolorder = await deployAndGetWorkerpoolorder(iexec, {
      category: catid,
      volume: 10,
    });
    const requestorder = await getMatchableRequestorder(iexec, {
      apporder,
      workerpoolorder,
    });
    const { dealid } = await iexec.order.matchOrders({
      apporder,
      workerpoolorder,
      requestorder,
    });

    const obsDealValues = [];
    const obsDealUnsubBeforeNextValues = [];

    let unsubObsDeal;
    let unsubObsDealBeforeNext;

    await Promise.race([
      new Promise((resolve, reject) => {
        unsubObsDeal = iexec.deal.obsDeal(dealid).subscribe({
          next: (value) => {
            obsDealValues.push(value);
          },
          error: () => reject(Error('obsDeal should not call error')),
          complete: () => reject(Error('obsDeal should not call complete')),
        });
      }),
      new Promise(async (resolve, reject) => {
        unsubObsDealBeforeNext = iexec.deal.obsDeal(dealid).subscribe({
          next: (value) => {
            obsDealUnsubBeforeNextValues.push(value);
            try {
              unsubObsDealBeforeNext();
            } catch (e) {
              reject(e);
            }
          },
          error: () => reject(Error('obsDeal unsub before next should not call error')),
          complete: () => reject(Error('obsDeal unsub before next should not call complete')),
        });
        await sleep(10000);
      }),
      sleep(1000).then(async () => {
        await initializeTask(hubAddress, dealid, 5);
        await sleep(6000);
        await initializeTask(hubAddress, dealid, 0);
        await sleep(6000);
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
  }, 30000);

  test('deal.obsDeal (deal timeout)', async () => {
    const signer = utils.getSignerFromPrivateKey(ethereumURL, PRIVATE_KEY);
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    const catid = await createCategory(iexec, { workClockTimeRef: 1 });
    const apporder = await deployAndGetApporder(iexec, { volume: 10 });
    const workerpoolorder = await deployAndGetWorkerpoolorder(iexec, {
      category: catid,
      volume: 10,
    });
    const requestorder = await getMatchableRequestorder(iexec, {
      apporder,
      workerpoolorder,
    });
    const { dealid } = await iexec.order.matchOrders({
      apporder,
      workerpoolorder,
      requestorder,
    });

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
        iexec.deal.obsDeal(dealid).subscribe({
          next: (value) => {
            obsDealCompleteValues.push(value);
          },
          error: () => reject(Error('obsDeal should not call error')),
          complete: resolve,
        });
      }),
      new Promise((resolve, reject) => {
        iexec.deal.obsDeal(utils.NULL_BYTES32).subscribe({
          next: (value) => {
            obsDealWithWrongDealidValues.push(value);
          },
          error: resolve,
          complete: () => reject(Error('obsDeal with wrong dealid should not call complete')),
        });
      }),
      new Promise(async (resolve, reject) => {
        unsubObsDealBeforeComplete = iexec.deal.obsDeal(dealid).subscribe({
          next: (value) => {
            obsDealUnsubBeforeCompleteValues.push(value);
          },
          error: () => reject(
            Error('obsDeal unsub before complete should not call error'),
          ),
          complete: () => reject(
            Error('obsDeal unsub before complete should not call complete'),
          ),
        });
        await sleep(10000);
        resolve();
      }),
      sleep(3000).then(async () => {
        unsubObsDealBeforeComplete();
        await initializeTask(hubAddress, dealid, 5);
        await initializeTask(hubAddress, dealid, 0);
        await sleep(6000);
      }),
    ]);

    expect(obsDealComplete).toBeUndefined();
    expect(obsDealWithWrongDealidError).toEqual(
      new errors.ObjectNotFoundError('deal', utils.NULL_BYTES32, networkId),
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
  }, 30000);
});

describe('[lib utils]', () => {
  describe('parseEth', () => {
    test("parseEth('4.2')", () => {
      const res = utils.parseEth('4.2');
      expect(res instanceof BN).toBe(true);
      expect(res.eq(new BN('4200000000000000000'))).toBe(true);
    });
    test('parseEth(4.2)', () => {
      const res = utils.parseEth(4.2);
      expect(res instanceof BN).toBe(true);
      expect(res.eq(new BN('4200000000000000000'))).toBe(true);
    });
    test('parseEth(new BN(42))', () => {
      const res = utils.parseEth(new BN(42));
      expect(res instanceof BN).toBe(true);
      expect(res.eq(new BN('42000000000000000000'))).toBe(true);
    });
  });
  describe('parseRLC', () => {
    test("parseRLC('4.2')", () => {
      const res = utils.parseRLC('4.2');
      expect(res instanceof BN).toBe(true);
      expect(res.eq(new BN('4200000000'))).toBe(true);
    });
    test('parseRLC(4.2)', () => {
      const res = utils.parseRLC(4.2);
      expect(res instanceof BN).toBe(true);
      expect(res.eq(new BN('4200000000'))).toBe(true);
    });
    test('parseRLC(new BN(42))', () => {
      const res = utils.parseRLC(new BN(42));
      expect(res instanceof BN).toBe(true);
      expect(res.eq(new BN('42000000000'))).toBe(true);
    });
  });
  describe('formatEth', () => {
    test("formatEth('4200000000000000000')", () => {
      const res = utils.formatEth('4200000000000000000');
      expect(res).toBe('4.2');
    });
    test('formatEth(42)', () => {
      const res = utils.formatEth(42);
      expect(res).toBe('0.000000000000000042');
    });
    test("formatEth(new BN('4200000000000000000'))", () => {
      const res = utils.formatEth(new BN('4200000000000000000'));
      expect(res).toBe('4.2');
    });
  });
  describe('formatRLC', () => {
    test("formatRLC('4200000000000000000')", () => {
      const res = utils.formatRLC('4200000000000000000');
      expect(res).toBe('4200000000');
    });
    test('formatRLC(42)', () => {
      const res = utils.formatRLC(42);
      expect(res).toBe('0.000000042');
    });
    test("formatRLC(new BN('4200000000000000000'))", () => {
      const res = utils.formatRLC(new BN('4200000000000000000'));
      expect(res).toBe('4200000000');
    });
  });
  describe('encodeTag', () => {
    test("encodeTag(['tee'])", () => {
      expect(utils.encodeTag(['tee'])).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      );
    });
    test("encodeTag(['gpu'])", () => {
      expect(utils.encodeTag(['gpu'])).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000100',
      );
    });
    test("encodeTag(['gpu','tee'])", () => {
      expect(utils.encodeTag(['gpu', 'tee'])).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000101',
      );
    });
    test("encodeTag(['gpu','tee','gpu','tee'])", () => {
      expect(utils.encodeTag(['gpu', 'tee', 'gpu', 'tee'])).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000101',
      );
    });
    test('encodeTag unknown tag', () => {
      expect(() => utils.encodeTag(['tee', 'foo'])).toThrow('unknown tag foo');
    });
  });
  describe('decodeTag', () => {
    test("decodeTag('0x0000000000000000000000000000000000000000000000000000000000000001')", () => {
      expect(
        utils.decodeTag(
          '0x0000000000000000000000000000000000000000000000000000000000000001',
        ),
      ).toStrictEqual(['tee']);
    });
    test('decodeTag unknown bit tag', () => {
      expect(() => utils.decodeTag(
        '0x0000000000000000000000000000000000000000000000000000000000000002',
      )).toThrow('unknown bit 2');
    });
  });
  describe('sumTags', () => {
    test('sumTags from Bytes32', () => {
      expect(
        utils.sumTags([
          '0x0000000000000000000000000000000000000000000000000000000000000100',
          '0x0000000000000000000000000000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000000000000000000000000000001',
        ]),
      ).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000101',
      );
    });
    test('sumTags unknown bit tag', () => {
      expect(() => utils.sumTags([
        '0x0000000000000000000000000000000000000000000000000000000000000002',
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      ])).toThrow('unknown bit 2');
    });
    test('sumTags invalid bytes32', () => {
      expect(() => utils.sumTags([
        '0x000000000000000000000000000000000000000000000000000000000000000z',
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      ])).toThrow('tag must be bytes32 hex string');
    });
  });
});
