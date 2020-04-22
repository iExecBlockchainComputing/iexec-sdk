const ethers = require('ethers');
const BN = require('bn.js');
const fs = require('fs-extra');
const path = require('path');
const JSZip = require('jszip');
const { utils, IExec, errors } = require('../src/iexec-lib');
const { sleep, bytes32Regex, addressRegex } = require('../src/utils');

console.log('Node version:', process.version);

// CONFIG
const { DRONE } = process.env;
// 1 block / tx
const tokenChainUrl = DRONE
  ? 'http://token-chain:8545'
  : 'http://localhost:8545';
const nativeChainUrl = DRONE
  ? 'http://native-chain:8545'
  : 'http://localhost:18545';
// blocktime 1s for concurrent tx test
const tokenChainUrl1s = DRONE
  ? 'http://token-chain-1s:8545'
  : 'http://localhost:28545';

const chainGasPrice = '20000000000';
const nativeChainGasPrice = '0';
let hubAddress;
let nativeHubAddress;
let networkId;

const PRIVATE_KEY = '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407';
const PUBLIC_KEY = '0x0463b6265f021cc1f249366d5ade5bcdf7d33debe594e9d94affdf1aa02255928490fc2c96990a386499b66d17565de1c12ba8fb4ae3af7539e6c61aa7f0113edd';
const ADDRESS = '0x7bd4783FDCAD405A28052a0d1f11236A741da593';
const PRIVATE_KEY2 = '0xd0c5f29f0e7ebe1d3217096fb06130e217758c90f361d3c52ea26c2a0ecc99fb';
const ADDRESS2 = '0x650ae1d365369129c326Cd15Bf91793b52B7cf59';
const ADDRESS3 = '0xA540FCf5f097c3F996e680F5cb266629600F064A';

// UTILS

const tokenChainRPC = new ethers.providers.JsonRpcProvider(tokenChainUrl);
const tokenChainRPC1s = new ethers.providers.JsonRpcProvider(tokenChainUrl1s);
const tokenChainWallet = new ethers.Wallet(PRIVATE_KEY, tokenChainRPC);

const nativeChainRPC = new ethers.providers.JsonRpcProvider(nativeChainUrl);
const nativeChainWallet = new ethers.Wallet(PRIVATE_KEY, nativeChainRPC);

const initializeTask = async (wallet, hub, dealid, idx) => {
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
    wallet,
  );
  const initTx = await hubContract.initialize(dealid, idx);
  await initTx.wait();
};

let sequenceId = Date.now();
const getId = () => {
  sequenceId += 1;
  return sequenceId;
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
    name: `app${getId()}`,
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
    name: `dataset${getId()}`,
    multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
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
    description: `workerpool${getId()}`,
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
  const { chainId } = await tokenChainRPC.getNetwork();
  console.log('chainId', chainId);
  networkId = `${chainId}`;

  const factoryAddress = (
    await tokenChainRPC.getTransaction(
      (await tokenChainRPC.getBlock(4)).transactions[0],
    )
  ).creates;
  console.log('factoryAddress', factoryAddress);

  hubAddress = '0xC08e9Be37286B7Bbf04875369cf28C21b3F06FCB';
  nativeHubAddress = '0xC08e9Be37286B7Bbf04875369cf28C21b3F06FCB';
  console.log('hubAddress', hubAddress);
  console.log('nativeHubAddress', nativeHubAddress);
}, 15000);

describe('[workflow]', () => {
  let noDurationCatId;
  let apporder;
  let datasetorder;
  let workerpoolorder;
  let workerpoolorderToClaim;
  test('create category', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    expect(res).toBeDefined();
    expect(res.catid).toBeDefined();
    expect(res.txHash).toBeDefined();
  });
  test('deploy and sell app', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const appName = `My app${getId()}`;
    const appDeployRes = await iexec.app.deployApp({
      owner,
      name: appName,
      type: 'DOCKER',
      multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
      checksum:
        '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
      mrenclave: 'abc|123|test',
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
    expect(appShowRes.app.appMREnclave).toBe('abc|123|test');

    const order = await iexec.order.createApporder({
      app: appDeployRes.address,
      appprice: '1000000000',
      volume: '1000',
    });
    const signedorder = await iexec.order.signApporder(order);
    apporder = signedorder;
    expect(signedorder.sign).toBeDefined();
  });
  test('deploy and sell dataset', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const datasetName = `My daatset${getId()}`;
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
    const signedorder = await iexec.order.signDatasetorder(order);
    datasetorder = signedorder;
    expect(signedorder.sign).toBeDefined();
  });
  test('deploy and sell computing power', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
      workerpoolprice: '1000000000',
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
    workerpoolorderToClaim = await iexec.order.signWorkerpoolorder(
      orderToClaim,
    );
    expect(workerpoolorderToClaim.sign).toBeDefined();
  });
  test('buy computation', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    expect(signedorder.sign).toBeDefined();

    const matchOrdersRes = await iexec.order.matchOrders({
      apporder,
      datasetorder,
      workerpoolorder,
      requestorder: signedorder,
    });
    expect(matchOrdersRes).toBeDefined();
    expect(matchOrdersRes.dealid).toBeDefined();
    expect(matchOrdersRes.txHash).toBeDefined();
    expect(matchOrdersRes.volume.eq(new BN(1))).toBe(true);
  });

  test('show & claim task, show & claim deal (initialized & uninitialized tasks)', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    expect(signedorder.sign).toBeDefined();
    const matchOrdersRes = await iexec.order.matchOrders({
      apporder,
      datasetorder,
      workerpoolorder: workerpoolorderToClaim,
      requestorder: signedorder,
    });
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
      .catch(e => e);
    expect(showTaskUnsetRes instanceof errors.ObjectNotFoundError).toBe(true);
    expect(showTaskUnsetRes.message).toBe(
      `No task found for id ${showDealRes.tasks[0]} on chain ${networkId}`,
    );

    const taskIdxToInit = 1;
    await initializeTask(
      tokenChainWallet,
      hubAddress,
      matchOrdersRes.dealid,
      taskIdxToInit,
    );
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
    await initializeTask(
      tokenChainWallet,
      hubAddress,
      matchOrdersRes.dealid,
      taskIdxToClaim,
    );
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
  }, 15000);
});

describe('[getSignerFromPrivateKey]', () => {
  test('sign tx send value', async () => {
    const amount = new BN(1000);
    const receiver = ADDRESS2;
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    expect(txHash).toBeDefined();
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
    const tx = await tokenChainRPC.getTransaction(txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  });
  test('sign tx no value', async () => {
    const amount = '1000000000';
    const receiver = ADDRESS2;
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    expect(txHash).toBeDefined();
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
    const tx = await tokenChainRPC.getTransaction(txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  });
  test('gasPrice option', async () => {
    const amount = '1000000000';
    const gasPrice = '123456789';
    const receiver = ADDRESS2;
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY, {
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
    expect(txHash).toBeDefined();
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
    const tx = await tokenChainRPC.getTransaction(txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(gasPrice);
  });
  test('getTransactionCount option (custom nonce management, concurrent tx)', async () => {
    const amount = new BN(1000);
    const receiver = ADDRESS2;
    const nonceProvider = await (async (address) => {
      const initNonce = ethers.utils.bigNumberify(
        await tokenChainRPC1s.send('eth_getTransactionCount', [
          address,
          'latest',
        ]),
      );
      let i = 0;
      const getNonce = () => initNonce.add(ethers.utils.bigNumberify(i++)).toHexString();
      return {
        getNonce,
      };
    })(ADDRESS);

    const signer = utils.getSignerFromPrivateKey(tokenChainUrl1s, PRIVATE_KEY, {
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
        description: `My workerpool${getId()}`,
      }),
      iexec.app.deployApp({
        owner: ADDRESS,
        name: `My app${getId()}`,
        type: 'DOCKER',
        multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
        checksum:
          '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
        mrenclave: '',
      }),
      iexec.dataset.deployDataset({
        owner: ADDRESS,
        name: `My dataset${getId()}`,
        multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
        checksum:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      }),
      iexec.wallet.sendETH(amount, receiver),
      iexec.wallet.sendETH(amount, receiver),
      iexec.wallet.sendETH(amount, receiver),
      iexec.account.deposit(amount),
    ]);

    expect(resArray).toBeDefined();
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

    const tx0 = await tokenChainRPC1s.getTransaction(txHashArray[0]);
    expect(tx0).toBeDefined();
    expect(tx0.gasPrice.toString()).toBe(chainGasPrice);
    const tx1 = await tokenChainRPC1s.getTransaction(txHashArray[1]);
    expect(tx1).toBeDefined();
    expect(tx1.gasPrice.toString()).toBe(chainGasPrice);
    const tx2 = await tokenChainRPC1s.getTransaction(txHashArray[2]);
    expect(tx2).toBeDefined();
    expect(tx2.gasPrice.toString()).toBe(chainGasPrice);
    const tx3 = await tokenChainRPC1s.getTransaction(txHashArray[3]);
    expect(tx3).toBeDefined();
    expect(tx3.gasPrice.toString()).toBe(chainGasPrice);
    const tx4 = await tokenChainRPC1s.getTransaction(txHashArray[4]);
    expect(tx4).toBeDefined();
    expect(tx4.gasPrice.toString()).toBe(chainGasPrice);
    const tx5 = await tokenChainRPC1s.getTransaction(txHashArray[5]);
    expect(tx5).toBeDefined();
    expect(tx5.gasPrice.toString()).toBe(chainGasPrice);
    const tx6 = await tokenChainRPC1s.getTransaction(txHashArray[6]);
    expect(tx6).toBeDefined();
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

describe('[wallet]', () => {
  test('wallet.getAddress()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const res = await iexec.wallet.getAddress();
    expect(res).toBe(ADDRESS);
  });
  test('wallet.checkBalances()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const initialBalance = await iexec.wallet.checkBalances(ADDRESS);
    expect(initialBalance.wei).toBeInstanceOf(BN);
    expect(initialBalance.nRLC).toBeInstanceOf(BN);
    await iexec.wallet.sendETH(5, utils.NULL_ADDRESS);
    await iexec.wallet.sendRLC(10, utils.NULL_ADDRESS);
    const finalBalance = await iexec.wallet.checkBalances(ADDRESS);
    expect(finalBalance.wei).toBeInstanceOf(BN);
    expect(finalBalance.nRLC).toBeInstanceOf(BN);
    expect(finalBalance.wei.add(new BN(5)).lt(initialBalance.wei)).toBe(true);
    expect(finalBalance.nRLC.add(new BN(10)).eq(initialBalance.nRLC)).toBe(
      true,
    );
  });
  test('wallet.checkBalances() (native)', async () => {
    const signer = utils.getSignerFromPrivateKey(nativeChainUrl, PRIVATE_KEY);
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress: nativeHubAddress,
        isNative: true,
      },
    );
    const initialBalance = await iexec.wallet.checkBalances(ADDRESS);
    expect(initialBalance.wei).toBeInstanceOf(BN);
    expect(initialBalance.nRLC).toBeInstanceOf(BN);
    expect(
      initialBalance.wei.eq(initialBalance.nRLC.mul(new BN(1000000000))),
    ).toBe(true);
    await iexec.wallet.sendRLC(10, utils.NULL_ADDRESS);
    const finalBalance = await iexec.wallet.checkBalances(ADDRESS);
    expect(finalBalance.wei).toBeInstanceOf(BN);
    expect(finalBalance.nRLC).toBeInstanceOf(BN);
    expect(finalBalance.wei.add(new BN(10)).lt(initialBalance.wei)).toBe(true);
    expect(finalBalance.nRLC.add(new BN(10)).eq(initialBalance.nRLC)).toBe(
      true,
    );
    expect(finalBalance.wei.eq(finalBalance.nRLC.mul(new BN(1000000000)))).toBe(
      true,
    );
  });
  test.skip('wallet.checkBridgedBalances() (token)', async () => {
    throw Error('TODO');
  });
  test.skip('wallet.checkBridgedBalances() (native)', async () => {
    throw Error('TODO');
  });
  test('wallet.sendETH()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const initialBalance = await iexec.wallet.checkBalances(ADDRESS);
    const receiverInitialBalance = await iexec.wallet.checkBalances(ADDRESS3);
    const txHash = await iexec.wallet.sendETH(5, ADDRESS3);
    const finalBalance = await iexec.wallet.checkBalances(ADDRESS);
    const receiverFinalBalance = await iexec.wallet.checkBalances(ADDRESS3);
    expect(txHash).toMatch(bytes32Regex);
    expect(finalBalance.wei.add(new BN(5)).lt(initialBalance.wei)).toBe(true);
    expect(finalBalance.nRLC.eq(initialBalance.nRLC)).toBe(true);
    expect(
      receiverFinalBalance.wei.eq(receiverInitialBalance.wei.add(new BN(5))),
    ).toBe(true);
    expect(receiverFinalBalance.nRLC.eq(receiverInitialBalance.nRLC)).toBe(
      true,
    );
  });
  test('wallet.sendETH() (throw on native)', async () => {
    const signer = utils.getSignerFromPrivateKey(nativeChainUrl, PRIVATE_KEY);
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress: nativeHubAddress,
        isNative: true,
      },
    );
    await expect(iexec.wallet.sendETH(10, ADDRESS3)).rejects.toThrow(
      Error('sendETH() is disabled on sidechain, use sendRLC()'),
    );
  });
  test('wallet.sendRLC()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const initialBalance = await iexec.wallet.checkBalances(ADDRESS);
    const receiverInitialBalance = await iexec.wallet.checkBalances(ADDRESS3);
    const txHash = await iexec.wallet.sendRLC(5, ADDRESS3);
    const finalBalance = await iexec.wallet.checkBalances(ADDRESS);
    const receiverFinalBalance = await iexec.wallet.checkBalances(ADDRESS3);
    expect(txHash).toMatch(bytes32Regex);
    expect(finalBalance.wei.lt(initialBalance.wei)).toBe(true);
    expect(finalBalance.nRLC.add(new BN(5)).eq(initialBalance.nRLC)).toBe(true);
    expect(receiverFinalBalance.wei.eq(receiverInitialBalance.wei)).toBe(true);
  });
  test('wallet.sendRLC() (native)', async () => {
    const signer = utils.getSignerFromPrivateKey(nativeChainUrl, PRIVATE_KEY);
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress: nativeHubAddress,
        isNative: true,
      },
    );
    const initialBalance = await iexec.wallet.checkBalances(ADDRESS);
    const receiverInitialBalance = await iexec.wallet.checkBalances(ADDRESS3);
    const txHash = await iexec.wallet.sendRLC(5, ADDRESS3);
    const finalBalance = await iexec.wallet.checkBalances(ADDRESS);
    const receiverFinalBalance = await iexec.wallet.checkBalances(ADDRESS3);
    expect(txHash).toMatch(bytes32Regex);
    expect(finalBalance.nRLC.add(new BN(5)).eq(initialBalance.nRLC)).toBe(true);
    expect(
      finalBalance.wei
        .add(new BN(5).mul(new BN(1000000000)))
        .eq(initialBalance.wei),
    ).toBe(true);
    expect(
      receiverFinalBalance.nRLC.sub(new BN(5)).eq(receiverInitialBalance.nRLC),
    ).toBe(true);
    expect(
      receiverFinalBalance.wei
        .sub(new BN(5).mul(new BN(1000000000)))
        .eq(receiverInitialBalance.wei),
    ).toBe(true);
  });
  test('wallet.sweep()', async () => {
    const iexecRichman = new IExec(
      {
        ethProvider: utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY),
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    const iexec = new IExec(
      {
        ethProvider: utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY2),
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    await iexecRichman.wallet.sendETH('10000000000000000', ADDRESS2);
    await iexecRichman.wallet.sendRLC(20, ADDRESS2);
    const initialBalance = await iexec.wallet.checkBalances(ADDRESS2);
    const receiverInitialBalance = await iexec.wallet.checkBalances(ADDRESS3);
    const res = await iexec.wallet.sweep(ADDRESS3);
    const finalBalance = await iexec.wallet.checkBalances(ADDRESS2);
    const receiverFinalBalance = await iexec.wallet.checkBalances(ADDRESS3);
    expect(res.sendNativeTxHash).toMatch(bytes32Regex);
    expect(res.sendERC20TxHash).toMatch(bytes32Regex);
    expect(initialBalance.wei.gt(new BN(0))).toBe(true);
    expect(initialBalance.nRLC.gt(new BN(0))).toBe(true);
    expect(finalBalance.wei.eq(new BN(0))).toBe(true);
    expect(finalBalance.nRLC.eq(new BN(0))).toBe(true);
    expect(receiverFinalBalance.wei.gt(receiverInitialBalance.wei)).toBe(true);
    expect(
      receiverFinalBalance.nRLC
        .sub(initialBalance.nRLC)
        .eq(receiverInitialBalance.nRLC),
    ).toBe(true);
  });
  test('wallet.sweep() (ERC20 fail)', async () => {
    const iexecRichman = new IExec(
      {
        ethProvider: utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY),
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    const iexec = new IExec(
      {
        ethProvider: utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY2),
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    await iexecRichman.wallet.sendETH(100, ADDRESS2);
    await iexecRichman.wallet.sendRLC(20, ADDRESS2);
    const initialBalance = await iexec.wallet.checkBalances(ADDRESS2);
    const receiverInitialBalance = await iexec.wallet.checkBalances(ADDRESS3);
    await expect(iexec.wallet.sweep(ADDRESS3)).rejects.toThrow(
      Error(
        `Failed to sweep ERC20, sweep aborted. errors: Failed to transfert ERC20': sender doesn't have enough funds to send tx. The upfront cost is: 725180000000000 and the sender's account only has: ${initialBalance.wei.toString()}`,
      ),
    );
    const finalBalance = await iexec.wallet.checkBalances(ADDRESS2);
    const receiverFinalBalance = await iexec.wallet.checkBalances(ADDRESS3);
    expect(initialBalance.wei.gt(new BN(0))).toBe(true);
    expect(initialBalance.nRLC.gt(new BN(0))).toBe(true);
    expect(finalBalance.wei.eq(initialBalance.wei)).toBe(true);
    expect(finalBalance.nRLC.eq(initialBalance.nRLC)).toBe(true);
    expect(receiverFinalBalance.wei.eq(receiverInitialBalance.wei)).toBe(true);
    expect(receiverFinalBalance.nRLC.eq(receiverInitialBalance.nRLC)).toBe(
      true,
    );
  });
  test('wallet.sweep() (ERC20 success, native fail)', async () => {
    const iexecRichman = new IExec(
      {
        ethProvider: utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY),
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    const iexec = new IExec(
      {
        ethProvider: utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY2),
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    await iexecRichman.wallet.sendETH('725180000000100', ADDRESS2);
    await iexecRichman.wallet.sendRLC(20, ADDRESS2);
    const initialBalance = await iexec.wallet.checkBalances(ADDRESS2);
    const receiverInitialBalance = await iexec.wallet.checkBalances(ADDRESS3);
    const res = await iexec.wallet.sweep(ADDRESS3);
    const finalBalance = await iexec.wallet.checkBalances(ADDRESS2);
    const receiverFinalBalance = await iexec.wallet.checkBalances(ADDRESS3);
    expect(res.sendNativeTxHash).toBeUndefined();
    expect(res.sendERC20TxHash).toMatch(bytes32Regex);
    expect(res.errors.length).toBe(1);
    expect(res.errors[0]).toBe(
      "Failed to transfert native token': Tx fees are greather than wallet balance",
    );
    expect(initialBalance.wei.gt(new BN(0))).toBe(true);
    expect(initialBalance.nRLC.gt(new BN(0))).toBe(true);
    expect(finalBalance.wei.gt(new BN(0))).toBe(true);
    expect(finalBalance.nRLC.eq(new BN(0))).toBe(true);
    expect(receiverFinalBalance.wei.eq(receiverInitialBalance.wei)).toBe(true);
    expect(
      receiverFinalBalance.nRLC
        .sub(initialBalance.nRLC)
        .eq(receiverInitialBalance.nRLC),
    ).toBe(true);
  });
  test('wallet.sweep() (native)', async () => {
    const iexecRichman = new IExec(
      {
        ethProvider: utils.getSignerFromPrivateKey(nativeChainUrl, PRIVATE_KEY),
        chainId: networkId,
      },
      {
        hubAddress: nativeHubAddress,
        isNative: true,
      },
    );
    const iexec = new IExec(
      {
        ethProvider: utils.getSignerFromPrivateKey(
          nativeChainUrl,
          PRIVATE_KEY2,
        ),
        chainId: networkId,
      },
      {
        hubAddress: nativeHubAddress,
        isNative: true,
      },
    );
    await iexecRichman.wallet.sendRLC(20, ADDRESS2);
    const initialBalance = await iexec.wallet.checkBalances(ADDRESS2);
    const receiverInitialBalance = await iexec.wallet.checkBalances(ADDRESS3);
    const res = await iexec.wallet.sweep(ADDRESS3);
    const finalBalance = await iexec.wallet.checkBalances(ADDRESS2);
    const receiverFinalBalance = await iexec.wallet.checkBalances(ADDRESS3);
    expect(res.sendNativeTxHash).toMatch(bytes32Regex);
    expect(res.sendERC20TxHash).toBeUndefined();
    expect(initialBalance.wei.gt(new BN(0))).toBe(true);
    expect(initialBalance.nRLC.gt(new BN(0))).toBe(true);
    expect(finalBalance.wei.eq(new BN(0))).toBe(true);
    expect(finalBalance.nRLC.eq(new BN(0))).toBe(true);
    expect(
      receiverFinalBalance.wei
        .sub(initialBalance.wei)
        .eq(receiverInitialBalance.wei),
    ).toBe(true);
    expect(
      receiverFinalBalance.nRLC
        .sub(initialBalance.nRLC)
        .eq(receiverInitialBalance.nRLC),
    ).toBe(true);
  });
});

describe('[account]', () => {
  test('account.checkBalance()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const initialBalance = await iexec.account.checkBalance(ADDRESS);
    expect(initialBalance.stake).toBeInstanceOf(BN);
    expect(initialBalance.locked).toBeInstanceOf(BN);
    await iexec.account.deposit(5);
    const finalBalance = await iexec.account.checkBalance(ADDRESS);
    expect(finalBalance.stake).toBeInstanceOf(BN);
    expect(finalBalance.locked).toBeInstanceOf(BN);
    expect(finalBalance.stake.sub(new BN(5)).eq(initialBalance.stake)).toBe(
      true,
    );
    expect(finalBalance.locked.eq(initialBalance.locked)).toBe(true);
  });
  test.skip('account.checkBridgedBalance()', async () => {
    throw Error('TODO');
  });
  test('account.deposit() (token)', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const accountInitialBalance = await iexec.account.checkBalance(ADDRESS);
    const walletInitialBalance = await iexec.wallet.checkBalances(ADDRESS);
    const res = await iexec.account.deposit(5);
    const accountFinalBalance = await iexec.account.checkBalance(ADDRESS);
    const walletFinalBalance = await iexec.wallet.checkBalances(ADDRESS);
    expect(res.txHash).toMatch(bytes32Regex);
    expect(res.amount).toBe('5');
    expect(
      accountFinalBalance.stake.sub(new BN(5)).eq(accountInitialBalance.stake),
    ).toBe(true);
    expect(
      walletFinalBalance.nRLC.add(new BN(5)).eq(walletInitialBalance.nRLC),
    ).toBe(true);
    expect(accountFinalBalance.locked.eq(accountInitialBalance.locked)).toBe(
      true,
    );
  });
  test('account.deposit() (token, exceed wallet balance)', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const accountInitialBalance = await iexec.account.checkBalance(ADDRESS);
    const walletInitialBalance = await iexec.wallet.checkBalances(ADDRESS);
    const { nRLC } = await iexec.wallet.checkBalances(ADDRESS);
    await expect(iexec.account.deposit(nRLC.add(new BN(1)))).rejects.toThrow(
      Error('Deposit amount exceed wallet balance'),
    );
    const accountFinalBalance = await iexec.account.checkBalance(ADDRESS);
    const walletFinalBalance = await iexec.wallet.checkBalances(ADDRESS);
    expect(accountFinalBalance.stake.eq(accountInitialBalance.stake)).toBe(
      true,
    );
    expect(walletFinalBalance.nRLC.eq(walletInitialBalance.nRLC)).toBe(true);
    expect(accountFinalBalance.locked.eq(accountInitialBalance.locked)).toBe(
      true,
    );
  });
  test('account.deposit() (native)', async () => {
    const signer = utils.getSignerFromPrivateKey(nativeChainUrl, PRIVATE_KEY);
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress: nativeHubAddress,
        isNative: true,
      },
    );
    const accountInitialBalance = await iexec.account.checkBalance(ADDRESS);
    const walletInitialBalance = await iexec.wallet.checkBalances(ADDRESS);
    const res = await iexec.account.deposit(5);
    const accountFinalBalance = await iexec.account.checkBalance(ADDRESS);
    const walletFinalBalance = await iexec.wallet.checkBalances(ADDRESS);
    expect(res.txHash).toMatch(bytes32Regex);
    expect(res.amount).toBe('5');
    expect(
      accountFinalBalance.stake.sub(new BN(5)).eq(accountInitialBalance.stake),
    ).toBe(true);
    expect(
      walletFinalBalance.nRLC.add(new BN(5)).eq(walletInitialBalance.nRLC),
    ).toBe(true);
    expect(accountFinalBalance.locked.eq(accountInitialBalance.locked)).toBe(
      true,
    );
  });
  test('account.deposit() (native, exceed wallet balance)', async () => {
    const signer = utils.getSignerFromPrivateKey(nativeChainUrl, PRIVATE_KEY);
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress: nativeHubAddress,
        isNative: true,
      },
    );
    const accountInitialBalance = await iexec.account.checkBalance(ADDRESS);
    const walletInitialBalance = await iexec.wallet.checkBalances(ADDRESS);
    const { nRLC } = await iexec.wallet.checkBalances(ADDRESS);
    await expect(iexec.account.deposit(nRLC.add(new BN(1)))).rejects.toThrow(
      Error('Deposit amount exceed wallet balance'),
    );
    const accountFinalBalance = await iexec.account.checkBalance(ADDRESS);
    const walletFinalBalance = await iexec.wallet.checkBalances(ADDRESS);
    expect(accountFinalBalance.stake.eq(accountInitialBalance.stake)).toBe(
      true,
    );
    expect(walletFinalBalance.nRLC.eq(walletInitialBalance.nRLC)).toBe(true);
    expect(accountFinalBalance.locked.eq(accountInitialBalance.locked)).toBe(
      true,
    );
  });
  test('account.withdraw() (token)', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    await iexec.account.deposit(10);
    const accountInitialBalance = await iexec.account.checkBalance(ADDRESS);
    const walletInitialBalance = await iexec.wallet.checkBalances(ADDRESS);
    const res = await iexec.account.withdraw(5);
    const accountFinalBalance = await iexec.account.checkBalance(ADDRESS);
    const walletFinalBalance = await iexec.wallet.checkBalances(ADDRESS);
    expect(res.txHash).toMatch(bytes32Regex);
    expect(res.amount).toBe('5');
    expect(
      accountFinalBalance.stake.add(new BN(5)).eq(accountInitialBalance.stake),
    ).toBe(true);
    expect(
      walletFinalBalance.nRLC.sub(new BN(5)).eq(walletInitialBalance.nRLC),
    ).toBe(true);
    expect(accountFinalBalance.locked.eq(accountInitialBalance.locked)).toBe(
      true,
    );
  });
  test('account.deposit() (token, exceed account balance)', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    await iexec.account.deposit(10);
    const accountInitialBalance = await iexec.account.checkBalance(ADDRESS);
    const walletInitialBalance = await iexec.wallet.checkBalances(ADDRESS);
    const { stake } = await iexec.account.checkBalance(ADDRESS);
    await expect(iexec.account.withdraw(stake.add(new BN(1)))).rejects.toThrow(
      Error('Withdraw amount exceed account balance'),
    );
    const accountFinalBalance = await iexec.account.checkBalance(ADDRESS);
    const walletFinalBalance = await iexec.wallet.checkBalances(ADDRESS);
    expect(accountFinalBalance.stake.eq(accountInitialBalance.stake)).toBe(
      true,
    );
    expect(walletFinalBalance.nRLC.eq(walletInitialBalance.nRLC)).toBe(true);
    expect(accountFinalBalance.locked.eq(accountInitialBalance.locked)).toBe(
      true,
    );
  });
  test('account.deposit() (native)', async () => {
    const signer = utils.getSignerFromPrivateKey(nativeChainUrl, PRIVATE_KEY);
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress: nativeHubAddress,
        isNative: true,
      },
    );
    await iexec.account.deposit(10);
    const accountInitialBalance = await iexec.account.checkBalance(ADDRESS);
    const walletInitialBalance = await iexec.wallet.checkBalances(ADDRESS);
    const res = await iexec.account.withdraw(5);
    const accountFinalBalance = await iexec.account.checkBalance(ADDRESS);
    const walletFinalBalance = await iexec.wallet.checkBalances(ADDRESS);
    expect(res.txHash).toMatch(bytes32Regex);
    expect(res.amount).toBe('5');
    expect(
      accountFinalBalance.stake.add(new BN(5)).eq(accountInitialBalance.stake),
    ).toBe(true);
    expect(
      walletFinalBalance.nRLC.sub(new BN(5)).eq(walletInitialBalance.nRLC),
    ).toBe(true);
    expect(accountFinalBalance.locked.eq(accountInitialBalance.locked)).toBe(
      true,
    );
  });
  test('account.deposit() (native, exceed account balance)', async () => {
    const signer = utils.getSignerFromPrivateKey(nativeChainUrl, PRIVATE_KEY);
    const iexec = new IExec(
      {
        ethProvider: signer,
        chainId: networkId,
      },
      {
        hubAddress: nativeHubAddress,
        isNative: true,
      },
    );
    await iexec.account.deposit(10);
    const accountInitialBalance = await iexec.account.checkBalance(ADDRESS);
    const walletInitialBalance = await iexec.wallet.checkBalances(ADDRESS);
    const { stake } = await iexec.account.checkBalance(ADDRESS);
    await expect(iexec.account.withdraw(stake.add(new BN(1)))).rejects.toThrow(
      Error('Withdraw amount exceed account balance'),
    );
    const accountFinalBalance = await iexec.account.checkBalance(ADDRESS);
    const walletFinalBalance = await iexec.wallet.checkBalances(ADDRESS);
    expect(accountFinalBalance.stake.eq(accountInitialBalance.stake)).toBe(
      true,
    );
    expect(walletFinalBalance.nRLC.eq(walletInitialBalance.nRLC)).toBe(true);
    expect(accountFinalBalance.locked.eq(accountInitialBalance.locked)).toBe(
      true,
    );
  });
});

describe('[app]', () => {
  test('app.deployApp()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const app = {
      owner: await iexec.wallet.getAddress(),
      name: `app${getId()}`,
      type: 'DOCKER',
      multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
      checksum:
        '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
      mrenclave: 'abc|123|test',
    };
    const res = await iexec.app.deployApp(app);
    expect(res.txHash).toMatch(bytes32Regex);
    expect(res.address).toMatch(addressRegex);

    await expect(iexec.app.deployApp(app)).rejects.toThrow(
      Error(`App already deployed at address ${res.address}`),
    );
  });
  test('app.showApp()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const app = {
      owner: await iexec.wallet.getAddress(),
      name: `app${getId()}`,
      type: 'DOCKER',
      multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
      checksum:
        '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
      mrenclave: 'abc|123|test',
    };
    const { address } = await iexec.app.deployApp(app);

    const res = await iexec.app.showApp(address);
    expect(res.objAddress).toBe(address);
    expect(res.app.owner).toBe(app.owner);
    expect(res.app.registry).toMatch(addressRegex);
    expect(res.app.appName).toBe(app.name);
    expect(res.app.appType).toBe(app.type);
    expect(res.app.appMultiaddr).toBe(app.multiaddr);
    expect(res.app.appChecksum).toBe(app.checksum);
    expect(res.app.appMREnclave).toBe(app.mrenclave);

    await expect(iexec.app.showApp(utils.NULL_ADDRESS)).rejects.toThrow(
      new errors.ObjectNotFoundError('app', utils.NULL_ADDRESS, networkId),
    );
  });
  test('app.countUserApps()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const userAddress = await iexec.wallet.getAddress();
    const app = {
      owner: userAddress,
      name: `app${getId()}`,
      type: 'DOCKER',
      multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
      checksum:
        '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
      mrenclave: 'abc|123|test',
    };
    const resBeforeDeploy = await iexec.app.countUserApps(userAddress);
    await iexec.app.deployApp(app);
    const res = await iexec.app.countUserApps(userAddress);
    expect(resBeforeDeploy).toBeInstanceOf(BN);
    expect(res).toBeInstanceOf(BN);
    expect(resBeforeDeploy.add(new BN(1)).eq(res)).toBe(true);
  });
  test('app.showUserApp()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const userAddress = await iexec.wallet.getAddress();
    const app = {
      owner: userAddress,
      name: `app${getId()}`,
      type: 'DOCKER',
      multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
      checksum:
        '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
      mrenclave: 'abc|123|test',
    };
    const { address } = await iexec.app.deployApp(app);
    const count = await iexec.app.countUserApps(userAddress);
    const res = await iexec.app.showUserApp(count.sub(new BN(1)), userAddress);
    expect(res.objAddress).toBe(address);
    expect(res.app.owner).toBe(app.owner);
    expect(res.app.registry).toMatch(addressRegex);
    expect(res.app.appName).toBe(app.name);
    expect(res.app.appType).toBe(app.type);
    expect(res.app.appMultiaddr).toBe(app.multiaddr);
    expect(res.app.appChecksum).toBe(app.checksum);
    expect(res.app.appMREnclave).toBe(app.mrenclave);
    await expect(iexec.app.showUserApp(count, userAddress)).rejects.toThrow(
      Error('app not deployed'),
    );
  });
});

describe('[dataset]', () => {
  test('dataset.deployDataset()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const dataset = {
      owner: await iexec.wallet.getAddress(),
      name: `dataset${getId()}`,
      multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
      checksum:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
    };
    const res = await iexec.dataset.deployDataset(dataset);
    expect(res.txHash).toMatch(bytes32Regex);
    expect(res.address).toMatch(addressRegex);

    await expect(iexec.dataset.deployDataset(dataset)).rejects.toThrow(
      Error(`Dataset already deployed at address ${res.address}`),
    );
  });
  test('dataset.showDataset()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const dataset = {
      owner: await iexec.wallet.getAddress(),
      name: `dataset${getId()}`,
      multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
      checksum:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
    };
    const { address } = await iexec.dataset.deployDataset(dataset);

    const res = await iexec.dataset.showDataset(address);
    expect(res.objAddress).toBe(address);
    expect(res.dataset.owner).toBe(dataset.owner);
    expect(res.dataset.registry).toMatch(addressRegex);
    expect(res.dataset.datasetName).toBe(dataset.name);
    expect(res.dataset.datasetMultiaddr).toBe(dataset.multiaddr);
    expect(res.dataset.datasetChecksum).toBe(dataset.checksum);

    await expect(iexec.dataset.showDataset(utils.NULL_ADDRESS)).rejects.toThrow(
      new errors.ObjectNotFoundError('dataset', utils.NULL_ADDRESS, networkId),
    );
  });
  test('dataset.countUserDatasets()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const userAddress = await iexec.wallet.getAddress();
    const dataset = {
      owner: userAddress,
      name: `dataset${getId()}`,
      multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
      checksum:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
    };
    const resBeforeDeploy = await iexec.dataset.countUserDatasets(userAddress);
    await iexec.dataset.deployDataset(dataset);
    const res = await iexec.dataset.countUserDatasets(userAddress);
    expect(resBeforeDeploy).toBeInstanceOf(BN);
    expect(res).toBeInstanceOf(BN);
    expect(resBeforeDeploy.add(new BN(1)).eq(res)).toBe(true);
  });
  test('dataset.showUserDataset()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const userAddress = await iexec.wallet.getAddress();
    const dataset = {
      owner: userAddress,
      name: `dataset${getId()}`,
      multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
      checksum:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
    };
    const { address } = await iexec.dataset.deployDataset(dataset);
    const count = await iexec.dataset.countUserDatasets(userAddress);
    const res = await iexec.dataset.showUserDataset(
      count.sub(new BN(1)),
      userAddress,
    );
    expect(res.objAddress).toBe(address);
    expect(res.dataset.owner).toBe(dataset.owner);
    expect(res.dataset.registry).toMatch(addressRegex);
    expect(res.dataset.datasetName).toBe(dataset.name);
    expect(res.dataset.datasetMultiaddr).toBe(dataset.multiaddr);
    expect(res.dataset.datasetChecksum).toBe(dataset.checksum);
    await expect(
      iexec.dataset.showUserDataset(count, userAddress),
    ).rejects.toThrow(Error('dataset not deployed'));
  });
});

describe('[workerpool]', () => {
  test('workerpool.deployWorkerpool()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const workerpool = {
      owner: await iexec.wallet.getAddress(),
      description: `workerpool${getId()}`,
    };
    const res = await iexec.workerpool.deployWorkerpool(workerpool);
    expect(res.txHash).toMatch(bytes32Regex);
    expect(res.address).toMatch(addressRegex);

    await expect(iexec.workerpool.deployWorkerpool(workerpool)).rejects.toThrow(
      Error(`Workerpool already deployed at address ${res.address}`),
    );
  });
  test('workerpool.showWorkerpool()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const workerpool = {
      owner: await iexec.wallet.getAddress(),
      description: `workerpool${getId()}`,
    };
    const { address } = await iexec.workerpool.deployWorkerpool(workerpool);

    const res = await iexec.workerpool.showWorkerpool(address);
    expect(res.objAddress).toBe(address);
    expect(res.workerpool.owner).toBe(workerpool.owner);
    expect(res.workerpool.registry).toMatch(addressRegex);
    expect(res.workerpool.schedulerRewardRatioPolicy).toBeInstanceOf(BN);
    expect(res.workerpool.workerStakeRatioPolicy).toBeInstanceOf(BN);
    expect(res.workerpool.workerpoolDescription).toBe(workerpool.description);

    await expect(
      iexec.workerpool.showWorkerpool(utils.NULL_ADDRESS),
    ).rejects.toThrow(
      new errors.ObjectNotFoundError(
        'workerpool',
        utils.NULL_ADDRESS,
        networkId,
      ),
    );
  });
  test('workerpool.countUserWorkerpools()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const userAddress = await iexec.wallet.getAddress();
    const workerpool = {
      owner: userAddress,
      description: `workerpool${getId()}`,
    };
    const resBeforeDeploy = await iexec.workerpool.countUserWorkerpools(
      userAddress,
    );
    await iexec.workerpool.deployWorkerpool(workerpool);
    const res = await iexec.workerpool.countUserWorkerpools(userAddress);
    expect(resBeforeDeploy).toBeInstanceOf(BN);
    expect(res).toBeInstanceOf(BN);
    expect(resBeforeDeploy.add(new BN(1)).eq(res)).toBe(true);
  });
  test('workerpool.showUserWorkerpool()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const userAddress = await iexec.wallet.getAddress();
    const workerpool = {
      owner: userAddress,
      description: `workerpool${getId()}`,
    };
    const { address } = await iexec.workerpool.deployWorkerpool(workerpool);
    const count = await iexec.workerpool.countUserWorkerpools(userAddress);
    const res = await iexec.workerpool.showUserWorkerpool(
      count.sub(new BN(1)),
      userAddress,
    );
    expect(res.objAddress).toBe(address);
    expect(res.workerpool.owner).toBe(workerpool.owner);
    expect(res.workerpool.registry).toMatch(addressRegex);
    expect(res.workerpool.schedulerRewardRatioPolicy).toBeInstanceOf(BN);
    expect(res.workerpool.workerStakeRatioPolicy).toBeInstanceOf(BN);
    expect(res.workerpool.workerpoolDescription).toBe(workerpool.description);
    await expect(
      iexec.workerpool.showUserWorkerpool(count, userAddress),
    ).rejects.toThrow(Error('workerpool not deployed'));
  });
});

describe('[order]', () => {
  test('order.hashApporder()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const order = await iexec.order.createApporder({
      app: ADDRESS2,
      appprice: 1,
      volume: 15,
    });

    const res = await iexec.order.hashApporder({
      ...order,
      salt:
        '0x77d3087b2ff82dc336c1add5ad220a32e8b3f46201ad33a7afdb1d6442132e13',
    });
    expect(res).toMatch(bytes32Regex);
    expect(res).toBe(
      '0x383723d2e610b846b811b08beadffc12b01e7a7cdcf5a750f0983f1371b08af4',
    );
  });

  test('order.hashDatasetorder()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const order = await iexec.order.createDatasetorder({
      dataset: ADDRESS2,
      datasetprice: 1,
      volume: 15,
    });

    const res = await iexec.order.hashDatasetorder({
      ...order,
      salt:
        '0x0f4c934f0fb4fa32dcef23ad90a695f94d1e5fca8147016c1c58553d3f20bf6c',
    });
    expect(res).toMatch(bytes32Regex);
    expect(res).toBe(
      '0x442d4287371cfa27bf7e83b6d20d87ee9964115716f119bae38ca374f91b757f',
    );
  });

  test('order.hashWorkerpoolorder()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const order = await iexec.order.createWorkerpoolorder({
      workerpool: ADDRESS2,
      workerpoolprice: 1,
      volume: 15,
      category: 5,
    });

    const res = await iexec.order.hashWorkerpoolorder({
      ...order,
      salt:
        '0x0f4c934f0fb4fa32dcef23ad90a695f94d1e5fca8147016c1c58553d3f20bf6c',
    });
    expect(res).toMatch(bytes32Regex);
    expect(res).toBe(
      '0x3c7b015c660502bc4de2c2ac93e8204b8e0982270415174081fb452e6d571f7c',
    );
  });

  test('order.hashRequestorder()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
      app: ADDRESS2,
      appmaxprice: 1,
      workerpoolmaxprice: 2,
      requester: ADDRESS,
      volume: 15,
      category: 5,
    });

    const res = await iexec.order.hashRequestorder({
      ...order,
      salt:
        '0x0f4c934f0fb4fa32dcef23ad90a695f94d1e5fca8147016c1c58553d3f20bf6c',
    });
    expect(res).toMatch(bytes32Regex);
    expect(res).toBe(
      '0x83db4372c3f4205d7033e02cc6a5ada6867a599a6b6aea09791c0b8971083e73',
    );
  });

  test('order.cancelApporder()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const order = await deployAndGetApporder(iexec);
    const res = await iexec.order.cancelApporder(order);
    expect(res.order).toEqual(order);
    expect(res.txHash).toMatch(bytes32Regex);
    await expect(iexec.order.cancelApporder(order)).rejects.toThrow(
      Error('apporder already canceled'),
    );
  });

  test('order.cancelDatasetorder()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const order = await deployAndGetDatasetorder(iexec);
    const res = await iexec.order.cancelDatasetorder(order);
    expect(res.order).toEqual(order);
    expect(res.txHash).toMatch(bytes32Regex);
    await expect(iexec.order.cancelDatasetorder(order)).rejects.toThrow(
      Error('datasetorder already canceled'),
    );
  });

  test('order.cancelWorkerpoolorder()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const order = await deployAndGetWorkerpoolorder(iexec);
    const res = await iexec.order.cancelWorkerpoolorder(order);
    expect(res.order).toEqual(order);
    expect(res.txHash).toMatch(bytes32Regex);
    await expect(iexec.order.cancelWorkerpoolorder(order)).rejects.toThrow(
      Error('workerpoolorder already canceled'),
    );
  });

  test('order.cancelRequestorder()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const order = await iexec.order
      .createRequestorder({
        app: utils.NULL_ADDRESS,
        appmaxprice: 0,
        workerpoolmaxprice: 0,
        requester: await iexec.wallet.getAddress(),
        volume: 1,
        category: 1,
      })
      .then(iexec.order.signRequestorder);
    const res = await iexec.order.cancelRequestorder(order);
    expect(res.order).toEqual(order);
    expect(res.txHash).toMatch(bytes32Regex);
    await expect(iexec.order.cancelRequestorder(order)).rejects.toThrow(
      Error('requestorder already canceled'),
    );
  });
});

describe('[observables]', () => {
  test('task.obsTask()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
        await initializeTask(tokenChainWallet, hubAddress, dealid, 0);
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

  test('task.obsTask() (task timeout)', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
        initializeTask(tokenChainWallet, hubAddress, dealid, 0);
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

  test('deal.obsDeal()', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
        await initializeTask(tokenChainWallet, hubAddress, dealid, 5);
        await sleep(6000);
        await initializeTask(tokenChainWallet, hubAddress, dealid, 0);
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

  test('deal.obsDeal() (deal timeout)', async () => {
    const signer = utils.getSignerFromPrivateKey(tokenChainUrl, PRIVATE_KEY);
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
    const catid = await createCategory(iexec, { workClockTimeRef: 2 });
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
            unsubObsDealBeforeComplete();
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
      sleep(5000).then(async () => {
        await initializeTask(tokenChainWallet, hubAddress, dealid, 5);
        await sleep(1000);
        await initializeTask(tokenChainWallet, hubAddress, dealid, 0);
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
  }, 50000);
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
  describe('decryptResult', () => {
    test('result.decryptResult()', async () => {
      const encZip = await fs.readFile(
        path.join(
          process.cwd(),
          'test/inputs/encryptedResults/encryptedTeeRes.zip',
        ),
      );
      const beneficiaryKey = await fs.readFile(
        path.join(
          process.cwd(),
          'test/inputs/beneficiaryKeys/0x7bd4783FDCAD405A28052a0d1f11236A741da593_key',
        ),
      );
      const res = await utils.decryptResult(encZip, beneficiaryKey);
      const resContent = [];
      const resZip = await new JSZip().loadAsync(res);
      resZip.forEach((relativePath, zipEntry) => {
        resContent.push(zipEntry);
      });
      expect(resContent.length).toBe(2);
      expect(resContent[0].name).toBe('volume.fspf');
      expect(resContent[1].name).toBe('result.png');
    });
    test('result.decryptResult() string key', async () => {
      const encZip = await fs.readFile(
        path.join(
          process.cwd(),
          'test/inputs/encryptedResults/encryptedTeeRes.zip',
        ),
      );
      const beneficiaryKey = (
        await fs.readFile(
          path.join(
            process.cwd(),
            'test/inputs/beneficiaryKeys/0x7bd4783FDCAD405A28052a0d1f11236A741da593_key',
          ),
        )
      ).toString();
      const res = await utils.decryptResult(encZip, beneficiaryKey);
      const resContent = [];
      const resZip = await new JSZip().loadAsync(res);
      resZip.forEach((relativePath, zipEntry) => {
        resContent.push(zipEntry);
      });
      expect(resContent.length).toBe(2);
      expect(resContent[0].name).toBe('volume.fspf');
      expect(resContent[1].name).toBe('result.png');
    });
    test('result.decryptResult() wrong key', async () => {
      const encZip = await fs.readFile(
        path.join(
          process.cwd(),
          'test/inputs/encryptedResults/encryptedTeeRes.zip',
        ),
      );
      const beneficiaryKey = await fs.readFile(
        path.join(
          process.cwd(),
          'test/inputs/beneficiaryKeys/unexpected_0x7bd4783FDCAD405A28052a0d1f11236A741da593_key',
        ),
      );
      const err = await utils
        .decryptResult(encZip, beneficiaryKey)
        .catch(e => e);
      expect(err).toEqual(
        new Error('Failed to decrypt results key with beneficiary key'),
      );
    });
  });
});
