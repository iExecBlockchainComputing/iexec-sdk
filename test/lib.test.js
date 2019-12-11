const ethers = require('ethers');
const BN = require('bn.js');
const { utils, IExec } = require('../src/iexec-lib');

console.log('Node version:', process.version);

// CONFIG
const { DRONE } = process.env;
const ethereumHost = DRONE ? 'ethereum' : 'localhost';
const ethereumURL = `http://${ethereumHost}:8545`;
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
    const appDeployRes = await iexec.app.deployApp({
      owner: await iexec.wallet.getAddress(),
      name: 'My app',
      type: 'DOCKER',
      multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
      checksum:
        '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
      mrenclave: '',
    });
    expect(appDeployRes.address).not.toBe(undefined);
    expect(appDeployRes.txHash).not.toBe(undefined);
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
    const datasetDeployRes = await iexec.dataset.deployDataset({
      owner: await iexec.wallet.getAddress(),
      name: 'My dataset',
      multiaddr: '/ipfs/QmW2WQi7j6c7UgJTarActp7tDNikE4B2qXtFCfLPdsgaTQ',
      checksum:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
    });
    expect(datasetDeployRes.address).not.toBe(undefined);
    expect(datasetDeployRes.txHash).not.toBe(undefined);
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
    const workerpoolDeployRes = await iexec.workerpool.deployWorkerpool({
      owner: await iexec.wallet.getAddress(),
      description: 'My workerpool',
    });
    expect(workerpoolDeployRes.address).not.toBe(undefined);
    expect(workerpoolDeployRes.txHash).not.toBe(undefined);
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
      params: 'test',
    });
    const signedorder = await iexec.order.signRequestorder(order);
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
  test('claim deal uninitialized tasks', async () => {
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
      .add(new BN(order.workerpoolmaxprice));
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
    const claimDealRes = await iexec.deal.claim(matchOrdersRes.dealid);
    expect(claimDealRes).not.toBe(undefined);
    expect(claimDealRes.transactions).not.toBe(undefined);
    expect(claimDealRes.transactions.length).toBe(1);
    expect(claimDealRes.transactions[0]).not.toBe(undefined);
    expect(claimDealRes.transactions[0].type).toBe('initializeAndClaimArray');
    expect(claimDealRes.claimed).not.toBe(undefined);
    expect(Object.keys(claimDealRes.claimed).length).toBe(10);
    expect(claimDealRes.claimed[0]).not.toBe(undefined);
  });
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
  test('with gasPrice option', async () => {
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
});

describe('[lib utils]', () => {
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
  test("encodeTag(['tee'])", () => {
    expect(utils.encodeTag(['tee'])).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    );
  });
  test('encodeTag unknown tag', () => {
    expect(() => utils.encodeTag(['tee', 'foo'])).toThrow('unknown tag foo');
  });
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
