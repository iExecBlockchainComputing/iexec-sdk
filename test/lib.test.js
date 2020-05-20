const ethers = require('ethers');
const BN = require('bn.js');
const fs = require('fs-extra');
const path = require('path');
const JSZip = require('jszip');
const { utils, IExec, errors } = require('../src/iexec-lib');
const { sleep, bytes32Regex, addressRegex } = require('../src/utils');

console.log('Node version:', process.version);

jest.setTimeout(10000);

// compare object with nested number or string number
expect.extend({
  toLooseEqual(received, target) {
    const stringifyNestedNumbers = (obj) => {
      const objOut = {};
      Object.entries(obj).forEach((e) => {
        const [k, v] = e;
        if (typeof v === 'number') objOut[k] = v.toString();
        else if (typeof v === 'object') {
          objOut[k] = stringifyNestedNumbers(v);
        } else objOut[k] = v;
      });
      return objOut;
    };
    return {
      pass: this.equals(
        stringifyNestedNumbers(received),
        stringifyNestedNumbers(target),
      ),
      message: () => `not loosely equal \nreceived: ${JSON.stringify(
        received,
        null,
        2,
      )}\nexpected: ${JSON.stringify(target, null, 2)}`,
    };
  },
});

// CONFIG
const { DRONE, WITH_STACK } = process.env;
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
// parity node (with ws)
const tokenChainParityUrl = DRONE
  ? 'http://token-chain-parity:8545'
  : 'http://localhost:9545';

const chainGasPrice = '20000000000';
// const nativeChainGasPrice = '0';
let hubAddress;
let nativeHubAddress;
let networkId;

const ADDRESS = '0x7bd4783FDCAD405A28052a0d1f11236A741da593';
// const PUBLIC_KEY = '0x0463b6265f021cc1f249366d5ade5bcdf7d33debe594e9d94affdf1aa02255928490fc2c96990a386499b66d17565de1c12ba8fb4ae3af7539e6c61aa7f0113edd';
const PRIVATE_KEY = '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407';
const POOR_PRIVATE_KEY2 = '0xd0c5f29f0e7ebe1d3217096fb06130e217758c90f361d3c52ea26c2a0ecc99fb';
const POOR_ADDRESS2 = '0x650ae1d365369129c326Cd15Bf91793b52B7cf59';
const POOR_ADDRESS3 = '0xA540FCf5f097c3F996e680F5cb266629600F064A';
// const RICH_ADDRESS2 = '0xdFa2585C16cAf9c853086F36d2A37e9b8d1eab87';
const RICH_PRIVATE_KEY2 = '0xde43b282c2931fc41ca9e1486fedc2c45227a3b9b4115c89d37f6333c8816d89';
// const RICH_ADDRESS3 = '0xbC11Bf07a83c7e04daef3dd5C6F9a046F8c5fA7b';
// const RICH_PRIVATE_KEY3 = '0xfb9d8a917d85d7d9a052745248ecbf6a2268110945004dd797e82e8d4c071e79';

// UTILS

const tokenChainRPC = new ethers.providers.JsonRpcProvider(tokenChainUrl);
const tokenChainRPC1s = new ethers.providers.JsonRpcProvider(tokenChainUrl1s);
const tokenChainWallet = new ethers.Wallet(PRIVATE_KEY, tokenChainRPC);

// const nativeChainRPC = new ethers.providers.JsonRpcProvider(nativeChainUrl);
// const nativeChainWallet = new ethers.Wallet(PRIVATE_KEY, nativeChainRPC);

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

const getRandomWallet = () => {
  const { privateKey, publicKey, address } = ethers.Wallet.createRandom();
  return { privateKey, publicKey, address };
};
const getRandomAddress = () => getRandomWallet().address;

// TESTS
beforeAll(async () => {
  const { chainId } = await tokenChainRPC.getNetwork();
  console.log('chainId', chainId);
  networkId = `${chainId}`;
  hubAddress = '0xC08e9Be37286B7Bbf04875369cf28C21b3F06FCB';
  nativeHubAddress = '0xC08e9Be37286B7Bbf04875369cf28C21b3F06FCB';
  console.log('hubAddress', hubAddress);
  console.log('nativeHubAddress', nativeHubAddress);
}, 15000);

describe('[IExec]', () => {
  test('sms required function throw if no smsURL configured', async () => {
    const randomAddress = getRandomAddress();
    const signer = utils.getSignerFromPrivateKey(
      tokenChainParityUrl,
      PRIVATE_KEY,
    );
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
    expect(() => iexec.dataset.checkDatasetSecretExists(randomAddress)).toThrow(
      Error(
        `smsURL option not set and no default value for your chain ${networkId}`,
      ),
    );
  });
  test('resultProxy required function throw if no resultProxyURL configured', async () => {
    const signer = utils.getSignerFromPrivateKey(
      tokenChainParityUrl,
      PRIVATE_KEY,
    );
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
    expect(() => iexec.storage.defaultStorageLogin()).toThrow(
      Error(
        `resultProxyURL option not set and no default value for your chain ${networkId}`,
      ),
    );
  });
});

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
    expect(showTaskActiveRes.results).toStrictEqual({ storage: 'none' });
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
    const receiver = POOR_ADDRESS2;
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
    const receiver = POOR_ADDRESS2;
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
    const receiver = POOR_ADDRESS2;
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
    const receiver = POOR_ADDRESS2;
    const nonceProvider = await (async (address) => {
      const initNonce = ethers.utils.bigNumberify(
        await tokenChainRPC1s.send('eth_getTransactionCount', [
          address,
          'latest',
        ]),
      );
      let i = 0;
      const getNonce = () => {
        const nonce = initNonce.add(ethers.utils.bigNumberify(i)).toHexString();
        i += 1;
        return nonce;
      };
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
    const receiverInitialBalance = await iexec.wallet.checkBalances(
      POOR_ADDRESS3,
    );
    const txHash = await iexec.wallet.sendETH(5, POOR_ADDRESS3);
    const finalBalance = await iexec.wallet.checkBalances(ADDRESS);
    const receiverFinalBalance = await iexec.wallet.checkBalances(
      POOR_ADDRESS3,
    );
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
    await expect(iexec.wallet.sendETH(10, POOR_ADDRESS3)).rejects.toThrow(
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
    const receiverInitialBalance = await iexec.wallet.checkBalances(
      POOR_ADDRESS3,
    );
    const txHash = await iexec.wallet.sendRLC(5, POOR_ADDRESS3);
    const finalBalance = await iexec.wallet.checkBalances(ADDRESS);
    const receiverFinalBalance = await iexec.wallet.checkBalances(
      POOR_ADDRESS3,
    );
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
    const receiverInitialBalance = await iexec.wallet.checkBalances(
      POOR_ADDRESS3,
    );
    const txHash = await iexec.wallet.sendRLC(5, POOR_ADDRESS3);
    const finalBalance = await iexec.wallet.checkBalances(ADDRESS);
    const receiverFinalBalance = await iexec.wallet.checkBalances(
      POOR_ADDRESS3,
    );
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
        ethProvider: utils.getSignerFromPrivateKey(
          tokenChainUrl,
          POOR_PRIVATE_KEY2,
        ),
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    await iexecRichman.wallet.sendETH('10000000000000000', POOR_ADDRESS2);
    await iexecRichman.wallet.sendRLC(20, POOR_ADDRESS2);
    const initialBalance = await iexec.wallet.checkBalances(POOR_ADDRESS2);
    const receiverInitialBalance = await iexec.wallet.checkBalances(
      POOR_ADDRESS3,
    );
    const res = await iexec.wallet.sweep(POOR_ADDRESS3);
    const finalBalance = await iexec.wallet.checkBalances(POOR_ADDRESS2);
    const receiverFinalBalance = await iexec.wallet.checkBalances(
      POOR_ADDRESS3,
    );
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
        ethProvider: utils.getSignerFromPrivateKey(
          tokenChainUrl,
          POOR_PRIVATE_KEY2,
        ),
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    await iexecRichman.wallet.sendETH(100, POOR_ADDRESS2);
    await iexecRichman.wallet.sendRLC(20, POOR_ADDRESS2);
    const initialBalance = await iexec.wallet.checkBalances(POOR_ADDRESS2);
    const receiverInitialBalance = await iexec.wallet.checkBalances(
      POOR_ADDRESS3,
    );
    await expect(iexec.wallet.sweep(POOR_ADDRESS3)).rejects.toThrow(
      Error(
        `Failed to sweep ERC20, sweep aborted. errors: Failed to transfert ERC20': sender doesn't have enough funds to send tx. The upfront cost is: 725180000000000 and the sender's account only has: ${initialBalance.wei.toString()}`,
      ),
    );
    const finalBalance = await iexec.wallet.checkBalances(POOR_ADDRESS2);
    const receiverFinalBalance = await iexec.wallet.checkBalances(
      POOR_ADDRESS3,
    );
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
        ethProvider: utils.getSignerFromPrivateKey(
          tokenChainUrl,
          POOR_PRIVATE_KEY2,
        ),
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );
    await iexecRichman.wallet.sendETH('725180000000100', POOR_ADDRESS2);
    await iexecRichman.wallet.sendRLC(20, POOR_ADDRESS2);
    const initialBalance = await iexec.wallet.checkBalances(POOR_ADDRESS2);
    const receiverInitialBalance = await iexec.wallet.checkBalances(
      POOR_ADDRESS3,
    );
    const res = await iexec.wallet.sweep(POOR_ADDRESS3);
    const finalBalance = await iexec.wallet.checkBalances(POOR_ADDRESS2);
    const receiverFinalBalance = await iexec.wallet.checkBalances(
      POOR_ADDRESS3,
    );
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
          POOR_PRIVATE_KEY2,
        ),
        chainId: networkId,
      },
      {
        hubAddress: nativeHubAddress,
        isNative: true,
      },
    );
    await iexecRichman.wallet.sendRLC(20, POOR_ADDRESS2);
    const initialBalance = await iexec.wallet.checkBalances(POOR_ADDRESS2);
    const receiverInitialBalance = await iexec.wallet.checkBalances(
      POOR_ADDRESS3,
    );
    const res = await iexec.wallet.sweep(POOR_ADDRESS3);
    const finalBalance = await iexec.wallet.checkBalances(POOR_ADDRESS2);
    const receiverFinalBalance = await iexec.wallet.checkBalances(
      POOR_ADDRESS3,
    );
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
  test('account.withdraw() (token, exceed account balance)', async () => {
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
  test('account.withdraw() (native)', async () => {
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
  test('account.withdraw() (native, exceed account balance)', async () => {
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
  test('account.withdraw() (withdraw amount 0)', async () => {
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
    await expect(iexec.account.withdraw(0)).rejects.toThrow(
      Error('Withdraw amount must be greather than 0'),
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
  if (WITH_STACK) {
    // this test requires nexus.iex.ec image
    test('dataset.pushDatasetSecret()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const smsURL = DRONE ? 'http://token-sms:5000' : 'http://localhost:5000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          smsURL,
        },
      );
      const datasetDeployRes = await iexec.dataset.deployDataset({
        owner: await iexec.wallet.getAddress(),
        name: `dataset${getId()}`,
        multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
        checksum:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      });
      const datasetAddress = datasetDeployRes.address;
      const pushRes = await iexec.dataset.pushDatasetSecret(
        datasetAddress,
        'oops',
      );
      expect(pushRes).toBe(true);
      await expect(
        iexec.dataset.pushDatasetSecret(datasetAddress, 'oops'),
      ).rejects.toThrow(
        Error(
          `Secret already exists for ${datasetAddress} and can't be updated`,
        ),
      );
    });
    test('dataset.pushDatasetSecret() (not deployed)', async () => {
      const randomAddress = getRandomAddress();
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const smsURL = DRONE ? 'http://token-sms:5000' : 'http://localhost:5000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          smsURL,
        },
      );
      await expect(
        iexec.dataset.pushDatasetSecret(randomAddress, 'oops'),
      ).rejects.toThrow(
        Error(
          `Wallet ${ADDRESS} is not allowed to set secret for ${randomAddress}`,
        ),
      );
    });
    test('dataset.pushDatasetSecret() (invalid owner)', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const smsURL = DRONE ? 'http://token-sms:5000' : 'http://localhost:5000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          smsURL,
        },
      );
      const datasetDeployRes = await iexec.dataset.deployDataset({
        owner: POOR_ADDRESS2,
        name: `dataset${getId()}`,
        multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
        checksum:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      });
      const datasetAddress = datasetDeployRes.address;
      await expect(
        iexec.dataset.pushDatasetSecret(datasetAddress, 'oops'),
      ).rejects.toThrow(
        Error(
          `Wallet ${ADDRESS} is not allowed to set secret for ${datasetAddress}`,
        ),
      );
    });
    test('dataset.pushDatasetSecret() (fail with self signed certificates)', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const smsURL = DRONE ? 'https://token-sms' : 'https://localhost:5443';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          smsURL,
        },
      );
      const datasetDeployRes = await iexec.dataset.deployDataset({
        owner: await iexec.wallet.getAddress(),
        name: `dataset${getId()}`,
        multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
        checksum:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      });
      const datasetAddress = datasetDeployRes.address;
      await expect(
        iexec.dataset.pushDatasetSecret(datasetAddress, 'oops'),
      ).rejects.toThrow(Error(`SMS at ${smsURL} didn't answered`));
    });
    test('dataset.checkDatasetSecretExists()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const smsURL = DRONE ? 'http://token-sms:5000' : 'http://localhost:5000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          smsURL,
        },
      );
      const datasetDeployRes = await iexec.dataset.deployDataset({
        owner: await iexec.wallet.getAddress(),
        name: `dataset${getId()}`,
        multiaddr: '/p2p/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
        checksum:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      });
      const datasetAddress = datasetDeployRes.address;
      const withoutSecretRes = await iexec.dataset.checkDatasetSecretExists(
        datasetAddress,
      );
      expect(withoutSecretRes).toBe(false);
      await iexec.dataset.pushDatasetSecret(datasetAddress, 'oops');
      const withSecretRes = await iexec.dataset.checkDatasetSecretExists(
        datasetAddress,
      );
      expect(withSecretRes).toBe(true);
    });
  }
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
      app: POOR_ADDRESS2,
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
      dataset: POOR_ADDRESS2,
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
      workerpool: POOR_ADDRESS2,
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
      app: POOR_ADDRESS2,
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

  test('order.matchOrders()', async () => {
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
    const poolManagerSigner = utils.getSignerFromPrivateKey(
      tokenChainUrl,
      RICH_PRIVATE_KEY2,
    );
    const iexecPoolManager = new IExec(
      {
        ethProvider: poolManagerSigner,
        chainId: networkId,
      },
      {
        hubAddress,
        isNative: false,
      },
    );

    const apporderTemplate = await deployAndGetApporder(iexec);
    const datasetorderTemplate = await deployAndGetDatasetorder(iexec);
    const workerpoolorderTemplate = await deployAndGetWorkerpoolorder(
      iexecPoolManager,
    );
    const requestorderTemplate = await getMatchableRequestorder(iexec, {
      apporder: apporderTemplate,
      datasetorder: datasetorderTemplate,
      workerpoolorder: workerpoolorderTemplate,
    });

    // resouce not deployed
    const apporderNotDeployed = { ...apporderTemplate, app: POOR_ADDRESS3 };
    await expect(
      iexec.order.matchOrders({
        apporder: apporderNotDeployed,
        datasetorder: datasetorderTemplate,
        workerpoolorder: workerpoolorderTemplate,
        requestorder: requestorderTemplate,
      }),
    ).rejects.toThrow(Error(`No app deployed at address ${POOR_ADDRESS3}`));
    const datasetorderNotDeployed = {
      ...datasetorderTemplate,
      dataset: POOR_ADDRESS3,
    };
    await expect(
      iexec.order.matchOrders({
        apporder: apporderTemplate,
        datasetorder: datasetorderNotDeployed,
        workerpoolorder: workerpoolorderTemplate,
        requestorder: requestorderTemplate,
      }),
    ).rejects.toThrow(Error(`No dataset deployed at address ${POOR_ADDRESS3}`));
    const workerpoolorderNotDeployed = {
      ...workerpoolorderTemplate,
      workerpool: POOR_ADDRESS3,
    };
    await expect(
      iexec.order.matchOrders({
        apporder: apporderTemplate,
        datasetorder: datasetorderTemplate,
        workerpoolorder: workerpoolorderNotDeployed,
        requestorder: requestorderTemplate,
      }),
    ).rejects.toThrow(
      Error(`No workerpool deployed at address ${POOR_ADDRESS3}`),
    );
    // invalid sign
    const apporderInvalidSign = {
      ...apporderTemplate,
      sign:
        '0xa1d59ea4f4ed84ed1c2fcbdb217f22d64180d95ccaed3268bdfef796ff7f5fa50c2d4c83bf7465afbd9ca292c433495eb573d1f8bcca585cb107b047c899dcb81c',
    };
    await expect(
      iexec.order.matchOrders({
        apporder: apporderInvalidSign,
        datasetorder: datasetorderTemplate,
        workerpoolorder: workerpoolorderTemplate,
        requestorder: requestorderTemplate,
      }),
    ).rejects.toThrow(Error('apporder invalid sign'));
    const datasetorderInvalidSign = {
      ...datasetorderTemplate,
      sign:
        '0xa1d59ea4f4ed84ed1c2fcbdb217f22d64180d95ccaed3268bdfef796ff7f5fa50c2d4c83bf7465afbd9ca292c433495eb573d1f8bcca585cb107b047c899dcb81c',
    };
    await expect(
      iexec.order.matchOrders({
        apporder: apporderTemplate,
        datasetorder: datasetorderInvalidSign,
        workerpoolorder: workerpoolorderTemplate,
        requestorder: requestorderTemplate,
      }),
    ).rejects.toThrow(Error('datasetorder invalid sign'));
    const workerpoolorderInvalidSign = {
      ...workerpoolorderTemplate,
      sign:
        '0xa1d59ea4f4ed84ed1c2fcbdb217f22d64180d95ccaed3268bdfef796ff7f5fa50c2d4c83bf7465afbd9ca292c433495eb573d1f8bcca585cb107b047c899dcb81c',
    };
    await expect(
      iexec.order.matchOrders({
        apporder: apporderTemplate,
        datasetorder: datasetorderTemplate,
        workerpoolorder: workerpoolorderInvalidSign,
        requestorder: requestorderTemplate,
      }),
    ).rejects.toThrow(Error('workerpoolorder invalid sign'));
    const requestorderInvalidSign = {
      ...requestorderTemplate,
      sign:
        '0xa1d59ea4f4ed84ed1c2fcbdb217f22d64180d95ccaed3268bdfef796ff7f5fa50c2d4c83bf7465afbd9ca292c433495eb573d1f8bcca585cb107b047c899dcb81c',
    };
    await expect(
      iexec.order.matchOrders({
        apporder: apporderTemplate,
        datasetorder: datasetorderTemplate,
        workerpoolorder: workerpoolorderTemplate,
        requestorder: requestorderInvalidSign,
      }),
    ).rejects.toThrow(Error('requestorder invalid sign'));

    // address mismatch
    const apporderAddressMismatch = await deployAndGetApporder(iexec);
    await expect(
      iexec.order.matchOrders({
        apporder: apporderAddressMismatch,
        datasetorder: datasetorderTemplate,
        workerpoolorder: workerpoolorderTemplate,
        requestorder: requestorderTemplate,
      }),
    ).rejects.toThrow(
      Error(
        `app address mismatch between requestorder (${requestorderTemplate.app}) and apporder (${apporderAddressMismatch.app})`,
      ),
    );
    const datasetorderAddressMismatch = await deployAndGetDatasetorder(iexec);
    await expect(
      iexec.order.matchOrders({
        apporder: apporderTemplate,
        datasetorder: datasetorderAddressMismatch,
        workerpoolorder: workerpoolorderTemplate,
        requestorder: requestorderTemplate,
      }),
    ).rejects.toThrow(
      Error(
        `dataset address mismatch between requestorder (${requestorderTemplate.dataset}) and datasetorder (${datasetorderAddressMismatch.dataset})`,
      ),
    );
    const workerpoolorderAddressMismatch = await deployAndGetWorkerpoolorder(
      iexec,
    );
    await expect(
      iexec.order.matchOrders({
        apporder: apporderTemplate,
        datasetorder: datasetorderTemplate,
        workerpoolorder: workerpoolorderAddressMismatch,
        requestorder: requestorderTemplate,
      }),
    ).rejects.toThrow(
      Error(
        `workerpool address mismatch between requestorder (${requestorderTemplate.workerpool}) and workerpoolorder (${workerpoolorderAddressMismatch.workerpool})`,
      ),
    );
    // category check
    const workerpoolorderCategoryMismatch = await iexecPoolManager.order.signWorkerpoolorder(
      { ...workerpoolorderTemplate, category: 2 },
    );
    await expect(
      iexec.order.matchOrders({
        apporder: apporderTemplate,
        datasetorder: datasetorderTemplate,
        workerpoolorder: workerpoolorderCategoryMismatch,
        requestorder: requestorderTemplate,
      }),
    ).rejects.toThrow(
      Error(
        `category mismatch between requestorder (${requestorderTemplate.category}) and workerpoolorder (${workerpoolorderCategoryMismatch.category})`,
      ),
    );
    // trust check
    const workerpoolorderTrustZero = await iexecPoolManager.order.signWorkerpoolorder(
      { ...workerpoolorderTemplate, trust: 0 },
    );
    // const requestorderTrustOne = await iexec.order.signRequestorder(
    //   { ...requestorderTemplate, trust: 1 },
    // );
    const requestorderTrustTooHigh = await iexec.order.signRequestorder({
      ...requestorderTemplate,
      trust: 2,
    });
    await expect(
      iexec.order.matchOrders({
        apporder: apporderTemplate,
        datasetorder: datasetorderTemplate,
        workerpoolorder: workerpoolorderTrustZero,
        requestorder: requestorderTrustTooHigh,
      }),
    ).rejects.toThrow(
      Error(
        `workerpoolorder trust is too low (expected ${requestorderTrustTooHigh.trust}, got ${workerpoolorderTrustZero.trust})`,
      ),
    );

    // workerpool tag check
    const requestorderTagTeeGpu = await iexec.order.signRequestorder({
      ...requestorderTemplate,
      tag: utils.encodeTag(['tee', 'gpu']),
    });
    const workerpoolorderTagGpu = await iexecPoolManager.order.signWorkerpoolorder(
      { ...workerpoolorderTemplate, tag: utils.encodeTag(['gpu']) },
    );
    const workerpoolorderTagTee = await iexecPoolManager.order.signWorkerpoolorder(
      { ...workerpoolorderTemplate, tag: utils.encodeTag(['tee']) },
    );
    await expect(
      iexec.order.matchOrders({
        apporder: apporderTemplate,
        datasetorder: datasetorderTemplate,
        workerpoolorder: workerpoolorderTagGpu,
        requestorder: requestorderTagTeeGpu,
      }),
    ).rejects.toThrow(Error('Missing tags [tee] in workerpoolorder'));
    const apporderTagGpu = await iexec.order.signApporder({
      ...apporderTemplate,
      tag: utils.encodeTag(['gpu']),
    });
    await expect(
      iexec.order.matchOrders({
        apporder: apporderTagGpu,
        datasetorder: datasetorderTemplate,
        workerpoolorder: workerpoolorderTagTee,
        requestorder: requestorderTemplate,
      }),
    ).rejects.toThrow(Error('Missing tags [gpu] in workerpoolorder'));
    const datasetorderTagTeeGpu = await iexec.order.signDatasetorder({
      ...datasetorderTemplate,
      tag: utils.encodeTag(['gpu', 'tee']),
    });
    await expect(
      iexec.order.matchOrders({
        apporder: apporderTemplate,
        datasetorder: datasetorderTagTeeGpu,
        workerpoolorder: workerpoolorderTagTee,
        requestorder: requestorderTemplate,
      }),
    ).rejects.toThrow(Error('Missing tags [gpu] in workerpoolorder'));
    // app tag check
    const datasetorderTagTee = await iexec.order.signDatasetorder({
      ...datasetorderTemplate,
      tag: utils.encodeTag(['tee']),
    });
    await expect(
      iexec.order.matchOrders({
        apporder: apporderTemplate,
        datasetorder: datasetorderTagTee,
        workerpoolorder: workerpoolorderTagTee,
        requestorder: requestorderTemplate,
      }),
    ).rejects.toThrow(Error('Missing tag [tee] in apporder'));
    // price check
    const apporderTooExpensive = await iexec.order.signApporder({
      ...apporderTemplate,
      appprice: 1,
    });
    await expect(
      iexec.order.matchOrders({
        apporder: apporderTooExpensive,
        datasetorder: datasetorderTemplate,
        workerpoolorder: workerpoolorderTemplate,
        requestorder: requestorderTemplate,
      }),
    ).rejects.toThrow(
      Error(
        `appmaxprice too low (expected ${apporderTooExpensive.appprice}, got ${requestorderTemplate.appmaxprice})`,
      ),
    );

    const datasetorderTooExpensive = await iexec.order.signDatasetorder({
      ...datasetorderTemplate,
      datasetprice: 1,
    });
    await expect(
      iexec.order.matchOrders({
        apporder: apporderTemplate,
        datasetorder: datasetorderTooExpensive,
        workerpoolorder: workerpoolorderTemplate,
        requestorder: requestorderTemplate,
      }),
    ).rejects.toThrow(
      Error(
        `datasetmaxprice too low (expected ${datasetorderTooExpensive.datasetprice}, got ${requestorderTemplate.datasetmaxprice})`,
      ),
    );

    const workerpoolorderTooExpensive = await iexecPoolManager.order.signWorkerpoolorder(
      {
        ...workerpoolorderTemplate,
        workerpoolprice: 1,
      },
    );
    await expect(
      iexec.order.matchOrders({
        apporder: apporderTemplate,
        datasetorder: datasetorderTemplate,
        workerpoolorder: workerpoolorderTooExpensive,
        requestorder: requestorderTemplate,
      }),
    ).rejects.toThrow(
      Error(
        `workerpoolmaxprice too low (expected ${workerpoolorderTooExpensive.workerpoolprice}, got ${requestorderTemplate.workerpoolmaxprice})`,
      ),
    );
    // volumes checks
    const apporderCanceled = await iexec.order
      .signApporder(apporderTemplate)
      .then(async (order) => {
        await iexec.order.cancelApporder(order);
        return order;
      });
    await expect(
      iexec.order.matchOrders({
        apporder: apporderCanceled,
        datasetorder: datasetorderTemplate,
        workerpoolorder: workerpoolorderTemplate,
        requestorder: requestorderTemplate,
      }),
    ).rejects.toThrow(Error('apporder is fully consumed'));

    const datasetorderCanceled = await iexec.order
      .signDatasetorder(datasetorderTemplate)
      .then(async (order) => {
        await iexec.order.cancelDatasetorder(order);
        return order;
      });
    await expect(
      iexec.order.matchOrders({
        apporder: apporderTemplate,
        datasetorder: datasetorderCanceled,
        workerpoolorder: workerpoolorderTemplate,
        requestorder: requestorderTemplate,
      }),
    ).rejects.toThrow(Error('datasetorder is fully consumed'));

    const workerpoolorderCanceled = await iexecPoolManager.order
      .signWorkerpoolorder(workerpoolorderTemplate)
      .then(async (order) => {
        await iexecPoolManager.order.cancelWorkerpoolorder(order);
        return order;
      });
    await expect(
      iexec.order.matchOrders({
        apporder: apporderTemplate,
        datasetorder: datasetorderTemplate,
        workerpoolorder: workerpoolorderCanceled,
        requestorder: requestorderTemplate,
      }),
    ).rejects.toThrow(Error('workerpoolorder is fully consumed'));

    const requestorderCanceled = await iexec.order
      .signRequestorder(requestorderTemplate)
      .then(async (order) => {
        await iexec.order.cancelRequestorder(order);
        return order;
      });
    await expect(
      iexec.order.matchOrders({
        apporder: apporderTemplate,
        datasetorder: datasetorderTemplate,
        workerpoolorder: workerpoolorderTemplate,
        requestorder: requestorderCanceled,
      }),
    ).rejects.toThrow(Error('requestorder is fully consumed'));

    // requester account stake check
    const balance = await iexec.account.checkBalance(
      await iexec.wallet.getAddress(),
    );
    await iexec.account.withdraw(balance.stake).catch(() => {});
    await iexec.account.deposit(5);

    const apporder3nRlc = await iexec.order.signApporder({
      ...apporderTemplate,
      appprice: 3,
    });
    const datasetorder2nRlc = await iexec.order.signDatasetorder({
      ...datasetorderTemplate,
      datasetprice: 2,
    });
    const workerpoolorder1nRlc = await iexecPoolManager.order.signWorkerpoolorder(
      { ...workerpoolorderTemplate, workerpoolprice: 1 },
    );
    const requestorder300nRlc = await iexec.order.signRequestorder({
      ...requestorderTemplate,
      appmaxprice: 100,
      datasetmaxprice: 100,
      workerpoolmaxprice: 100,
    });
    await expect(
      iexec.order.matchOrders({
        apporder: apporder3nRlc,
        datasetorder: datasetorder2nRlc,
        workerpoolorder: workerpoolorder1nRlc,
        requestorder: requestorder300nRlc,
      }),
    ).rejects.toThrow(
      Error(
        "Cost per task (6) is greather than requester account stake (5). Orders can't be matched. If you are the requester, you should deposit to top up your account",
      ),
    );

    // workerpool owner stake check
    const workerpoolorder7nRlc = await iexecPoolManager.order.signWorkerpoolorder(
      { ...workerpoolorderTemplate, workerpoolprice: 7 },
    );
    await iexec.account.deposit(10);
    const poolManagerBalance = await iexecPoolManager.account.checkBalance(
      await iexecPoolManager.wallet.getAddress(),
    );
    await iexecPoolManager.account
      .withdraw(poolManagerBalance.stake)
      .catch(() => {});
    await iexec.wallet.sendRLC(1, await iexecPoolManager.wallet.getAddress());
    await iexecPoolManager.account.deposit(1);
    await expect(
      iexec.order.matchOrders({
        apporder: apporder3nRlc,
        datasetorder: datasetorder2nRlc,
        workerpoolorder: workerpoolorder7nRlc,
        requestorder: requestorder300nRlc,
      }),
    ).rejects.toThrow(
      Error(
        "workerpool required stake (2) is greather than workerpool owner's account stake (1). Orders can't be matched. If you are the workerpool owner, you should deposit to top up your account",
      ),
    );

    // standard case
    const res = await iexec.order.matchOrders({
      apporder: apporderTemplate,
      datasetorder: datasetorderTemplate,
      workerpoolorder: workerpoolorderTemplate,
      requestorder: requestorderTemplate,
    });
    expect(res.txHash).toMatch(bytes32Regex);
    expect(res.volume).toBeInstanceOf(BN);
    expect(res.volume.eq(new BN(1))).toBe(true);
    expect(res.dealid).toMatch(bytes32Regex);
  }, 60000);

  if (WITH_STACK) {
    // this test requires running local stack
    test('order.publishApporder()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
      const apporder = await deployAndGetApporder(iexec);
      const orderHash = await iexec.order.publishApporder(apporder);
      expect(orderHash).toMatch(bytes32Regex);
    });
    test('order.publishDatasetorder()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
      const datasetorder = await deployAndGetDatasetorder(iexec);
      const orderHash = await iexec.order.publishDatasetorder(datasetorder);
      expect(orderHash).toMatch(bytes32Regex);
    });
    test('order.publishWorkerpoolorder()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
      const workerpoolorder = await deployAndGetWorkerpoolorder(iexec);
      const orderHash = await iexec.order.publishWorkerpoolorder(
        workerpoolorder,
      );
      expect(orderHash).toMatch(bytes32Regex);
    });
    test('order.publishRequestorder()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
      const apporder = await deployAndGetApporder(iexec);
      await iexec.order.publishApporder(apporder);
      const requestorder = await iexec.order
        .createRequestorder({
          requester: await iexec.wallet.getAddress(),
          app: apporder.app,
          appmaxprice: apporder.appprice,
          dataset: utils.NULL_ADDRESS,
          datasetmaxprice: 0,
          workerpool: utils.NULL_ADDRESS,
          workerpoolmaxprice: 0,
          category: 1,
          trust: 0,
          volume: 1,
        })
        .then(iexec.order.signRequestorder);
      const orderHash = await iexec.order.publishRequestorder(requestorder);
      expect(orderHash).toMatch(bytes32Regex);
    });
    test('order.unpublishApporder()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
      const apporder = await deployAndGetApporder(iexec);
      const orderHash = await iexec.order.publishApporder(apporder);
      const unpublishRes = await iexec.order.unpublishApporder(orderHash);
      expect(unpublishRes).toBe(orderHash);
      await expect(iexec.order.unpublishApporder(orderHash)).rejects.toThrow(
        Error(
          `API error: apporder with orderHash ${orderHash} is not published`,
        ),
      );
    });
    test('order.unpublishDatasetorder()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
      const datasetorder = await deployAndGetDatasetorder(iexec);
      const orderHash = await iexec.order.publishDatasetorder(datasetorder);
      const unpublishRes = await iexec.order.unpublishDatasetorder(orderHash);
      expect(unpublishRes).toBe(orderHash);
      await expect(
        iexec.order.unpublishDatasetorder(orderHash),
      ).rejects.toThrow(
        Error(
          `API error: datasetorder with orderHash ${orderHash} is not published`,
        ),
      );
    });
    test('order.unpublishWorkerpoolorder()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
      const workerpoolorder = await deployAndGetWorkerpoolorder(iexec);
      const orderHash = await iexec.order.publishWorkerpoolorder(
        workerpoolorder,
      );
      const unpublishRes = await iexec.order.unpublishWorkerpoolorder(
        orderHash,
      );
      expect(unpublishRes).toBe(orderHash);
      await expect(
        iexec.order.unpublishWorkerpoolorder(orderHash),
      ).rejects.toThrow(
        Error(
          `API error: workerpoolorder with orderHash ${orderHash} is not published`,
        ),
      );
    });
    test('order.unpublishRequestorder()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
      const apporder = await deployAndGetApporder(iexec);
      await iexec.order.publishApporder(apporder);
      const requestorder = await iexec.order
        .createRequestorder({
          requester: await iexec.wallet.getAddress(),
          app: apporder.app,
          appmaxprice: apporder.appprice,
          dataset: utils.NULL_ADDRESS,
          datasetmaxprice: 0,
          workerpool: utils.NULL_ADDRESS,
          workerpoolmaxprice: 0,
          category: 1,
          trust: 0,
          volume: 1,
        })
        .then(iexec.order.signRequestorder);
      const orderHash = await iexec.order.publishRequestorder(requestorder);
      const unpublishRes = await iexec.order.unpublishRequestorder(orderHash);
      expect(unpublishRes).toBe(orderHash);
      await expect(
        iexec.order.unpublishRequestorder(orderHash),
      ).rejects.toThrow(
        Error(
          `API error: requestorder with orderHash ${orderHash} is not published`,
        ),
      );
    }, 10000);
  }
});

describe('[orderbook]', () => {
  if (WITH_STACK) {
    // this test requires running local stack
    test('orderbook.fetchApporder()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
      const apporder = await deployAndGetApporder(iexec);
      const orderHash = await iexec.order.hashApporder(apporder);
      await expect(iexec.orderbook.fetchApporder(orderHash)).rejects.toThrow(
        Error(`No apporder found for id ${orderHash} on chain ${networkId}`),
      );
      await iexec.order.publishApporder(apporder);
      const found = await iexec.orderbook.fetchApporder(orderHash);
      expect(found.order).toLooseEqual(apporder);
      expect(found.status).toBe('open');
      expect(found.remaining).toBe(1);
      expect(found.publicationTimestamp).toBeDefined();
    });
    test('orderbook.fetchDatasetorder()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
      const datasetorder = await deployAndGetDatasetorder(iexec);
      const orderHash = await iexec.order.hashDatasetorder(datasetorder);
      await expect(
        iexec.orderbook.fetchDatasetorder(orderHash),
      ).rejects.toThrow(
        Error(
          `No datasetorder found for id ${orderHash} on chain ${networkId}`,
        ),
      );
      await iexec.order.publishDatasetorder(datasetorder);
      const found = await iexec.orderbook.fetchDatasetorder(orderHash);
      expect(found.order).toLooseEqual(datasetorder);
      expect(found.status).toBe('open');
      expect(found.remaining).toBe(1);
      expect(found.publicationTimestamp).toBeDefined();
    });
    test('orderbook.fetchWorkerpoolorder()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
      const workerpoolorder = await deployAndGetWorkerpoolorder(iexec);
      const orderHash = await iexec.order.hashWorkerpoolorder(workerpoolorder);
      await expect(
        iexec.orderbook.fetchWorkerpoolorder(orderHash),
      ).rejects.toThrow(
        Error(
          `No workerpoolorder found for id ${orderHash} on chain ${networkId}`,
        ),
      );
      await iexec.order.publishWorkerpoolorder(workerpoolorder);
      const found = await iexec.orderbook.fetchWorkerpoolorder(orderHash);
      expect(found.order).toLooseEqual(workerpoolorder);
      expect(found.status).toBe('open');
      expect(found.remaining).toBe(1);
      expect(found.publicationTimestamp).toBeDefined();
    });
    test('orderbook.fetchRequestorder()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
      const apporder = await deployAndGetApporder(iexec);
      await iexec.order.publishApporder(apporder);
      const requestorder = await iexec.order
        .createRequestorder({
          requester: await iexec.wallet.getAddress(),
          app: apporder.app,
          appmaxprice: apporder.appprice,
          dataset: utils.NULL_ADDRESS,
          datasetmaxprice: 0,
          workerpool: utils.NULL_ADDRESS,
          workerpoolmaxprice: 0,
          category: 1,
          trust: 0,
          volume: 1,
        })
        .then(iexec.order.signRequestorder);
      const orderHash = await iexec.order.hashRequestorder(requestorder);
      await expect(
        iexec.orderbook.fetchRequestorder(orderHash),
      ).rejects.toThrow(
        Error(
          `No requestorder found for id ${orderHash} on chain ${networkId}`,
        ),
      );
      await iexec.order.publishRequestorder(requestorder);
      const found = await iexec.orderbook.fetchRequestorder(orderHash);
      expect(found.order).toLooseEqual(requestorder);
      expect(found.status).toBe('open');
      expect(found.remaining).toBe(1);
      expect(found.publicationTimestamp).toBeDefined();
    });
    test('orderbook.fetchAppOrderbook()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
      const appAddress = getRandomAddress();
      const res = await iexec.orderbook.fetchAppOrderbook(appAddress);
      expect(res.count).toBe(0);
      expect(res.appOrders).toStrictEqual([]);
    });
    test('orderbook.fetchDatasetOrderbook()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
      const datasetAddress = getRandomAddress();
      const res = await iexec.orderbook.fetchDatasetOrderbook(datasetAddress);
      expect(res.count).toBe(0);
      expect(res.datasetOrders).toStrictEqual([]);
    });
    test('orderbook.fetchWorkerpoolOrderbook()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
      const res = await iexec.orderbook.fetchWorkerpoolOrderbook(2);
      expect(res.count).toBe(0);
      expect(res.workerpoolOrders).toStrictEqual([]);
    });
    test('orderbook.fetchRequestOrderbook()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
      const res = await iexec.orderbook.fetchRequestOrderbook(2);
      expect(res.count).toBe(0);
      expect(res.requestOrders).toStrictEqual([]);
    });
  }
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

describe('[result]', () => {
  if (WITH_STACK) {
    // this test requires nexus.iex.ec image
    test('result.pushResultEncryptionKey()', async () => {
      const randomWallet = getRandomWallet();
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        randomWallet.privateKey,
      );
      const smsURL = DRONE ? 'http://token-sms:5000' : 'http://localhost:5000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          smsURL,
        },
      );
      const pushRes = await iexec.result.pushResultEncryptionKey('oops');
      expect(pushRes.isPushed).toBe(true);
      expect(pushRes.isUpdated).toBe(false);
      await expect(
        iexec.result.pushResultEncryptionKey('oops'),
      ).rejects.toThrow(
        Error(
          `Secret "iexec-result-encryption-public-key" already exists for ${randomWallet.address}`,
        ),
      );
    });
    test('result.pushResultEncryptionKey() (forceUpdate)', async () => {
      const randomWallet = getRandomWallet();
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        randomWallet.privateKey,
      );
      const smsURL = DRONE ? 'http://token-sms:5000' : 'http://localhost:5000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          smsURL,
        },
      );
      const pushRes = await iexec.result.pushResultEncryptionKey('Oops', {
        forceUpdate: true,
      });
      expect(pushRes.isPushed).toBe(true);
      expect(pushRes.isUpdated).toBe(false);
      const pushSameRes = await iexec.result.pushResultEncryptionKey('Oops', {
        forceUpdate: true,
      });
      expect(pushSameRes.isPushed).toBe(true);
      expect(pushSameRes.isUpdated).toBe(true);
    });
    test('result.pushResultEncryptionKey() (fail with self signed certificates)', async () => {
      const randomWallet = getRandomWallet();
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        randomWallet.privateKey,
      );
      const smsURL = DRONE ? 'https://token-sms' : 'https://localhost:5443';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          smsURL,
        },
      );
      await expect(
        iexec.result.pushResultEncryptionKey('oops'),
      ).rejects.toThrow(Error(`SMS at ${smsURL} didn't answered`));
    });
    test('result.checkResultEncryptionKeyExists()', async () => {
      const randomWallet = getRandomWallet();
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        randomWallet.privateKey,
      );
      const smsURL = DRONE ? 'http://token-sms:5000' : 'http://localhost:5000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          smsURL,
        },
      );
      const withoutSecretRes = await iexec.result.checkResultEncryptionKeyExists(
        randomWallet.address,
      );
      expect(withoutSecretRes).toBe(false);
      await iexec.result.pushResultEncryptionKey('oops');
      const withSecretRes = await iexec.result.checkResultEncryptionKeyExists(
        randomWallet.address,
      );
      expect(withSecretRes).toBe(true);
    });
  }
});

describe('[storage]', () => {
  if (WITH_STACK) {
    // this test requires nexus.iex.ec image
    test('storage.defaultStorageLogin()', async () => {
      const randomWallet = getRandomWallet();
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        randomWallet.privateKey,
      );
      const resultProxyURL = DRONE
        ? 'http://token-result-proxy:18089'
        : 'http://localhost:18089';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          resultProxyURL,
        },
      );
      const token = await iexec.storage.defaultStorageLogin();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
      const token2 = await iexec.storage.defaultStorageLogin();
      expect(token2).toBe(token);
    });
    test('storage.pushStorageToken()', async () => {
      const randomWallet = getRandomWallet();
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        randomWallet.privateKey,
      );
      const smsURL = DRONE ? 'http://token-sms:5000' : 'http://localhost:5000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          smsURL,
        },
      );
      const pushRes = await iexec.storage.pushStorageToken('oops');
      expect(pushRes.isPushed).toBe(true);
      expect(pushRes.isUpdated).toBe(false);
      await expect(iexec.storage.pushStorageToken('oops')).rejects.toThrow(
        Error(
          `Secret "iexec-result-iexec-ipfs-token" already exists for ${randomWallet.address}`,
        ),
      );
    });
    test('storage.pushStorageToken() (provider: "default")', async () => {
      const randomWallet = getRandomWallet();
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        randomWallet.privateKey,
      );
      const smsURL = DRONE ? 'http://token-sms:5000' : 'http://localhost:5000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          smsURL,
        },
      );
      const pushRes = await iexec.storage.pushStorageToken('oops', {
        provider: 'default',
      });
      expect(pushRes.isPushed).toBe(true);
      expect(pushRes.isUpdated).toBe(false);
      await expect(
        iexec.storage.pushStorageToken('oops', { provider: 'default' }),
      ).rejects.toThrow(
        Error(
          `Secret "iexec-result-iexec-ipfs-token" already exists for ${randomWallet.address}`,
        ),
      );
    });
    test('storage.pushStorageToken() (provider: "dropbox")', async () => {
      const randomWallet = getRandomWallet();
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        randomWallet.privateKey,
      );
      const smsURL = DRONE ? 'http://token-sms:5000' : 'http://localhost:5000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          smsURL,
        },
      );
      const pushRes = await iexec.storage.pushStorageToken('oops', {
        provider: 'dropbox',
      });
      expect(pushRes.isPushed).toBe(true);
      expect(pushRes.isUpdated).toBe(false);
      await expect(
        iexec.storage.pushStorageToken('oops', { provider: 'dropbox' }),
      ).rejects.toThrow(
        Error(
          `Secret "iexec-result-dropbox-token" already exists for ${randomWallet.address}`,
        ),
      );
    });
    test('storage.pushStorageToken() (forceUpdate)', async () => {
      const randomWallet = getRandomWallet();
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        randomWallet.privateKey,
      );
      const smsURL = DRONE ? 'http://token-sms:5000' : 'http://localhost:5000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          smsURL,
        },
      );
      const pushRes = await iexec.storage.pushStorageToken('oops', {
        forceUpdate: true,
      });
      expect(pushRes.isPushed).toBe(true);
      expect(pushRes.isUpdated).toBe(false);
      const updateRes = await iexec.storage.pushStorageToken('oops', {
        forceUpdate: true,
      });
      expect(updateRes.isPushed).toBe(true);
      expect(updateRes.isUpdated).toBe(true);
    });
    test('storage.pushStorageToken() (fail with self signed certificates)', async () => {
      const randomWallet = getRandomWallet();
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        randomWallet.privateKey,
      );
      const smsURL = DRONE ? 'https://token-sms' : 'https://localhost:5443';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          smsURL,
        },
      );
      await expect(iexec.storage.pushStorageToken('oops')).rejects.toThrow(
        Error(`SMS at ${smsURL} didn't answered`),
      );
    });
    test('storage.checkStorageTokenExists()', async () => {
      const randomWallet = getRandomWallet();
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        randomWallet.privateKey,
      );
      const smsURL = DRONE ? 'http://token-sms:5000' : 'http://localhost:5000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          smsURL,
        },
      );
      const withoutSecretRes = await iexec.storage.checkStorageTokenExists(
        randomWallet.address,
        { provider: 'dropbox' },
      );
      expect(withoutSecretRes).toBe(false);
      await iexec.storage.pushStorageToken('oops', { provider: 'dropbox' });
      const withSecretRes = await iexec.storage.checkStorageTokenExists(
        randomWallet.address,
        { provider: 'dropbox' },
      );
      expect(withSecretRes).toBe(true);
      const unsetProviderRes = await iexec.storage.checkStorageTokenExists(
        randomWallet.address,
      );
      expect(unsetProviderRes).toBe(false);
      expect(() => iexec.storage.checkStorageTokenExists(randomWallet.address, {
        provider: 'test',
      })).toThrow(Error('"test" not supported'));
    });
  }
});

describe('[deal]', () => {
  if (WITH_STACK) {
    // this test requires running local stack
    test('deal.fetchRequesterDeals()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
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
      const { dealid } = await iexec.order.matchOrders({
        apporder,
        datasetorder,
        workerpoolorder,
        requestorder,
      });
      await sleep(1000);
      const resAfterMatch = await iexec.deal.fetchRequesterDeals(
        requesterAddress,
      );
      expect(res.count).toBe(resAfterMatch.count - 1);
      const resAppFilterd = await iexec.deal.fetchRequesterDeals(
        requesterAddress,
        {
          appAddress: apporder.app,
        },
      );
      expect(resAppFilterd.count).toBe(1);
      expect(resAppFilterd.deals[0].dealid).toBe(dealid);
      expect(resAppFilterd.deals[0].app.pointer).toBe(apporder.app);
      const resDatasetFilterd = await iexec.deal.fetchRequesterDeals(
        requesterAddress,
        {
          datasetAddress: datasetorder.dataset,
        },
      );
      expect(resDatasetFilterd.count).toBe(1);
      expect(resDatasetFilterd.deals[0].dealid).toBe(dealid);
      expect(resDatasetFilterd.deals[0].dataset.pointer).toBe(
        datasetorder.dataset,
      );
      const resWorkerpoolFilterd = await iexec.deal.fetchRequesterDeals(
        requesterAddress,
        {
          workerpoolAddress: workerpoolorder.workerpool,
        },
      );
      expect(resWorkerpoolFilterd.deals[0].dealid).toBe(dealid);
      expect(resWorkerpoolFilterd.count).toBe(1);
      expect(resWorkerpoolFilterd.deals[0].workerpool.pointer).toBe(
        workerpoolorder.workerpool,
      );
    }, 20000);
    test('deal.fetchDealsByApporder()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
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
      const { dealid } = await iexec.order.matchOrders({
        apporder,
        datasetorder,
        workerpoolorder,
        requestorder,
      });
      await sleep(1000);
      const resAfterMatch = await iexec.deal.fetchDealsByApporder(orderHash);
      expect(resAfterMatch.count).toBe(1);
      expect(resAfterMatch.deals[0].dealid).toBe(dealid);
      expect(resAfterMatch.deals[0].app.pointer).toBe(apporder.app);
    }, 20000);
    test('deal.fetchDealsByDatasetorder()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
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
      const { dealid } = await iexec.order.matchOrders({
        apporder,
        datasetorder,
        workerpoolorder,
        requestorder,
      });
      await sleep(1000);
      const resAfterMatch = await iexec.deal.fetchDealsByDatasetorder(
        orderHash,
      );
      expect(resAfterMatch.count).toBe(1);
      expect(resAfterMatch.deals[0].dealid).toBe(dealid);
      expect(resAfterMatch.deals[0].dataset.pointer).toBe(datasetorder.dataset);
    }, 20000);
    test('deal.fetchDealsByWorkerpoolorder()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
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
      const { dealid } = await iexec.order.matchOrders({
        apporder,
        datasetorder,
        workerpoolorder,
        requestorder,
      });
      await sleep(1000);
      const resAfterMatch = await iexec.deal.fetchDealsByWorkerpoolorder(
        orderHash,
      );
      expect(resAfterMatch.count).toBe(1);
      expect(resAfterMatch.deals[0].dealid).toBe(dealid);
      expect(resAfterMatch.deals[0].workerpool.pointer).toBe(
        workerpoolorder.workerpool,
      );
    }, 20000);
    test('deal.fetchDealsByRequestorder()', async () => {
      const signer = utils.getSignerFromPrivateKey(
        tokenChainParityUrl,
        PRIVATE_KEY,
      );
      const iexecGatewayURL = DRONE
        ? 'http://token-gateway:3000'
        : 'http://localhost:13000';
      const iexec = new IExec(
        {
          ethProvider: signer,
          chainId: networkId,
        },
        {
          hubAddress,
          isNative: false,
          iexecGatewayURL,
        },
      );
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
      const { dealid } = await iexec.order.matchOrders({
        apporder,
        datasetorder,
        workerpoolorder,
        requestorder,
      });
      await sleep(1000);
      const resAfterMatch = await iexec.deal.fetchDealsByRequestorder(
        orderHash,
      );
      expect(resAfterMatch.count).toBe(1);
      expect(resAfterMatch.deals[0].dealid).toBe(dealid);
      expect(resAfterMatch.deals[0].requester).toBe(requestorder.requester);
    }, 20000);
  }
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
      expect(() => utils.encodeTag(['tee', 'foo'])).toThrow('Unknown tag foo');
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
      )).toThrow('Unknown bit 2');
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
      expect(
        utils.sumTags([
          '0x0000000000000000000000000000000000000000000000000000000000000101',
          '0x0000000000000000000000000000000000000000000000000000000000000001',
          '0x0000000000000000000000000000000000000000000000000000000000000002',
        ]),
      ).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000103',
      );
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
