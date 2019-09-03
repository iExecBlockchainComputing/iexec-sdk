const { exec } = require('child_process');
const semver = require('semver');
const ethers = require('ethers');
const fs = require('fs-extra');
const path = require('path');
const BN = require('bn.js');

console.log('Node version:', process.version);

// CONFIG
const { DRONE } = process.env;
const execAsync = cmd => new Promise((res, rej) => {
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      rej(Error(stderr));
    }
    res(stdout + stderr);
  });
});

const iexecPath = DRONE ? 'iexec' : 'node ../src/iexec.js';
const ethereumHost = DRONE ? 'ethereum' : 'localhost';
const ethereumURL = `http://${ethereumHost}:8545`;
const chainName = 'dev';
let hubAddress;
let nativeHubAddress;
let networkId;

const PRIVATE_KEY = '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407';
const PUBLIC_KEY = '0x63b6265f021cc1f249366d5ade5bcdf7d33debe594e9d94affdf1aa02255928490fc2c96990a386499b66d17565de1c12ba8fb4ae3af7539e6c61aa7f0113edd';
const ADDRESS = '0x7bd4783FDCAD405A28052a0d1f11236A741da593';
const PRIVATE_KEY2 = '0xd0c5f29f0e7ebe1d3217096fb06130e217758c90f361d3c52ea26c2a0ecc99fb';
const ADDRESS2 = '0x650ae1d365369129c326Cd15Bf91793b52B7cf59';
const PRIVATE_KEY3 = '0xcfae38ce58f250c2b5bd28389f42e720c1a8db98ef8eeb0bd4aef2ddf9d56076';
const ADDRESS3 = '0xA540FCf5f097c3F996e680F5cb266629600F064A';

// UTILS
const ethRPC = new ethers.providers.JsonRpcProvider(ethereumURL);

const loadJSONFile = async (fileName) => {
  const filePath = path.join(process.cwd(), fileName);
  const fileJSON = await fs.readFile(filePath, 'utf8');
  const file = JSON.parse(fileJSON);
  return file;
};

const saveJSONToFile = async (json, fileName) => {
  const filePath = path.join(process.cwd(), fileName);
  const text = JSON.stringify(json, null, 2);
  await fs.writeFile(filePath, text);
};

let testNum = 0;
const saveRaw = () => {
  testNum += 1;
  return `--raw ${DRONE ? '' : `> out/${testNum}_out 2>&1`}`;
};

// TESTS
beforeAll(async () => {
  await execAsync('rm -r test/out').catch(e => console.log(e.message));
  await execAsync('rm -r test/tee').catch(e => console.log(e.message));
  await execAsync('rm -r test/.tee-secrets').catch(e => console.log(e.message));
  await execAsync('rm test/chain.json').catch(e => console.log(e.message));
  await execAsync('rm test/iexec.json').catch(e => console.log(e.message));
  await execAsync('rm test/deployed.json').catch(e => console.log(e.message));
  await execAsync('rm test/orders.json').catch(e => console.log(e.message));
  await execAsync('rm test/results.zip').catch(e => console.log(e.message));
  await execAsync('rm test/wallet.json').catch(e => console.log(e.message));
  await execAsync('mkdir test/out').catch(e => console.log(e.message));
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
  process.chdir('test');
}, 15000);

describe('[Mainchain]', () => {
  // CHAIN.JSON
  let mainchainApp;
  let mainchainDataset;
  let mainchainWorkerpool;

  beforeAll(async () => {
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    const chains = await loadJSONFile('chain.json');
    chains.default = chainName;
    chains.chains.dev.hub = hubAddress;
    chains.chains.dev.host = ethereumURL;
    chains.chains.dev.id = networkId;
    await saveJSONToFile(chains, 'chain.json');
    await execAsync('cp inputs/wallet/wallet.json wallet.json');
  });

  afterAll(async () => {
    await execAsync('rm wallet.json').catch(() => {});
    await execAsync('rm iexec.json').catch(() => {});
    await execAsync('rm chain.json').catch(() => {});
    await execAsync('rm deployed.json').catch(() => {});
    await execAsync('rm orders.json').catch(() => {});
  });

  // INFO
  test('[mainchain] iexec info', async () => {
    const raw = await execAsync(`${iexecPath} info --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.hubAddress).toBe(hubAddress);
    expect(res.pocoVersion).not.toBe(undefined);
    expect(res.appRegistryAddress).not.toBe(undefined);
    expect(res.datasetRegistryAddress).not.toBe(undefined);
    expect(res.workerpoolRegistryAddress).not.toBe(undefined);
    expect(res.rlcAddress).not.toBe(undefined);
    expect(res.useNative).toBe(false);
  });

  test('[mainchain] iexec wallet show', async () => {
    const raw = await execAsync(`${iexecPath} wallet show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.wallet).not.toBe(undefined);
    expect(res.balance.ETH).not.toBe(undefined);
    expect(res.balance.ETH).not.toBe('0');
    expect(res.balance.nRLC).not.toBe(undefined);
    expect(res.balance.nRLC).not.toBe('0');
    expect(res.balance.ETH.replace('.', '').indexOf(res.balance.nRLC)).toBe(-1);
  }, 10000);

  // ACCOUNT
  test(
    'iexec account show',
    () => expect(
      execAsync(`${iexecPath} account show ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );

  test(
    'iexec account show [address]',
    () => expect(
      execAsync(`${iexecPath} account show ${ADDRESS} ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );

  test('[mainchain] iexec account deposit 1000 (+ wallet)', async () => {
    const initialWalletBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} wallet show ${ADDRESS} --raw`),
      ).balance.nRLC,
    );
    const initialAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show ${ADDRESS} --raw`),
      ).balance.stake,
    );
    const amount = '1000';
    const raw = await execAsync(`${iexecPath} account deposit ${amount} --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.amount).toBe(amount);
    expect(res.txHash).not.toBe(undefined);
    const bnAmount = new BN(amount);
    const finalWalletBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} wallet show ${ADDRESS} --raw`),
      ).balance.nRLC,
    );
    const finalAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show ${ADDRESS} --raw`),
      ).balance.stake,
    );
    expect(initialWalletBalance.sub(bnAmount).eq(finalWalletBalance)).toBe(
      true,
    );
    expect(initialAccountBalance.add(bnAmount).eq(finalAccountBalance)).toBe(
      true,
    );
  }, 30000);

  test('[mainchain] iexec account withdraw 500 (+ wallet)', async () => {
    const initialWalletBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} wallet show ${ADDRESS} --raw`),
      ).balance.nRLC,
    );
    const initialAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show ${ADDRESS} --raw`),
      ).balance.stake,
    );
    const amount = '500';
    const raw = await execAsync(
      `${iexecPath} account withdraw ${amount} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.amount).toBe(amount);
    expect(res.txHash).not.toBe(undefined);
    const bnAmount = new BN(amount);
    const finalWalletBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} wallet show ${ADDRESS} --raw`),
      ).balance.nRLC,
    );
    const finalAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show ${ADDRESS} --raw`),
      ).balance.stake,
    );
    expect(initialWalletBalance.add(bnAmount).eq(finalWalletBalance)).toBe(
      true,
    );
    expect(initialAccountBalance.sub(bnAmount).eq(finalAccountBalance)).toBe(
      true,
    );
  }, 30000);

  test(
    'iexec account withdraw 500 --gas-price 1000000000 (+ wallet)',
    () => expect(
      execAsync(
        `${iexecPath} account withdraw 500 --gas-price 1000000000 ${saveRaw()}`,
      ),
    ).resolves.not.toBe(1),
    15000,
  );

  // APP
  test('[common] iexec app init (+ wallet)', async () => {
    const raw = await execAsync(`${iexecPath} app init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.app).not.toBe(undefined);
    expect(res.app.owner).toBe(ADDRESS);
  });

  test('[common] iexec app init (no wallet)', async () => {
    const raw = await execAsync(`${iexecPath} app init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.app).not.toBe(undefined);
  });

  test('[mainchain] iexec app deploy (+ wallet)', async () => {
    const raw = await execAsync(`${iexecPath} app deploy --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).not.toBe(undefined);
    mainchainApp = res.address;
  }, 15000);

  test(
    'iexec app show 1 (no wallet)',
    () => expect(
      execAsync(`${iexecPath} app show 1 ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );

  test(
    'iexec app show 1 (+ wallet)',
    () => expect(
      execAsync(`${iexecPath} app show 1 ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );

  test(
    'iexec app show 1 --user [address]',
    () => expect(
      execAsync(`${iexecPath} app show 1 --user ${ADDRESS} ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );

  test(
    'iexec app count (no wallet)',
    () => expect(
      execAsync(`${iexecPath} app count ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );

  test(
    'iexec app count (+ wallet)',
    () => expect(
      execAsync(`${iexecPath} app count ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );

  test(
    'iexec app count --user [address]',
    () => expect(
      execAsync(`${iexecPath} app count --user ${ADDRESS} ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );

  // DATASET
  test(
    '[common] iexec dataset init (+ wallet)',
    () => expect(
      execAsync(`${iexecPath} dataset init ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );
  test('[common] iexec dataset init (no wallet)', () => expect(
    execAsync(`${iexecPath} dataset init ${saveRaw()}`),
  ).resolves.not.toBe(1));
  test('[mainchain] iexec dataset deploy (+ wallet)', async () => {
    const raw = await execAsync(`${iexecPath} dataset deploy --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).not.toBe(undefined);
    mainchainDataset = res.address;
  }, 15000);
  test(
    'iexec dataset show 1 (no wallet)',
    () => expect(
      execAsync(`${iexecPath} dataset show 1 ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );
  test(
    'iexec dataset show 1 (+ wallet)',
    () => expect(
      execAsync(`${iexecPath} dataset show 1 ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );
  test('iexec dataset show 1 --user [address]', () => expect(
    execAsync(`${iexecPath} dataset show 1 --user ${ADDRESS} ${saveRaw()}`),
  ).resolves.not.toBe(1));
  test(
    'iexec dataset count (no wallet)',
    () => expect(
      execAsync(`${iexecPath} dataset count ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );
  test(
    'iexec dataset count (+ wallet)',
    () => expect(
      execAsync(`${iexecPath} dataset count ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );
  test(
    'iexec dataset count --user [address]',
    () => expect(
      execAsync(`${iexecPath} dataset count --user ${ADDRESS} ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );

  // WORKERPOOL
  test(
    '[common] iexec workerpool init (+ wallet)',
    () => expect(
      execAsync(`${iexecPath} workerpool init ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );
  test('[common] iexec workerpool init (no wallet)', () => expect(execAsync(`${iexecPath} workerpool init`)).resolves.not.toBe(1));
  test('[mainchain] iexec workerpool deploy (+ wallet)', async () => {
    const raw = await execAsync(`${iexecPath} workerpool deploy --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).not.toBe(undefined);
    mainchainWorkerpool = res.address;
  }, 15000);
  test(
    'iexec workerpool show 1 (no wallet)',
    () => expect(
      execAsync(`${iexecPath} workerpool show 1 ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );
  test(
    'iexec workerpool show 1 (+ wallet)',
    () => expect(
      execAsync(`${iexecPath} workerpool show 1 ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );
  test(
    'iexec workerpool show 1 --user [address]',
    () => expect(
      execAsync(
        `${iexecPath} workerpool show --password test --user ${ADDRESS} ${saveRaw()}`,
      ),
    ).resolves.not.toBe(1),
    10000,
  );
  test(
    'iexec workerpool count (no wallet)',
    () => expect(
      execAsync(`${iexecPath} workerpool count ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );
  test(
    'iexec workerpool count (+ wallet)',
    () => expect(
      execAsync(`${iexecPath} workerpool count ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );
  test(
    'iexec workerpool count --user',
    () => expect(
      execAsync(
        `${iexecPath} workerpool count --user ${ADDRESS} ${saveRaw()}`,
      ),
    ).resolves.not.toBe(1),
    10000,
  );

  // CATEGORY
  test('[common] iexec category init', () => expect(execAsync(`${iexecPath} category init`)).resolves.not.toBe(1));
  test(
    'iexec category create (+ wallet)',
    () => expect(
      execAsync(`${iexecPath} category create ${saveRaw()}`),
    ).resolves.not.toBe(1),
    15000,
  );
  test('iexec category show 1', () => expect(
    execAsync(`${iexecPath} category show 1 ${saveRaw()}`),
  ).resolves.not.toBe(1));
  test('iexec category count', () => expect(
    execAsync(`${iexecPath} category count ${saveRaw()}`),
  ).resolves.not.toBe(1));

  // ORDER
  test('[common] iexec order init', () => expect(execAsync(`${iexecPath} order init ${saveRaw()}`)).resolves.not.toBe(
    1,
  ));
  test('[common] iexec order init --app', () => expect(
    execAsync(`${iexecPath} order init --app ${saveRaw()}`),
  ).resolves.not.toBe(1));
  test('[common] iexec order init --dataset', () => expect(
    execAsync(`${iexecPath} order init --dataset ${saveRaw()}`),
  ).resolves.not.toBe(1));
  test('[common] iexec order init --workerpool', () => expect(
    execAsync(`${iexecPath} order init --workerpool ${saveRaw()}`),
  ).resolves.not.toBe(1));
  test('[common] iexec order init --request', () => expect(
    execAsync(`${iexecPath} order init --request ${saveRaw()}`),
  ).resolves.not.toBe(1));
  test(
    '[common] iexec order init --request (+ wallet)',
    () => expect(
      execAsync(`${iexecPath} order init --request ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );

  // edit order
  test('edit requestOrder app iexec.json => use deployed resources', async () => {
    if (!mainchainApp || !mainchainDataset || !mainchainWorkerpool) throw Error('missing precondition');
    const iexecJson = await loadJSONFile('iexec.json');
    iexecJson.order.requestorder.app = mainchainApp;
    iexecJson.order.requestorder.dataset = mainchainDataset;
    iexecJson.order.requestorder.workerpool = mainchainWorkerpool;
    await saveJSONToFile(iexecJson, 'iexec.json');
  });

  test(
    'iexec order sign (+ wallet)',
    () => expect(
      execAsync(`${iexecPath} order sign ${saveRaw()}`),
    ).resolves.not.toBe(1),
    30000,
  );

  test(
    'iexec order sign --request (+ wallet)',
    () => expect(
      execAsync(`${iexecPath} order sign --request ${saveRaw()}`),
    ).resolves.not.toBe(1),
    15000,
  );

  test(
    'iexec order fill (+ wallet)',
    () => expect(
      execAsync(
        `${iexecPath} order fill --raw > 'out/orderFill_stdout.json'`,
      ),
    ).resolves.not.toBe(1),
    15000,
  );

  test(
    'iexec order sign --app (+ wallet)',
    () => expect(
      execAsync(`${iexecPath} order sign --app ${saveRaw()}`),
    ).resolves.not.toBe(1),
    15000,
  );
  test(
    'iexec order sign --dataset (+ wallet)',
    () => expect(
      execAsync(`${iexecPath} order sign --dataset ${saveRaw()}`),
    ).resolves.not.toBe(1),
    15000,
  );
  test(
    'iexec order sign --workerpool (+ wallet)',
    () => expect(
      execAsync(`${iexecPath} order sign --workerpool ${saveRaw()}`),
    ).resolves.not.toBe(1),
    15000,
  );

  test(
    'iexec order fill --params <params> --force (+ wallet)',
    () => expect(
      execAsync(
        `${iexecPath} order fill --params 'arg --option "multiple words"' --force ${saveRaw()}`,
      ),
    ).resolves.not.toBe(1),
    15000,
  );

  test(
    'iexec order cancel --app (+ wallet)',
    () => expect(
      execAsync(`${iexecPath} order cancel --app --force ${saveRaw()}`),
    ).resolves.not.toBe(1),
    15000,
  );
  test(
    'iexec order cancel --dataset (+ wallet)',
    () => expect(
      execAsync(`${iexecPath} order cancel --dataset --force ${saveRaw()}`),
    ).resolves.not.toBe(1),
    15000,
  );
  test(
    'iexec order cancel --workerpool (+ wallet)',
    () => expect(
      execAsync(
        `${iexecPath} order cancel --workerpool --force ${saveRaw()}`,
      ),
    ).resolves.not.toBe(1),
    15000,
  );
  test(
    'iexec order cancel --request (+ wallet)',
    () => expect(
      execAsync(`${iexecPath} order cancel --request --force ${saveRaw()}`),
    ).resolves.not.toBe(1),
    15000,
  );

  // DEAL
  test('iexec deal show', async () => {
    const { dealid } = await loadJSONFile('out/orderFill_stdout.json');
    return expect(
      execAsync(`${iexecPath} deal show ${dealid}`),
    ).resolves.not.toBe(1);
  });

  // sendETH
  test('iexec wallet sendETH', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet sendETH 1 --to ${ADDRESS2} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS);
    expect(res.to).toBe(ADDRESS2);
    expect(res.amount).toBe('1');
    expect(res.txHash).not.toBe(undefined);
  }, 10000);

  // sendRLC
  test('iexec wallet sendRLC', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet sendRLC 1000000000 --to ${ADDRESS2} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS);
    expect(res.to).toBe(ADDRESS2);
    expect(res.amount).toBe('1000000000');
    expect(res.txHash).not.toBe(undefined);
  }, 10000);

  test('[mainchain] iexec wallet sweep', async () => {
    execAsync('cp inputs/wallet/wallet2.json wallet.json');
    const raw = await execAsync(
      `${iexecPath} wallet sweep --to ${ADDRESS} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS2);
    expect(res.to).toBe(ADDRESS);
    expect(res.sendERC20TxHash).not.toBe(undefined);
    expect(res.sendNativeTxHash).not.toBe(undefined);
    expect(res.errors).toBe(undefined);
  }, 15000);
});

describe('[Sidechain]', () => {
  let sidechainApp;
  let sidechainDataset;
  let sidechainWorkerpool;

  beforeAll(async () => {
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await execAsync('cp inputs/wallet/wallet.json wallet.json');
    const chains = await loadJSONFile('chain.json');
    chains.default = chainName;
    chains.chains.dev.host = ethereumURL;
    chains.chains.dev.id = networkId;
    chains.chains.dev.hub = nativeHubAddress;
    chains.chains.dev.native = true;
    await saveJSONToFile(chains, 'chain.json');
  });

  afterAll(async () => {
    await execAsync('rm wallet.json').catch(() => {});
    await execAsync('rm iexec.json').catch(() => {});
    await execAsync('rm chain.json').catch(() => {});
    await execAsync('rm deployed.json').catch(() => {});
    await execAsync('rm deployed.json').catch(() => {});
  });

  test('[sidechain] iexec info', async () => {
    const raw = await execAsync(`${iexecPath} info --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.hubAddress).toBe(nativeHubAddress);
    expect(res.pocoVersion).not.toBe(undefined);
    expect(res.appRegistryAddress).not.toBe(undefined);
    expect(res.datasetRegistryAddress).not.toBe(undefined);
    expect(res.workerpoolRegistryAddress).not.toBe(undefined);
    expect(res.rlcAddress).toBe(undefined);
    expect(res.useNative).toBe(true);
  });

  test('[sidechain] iexec wallet show ', async () => {
    const raw = await execAsync(`${iexecPath} wallet show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.balance.nRLC.substr(0, 2)).not.toBe('0');
    expect(res.balance.ETH.replace('.', '').indexOf(res.balance.nRLC)).not.toBe(
      -1,
    );
  });

  test('[sidechain] iexec wallet sendETH', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet sendETH 0.1 --to ${ADDRESS2} --force --raw`,
    ).catch(e => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
  }, 10000);

  test('[sidechain] iexec wallet sendRLC', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet sendRLC 1000000000 --to ${ADDRESS2} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS);
    expect(res.to).toBe(ADDRESS2);
    expect(res.amount).toBe('1000000000');
    expect(res.txHash).not.toBe(undefined);
  }, 10000);

  test('[sidechain] iexec account deposit 1000', async () => {
    const initialWalletBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} wallet show ${ADDRESS} --raw`),
      ).balance.nRLC,
    );
    const initialAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show ${ADDRESS} --raw`),
      ).balance.stake,
    );
    const amount = '1000';
    const raw = await execAsync(`${iexecPath} account deposit ${amount} --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.amount).toBe(amount);
    expect(res.txHash).not.toBe(undefined);
    const bnAmount = new BN(amount);
    const finalWalletBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} wallet show ${ADDRESS} --raw`),
      ).balance.nRLC,
    );
    const finalAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show ${ADDRESS} --raw`),
      ).balance.stake,
    );
    expect(initialWalletBalance.sub(bnAmount).gte(finalWalletBalance)).toBe(
      true,
    );
    expect(initialAccountBalance.add(bnAmount).eq(finalAccountBalance)).toBe(
      true,
    );
  }, 30000);

  test('[sidechain] iexec account withdraw 500', async () => {
    const initialWalletBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} wallet show ${ADDRESS} --raw`),
      ).balance.nRLC,
    );
    const initialAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show ${ADDRESS} --raw`),
      ).balance.stake,
    );
    const amount = '500';
    const raw = await execAsync(
      `${iexecPath} account withdraw ${amount} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.amount).toBe(amount);
    expect(res.txHash).not.toBe(undefined);
    const bnAmount = new BN(amount);
    const finalWalletBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} wallet show ${ADDRESS} --raw`),
      ).balance.nRLC,
    );
    const finalAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show ${ADDRESS} --raw`),
      ).balance.stake,
    );
    expect(initialWalletBalance.add(bnAmount).gte(finalWalletBalance)).toBe(
      true,
    );
    expect(initialAccountBalance.sub(bnAmount).eq(finalAccountBalance)).toBe(
      true,
    );
    // expect(initialWalletBalance.lt(finalWalletBalance)).toBe(true);
  }, 30000);

  test('[common] iexec app init', async () => {
    const raw = await execAsync(`${iexecPath} app init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.app).not.toBe(undefined);
    expect(res.app.owner).toBe(ADDRESS);
  });

  test('[sidechain] iexec app deploy', async () => {
    const raw = await execAsync(`${iexecPath} app deploy --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).not.toBe(undefined);
    sidechainApp = res.address;
  }, 15000);

  test('[common] iexec dataset init', async () => {
    const raw = await execAsync(`${iexecPath} dataset init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.dataset).not.toBe(undefined);
    expect(res.dataset.owner).toBe(ADDRESS);
  });

  test('[sidechain] iexec dataset deploy', async () => {
    const raw = await execAsync(`${iexecPath} dataset deploy --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).not.toBe(undefined);
    sidechainDataset = res.address;
  }, 15000);

  test('[common] iexec workerpool init', async () => {
    const raw = await execAsync(`${iexecPath} workerpool init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.workerpool).not.toBe(undefined);
    expect(res.workerpool.owner).toBe(ADDRESS);
  });

  test('[sidechain] iexec workerpool deploy', async () => {
    const raw = await execAsync(`${iexecPath} workerpool deploy --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).not.toBe(undefined);
    sidechainWorkerpool = res.address;
  }, 15000);

  test('[sidechain] iexec wallet sweep', async () => {
    await execAsync('cp inputs/wallet/wallet2.json wallet.json');
    const raw = await execAsync(
      `${iexecPath} wallet sweep --to ${ADDRESS} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS2);
    expect(res.to).toBe(ADDRESS);
    expect(res.sendERC20TxHash).toBe(undefined);
    expect(res.sendNativeTxHash).not.toBe(undefined);
    expect(res.errors).toBe(undefined);
  }, 15000);

  test('[sidechain] iexec wallet sweep (empty wallet)', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet sweep --to ${ADDRESS} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS2);
    expect(res.to).toBe(ADDRESS);
    expect(res.sendERC20TxHash).toBe(undefined);
    expect(res.sendNativeTxHash).toBe(undefined);
    expect(res.errors.length).toBe(1);
  }, 15000);
});

describe('[Common]', () => {
  afterAll(async () => {
    await execAsync('rm wallet.json').catch(() => {});
    await execAsync('rm iexec.json').catch(() => {});
    await execAsync('rm chain.json').catch(() => {});
    await execAsync('rm deployed.json').catch(() => {});
    await execAsync('rm results.zip').catch(() => {});
  });

  // init
  test(
    '[common] iexec init',
    async () => expect(
      execAsync(`${iexecPath} init --password test --force ${saveRaw()}`),
    ).resolves.not.toBe(1),
    10000,
  );

  describe('[wallet]', () => {
    let importedWalletName;
    let localWalletFileName;

    beforeAll(async () => {
      await execAsync('rm wallet.json').catch(() => {});
      await execAsync(`${iexecPath} init --skip-wallet --force`);
      const chains = await loadJSONFile('chain.json');
      chains.default = chainName;
      chains.chains.dev.hub = hubAddress;
      chains.chains.dev.host = ethereumURL;
      chains.chains.dev.id = networkId;
      await saveJSONToFile(chains, 'chain.json');
    });

    afterAll(async () => {
      await execAsync('rm -rf out/keystore').catch(() => {});
      await execAsync('rm wallet.json').catch(() => {});
      if (localWalletFileName) await execAsync(`rm ${localWalletFileName}`).catch(() => {});
    });

    test('iexec wallet import', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet import ${PRIVATE_KEY} --password test --force --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).not.toBe(undefined);
      expect(res.address).toBe(ADDRESS);
      expect(res.fileName).not.toBe(undefined);
      const importedWalletFileName = res.fileName;
      importedWalletName = importedWalletFileName.split('/')[
        importedWalletFileName.split('/').length - 1
      ];
    }, 10000);

    test('iexec wallet create', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet create --password test --force --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).not.toBe(undefined);
      expect(res.fileName).not.toBe(undefined);
    }, 10000);

    test('iexec wallet show --wallet-addres <address>', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --password test --wallet-address ${ADDRESS} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).not.toBe(undefined);
      expect(res.wallet).not.toBe(undefined);
      expect(res.wallet.address).toBe(ADDRESS);
      expect(res.wallet.publicKey).toBe(PUBLIC_KEY);
      expect(res.wallet.privateKey).toBe(undefined);
      expect(res.balance.ETH).not.toBe(undefined);
      expect(res.balance.nRLC).not.toBe(undefined);
    }, 10000);

    test('iexec wallet show --show-private-key --wallet-addres <address>', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --show-private-key --password test --wallet-address ${ADDRESS} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).not.toBe(undefined);
      expect(res.wallet).not.toBe(undefined);
      expect(res.wallet.address).toBe(ADDRESS);
      expect(res.wallet.publicKey).toBe(PUBLIC_KEY);
      expect(res.wallet.privateKey).toBe(PRIVATE_KEY);
      expect(res.balance.ETH).not.toBe(undefined);
      expect(res.balance.nRLC).not.toBe(undefined);
    }, 10000);

    test('iexec wallet show --wallet-file <fileName>', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --password test --wallet-file ${importedWalletName} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).not.toBe(undefined);
      expect(res.wallet).not.toBe(undefined);
      expect(res.wallet.address).toBe(ADDRESS);
      expect(res.wallet.publicKey).toBe(PUBLIC_KEY);
      expect(res.wallet.privateKey).toBe(undefined);
      expect(res.balance.ETH).not.toBe(undefined);
      expect(res.balance.nRLC).not.toBe(undefined);
    }, 10000);

    test('iexec wallet show --wallet-address <address> (wrong password)', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --password fail --wallet-address ${ADDRESS} --raw`,
      ).catch(e => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('invalid password');
      expect(res.wallet).toBe(undefined);
      expect(res.balance).toBe(undefined);
    }, 10000);

    test('iexec wallet show --wallet-address <address> (missing wallet file)', async () => {
      const raw = await execAsync(
        `${iexecPath}  wallet show --wallet-address ${ADDRESS2} --raw`,
      ).catch(e => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Missing address or wallet');
      expect(res.wallet).toBe(undefined);
      expect(res.balance).toBe(undefined);
    }, 10000);

    // keystoredir custom
    test('iexec wallet import --keystoredir [path]', async () => {
      await execAsync('rm -rf out/keystore && mkdir out/keystore').catch(
        () => {},
      );
      const raw = await execAsync(
        `${iexecPath}  wallet import ${PRIVATE_KEY2} --password customPath --keystoredir ./out/keystore --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).not.toBe(undefined);
      expect(res.address).toBe(ADDRESS2);
      expect(res.fileName.indexOf('out/keystore/')).not.toBe(-1);
    }, 10000);

    test('iexec wallet show --keystoredir [path]', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --password customPath --keystoredir ./out/keystore --wallet-address ${ADDRESS2} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).not.toBe(undefined);
      expect(res.wallet.address).toBe(ADDRESS2);
    }, 10000);

    // keystoredir local
    test('iexec wallet import --keystoredir local', async () => {
      await execAsync('rm -rf out/keystore && mkdir out/keystore').catch(
        () => {},
      );
      const raw = await execAsync(
        `${iexecPath} wallet import ${PRIVATE_KEY3} --password 'my local pass phrase' --keystoredir local --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).not.toBe(undefined);
      expect(res.address).toBe(ADDRESS3);
      expect(res.fileName.indexOf('/')).toBe(-1);
      localWalletFileName = res.fileName;
    }, 10000);

    test('iexec wallet show --keystoredir [path]', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --password 'my local pass phrase' --keystoredir local --wallet-address ${ADDRESS3} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).not.toBe(undefined);
      expect(res.wallet.address).toBe(ADDRESS3);
    }, 10000);

    // unencrypted
    test('iexec wallet import --unencrypted', async () => {
      await execAsync('rm wallet.json').catch(() => {});
      const raw = await execAsync(
        `${iexecPath} wallet import ${PRIVATE_KEY2} --unencrypted --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).not.toBe(undefined);
      expect(res.wallet.privateKey).toBe(PRIVATE_KEY2);
      expect(res.wallet.address).toBe(ADDRESS2);
      expect(res.address).toBe(ADDRESS2);
      expect(res.fileName.indexOf('/')).toBe(-1);
    }, 10000);

    test('iexec wallet show (unencrypted wallet.json)', async () => {
      const raw = await execAsync(`${iexecPath} wallet show --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).not.toBe(undefined);
      expect(res.wallet.address).toBe(ADDRESS2);
    }, 10000);

    test('iexec wallet show [address]', async () => {
      const raw = await execAsync(`${iexecPath} wallet show ${ADDRESS} --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.balance).not.toBe(undefined);
      expect(res.balance.ETH).not.toBe(undefined);
      expect(res.balance.nRLC).not.toBe(undefined);
      expect(res.balance.ETH).not.toBe('0');
      expect(res.balance.nRLC).not.toBe('0');
      expect(res.wallet).toBe(undefined);
    }, 10000);
  });

  describe('[tee]', () => {
    test('[common] iexec tee init', async () => expect(execAsync(`${iexecPath} tee init ${saveRaw()}`)).resolves.not.toBe(
      1,
    ));

    test('[common] iexec tee encrypt-dataset', async () => expect(
      execAsync(
        `${iexecPath} tee encrypt-dataset --original-dataset-dir inputs/originalDataset ${saveRaw()}`,
      ),
    ).resolves.not.toBe(1));

    if (!DRONE) {
      // this test requires docker
      test('[common] openssl decrypt dataset', async () => expect(
        execAsync(
          'docker build inputs/opensslDecryptDataset/ -t openssldecrypt && docker run --rm -v $PWD/.tee-secrets/dataset:/secrets -v $PWD/tee/encrypted-dataset:/encrypted openssldecrypt dataset.txt',
        ),
      ).resolves.not.toBe(1));
    }

    test(
      '[common] iexec tee encrypt-dataset --force --algorithm aes-256-cbc',
      async () => expect(
        execAsync(
          `${iexecPath} tee encrypt-dataset --original-dataset-dir inputs/originalDataset --force --algorithm aes-256-cbc ${saveRaw()}`,
        ),
      ).resolves.not.toBe(1),
      15000,
    );

    if (!DRONE) {
      // this test requires docker
      test(
        '[common] iexec tee encrypt-dataset --algorithm scone',
        async () => expect(
          execAsync(
            `${iexecPath} tee encrypt-dataset --original-dataset-dir inputs/originalDataset --algorithm scone ${saveRaw()}`,
          ),
        ).resolves.not.toBe(1),
        15000,
      );
    }

    if (semver.gt('v10.12.0', process.version)) {
      test('[common] iexec tee generate-beneficiary-keys', async () => expect(
        execAsync(`${iexecPath} tee generate-beneficiary-keys ${saveRaw()}`),
      ).rejects.not.toBe(1));
    } else {
      test('[common] iexec tee generate-beneficiary-keys', async () => expect(
        execAsync(
          `${iexecPath} tee generate-beneficiary-keys --force ${saveRaw()}`,
        ),
      ).resolves.not.toBe(1));
    }

    test('[common] iexec tee decrypt-results --force (wrong beneficiary key)', async () => expect(
      execAsync(
        `${iexecPath} tee decrypt-results inputs/encryptedResults/encryptedResults.zip --force ${saveRaw()}`,
      ),
    ).rejects.not.toBe(1));

    test('[common] iexec tee decrypt-results --beneficiary-keystoredir <path>', async () => expect(
      execAsync(
        `${iexecPath} tee decrypt-results inputs/encryptedResults/encryptedResults.zip --wallet-address ${ADDRESS} --beneficiary-keystoredir inputs/beneficiaryKeys/ ${saveRaw()}`,
      ),
    ).resolves.not.toBe(1));

    test('[common] iexec tee decrypt-results --beneficiary-keystoredir <path> --beneficiary-key-file <fileName> --force ', async () => expect(
      execAsync(
        `${iexecPath} tee decrypt-results inputs/encryptedResults/encryptedResults.zip --beneficiary-keystoredir inputs/beneficiaryKeys/ --beneficiary-key-file 0xC08C3def622Af1476f2Db0E3CC8CcaeAd07BE3bB_key  --force ${saveRaw()}`,
      ),
    ).resolves.not.toBe(1));
  });

  describe('[registry]', () => {
    test('[common] iexec registry validate app (invalid iexec.json)', async () => {
      const raw = await execAsync(
        `${iexecPath} registry validate app --raw`,
      ).catch(e => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
    });

    test('[common] iexec registry validate dataset (invalid iexec.json)', async () => {
      const raw = await execAsync(
        `${iexecPath} registry validate dataset --raw`,
      ).catch(e => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
    });

    test('[common] iexec registry validate workerpool (invalid iexec.json)', async () => {
      const raw = await execAsync(
        `${iexecPath} registry validate workerpool --raw`,
      ).catch(e => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
    });

    test('[common] iexec registry validate app', async () => {
      await execAsync('cp ./inputs/validator/iexec-app.json iexec.json');
      await execAsync('cp ./inputs/validator/deployed-app.json deployed.json');
      const raw = await execAsync(`${iexecPath} registry validate app --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.validated.length).toBe(3);
    });

    test('[common] iexec registry validate dataset', async () => {
      await execAsync('cp ./inputs/validator/iexec-dataset.json iexec.json');
      await execAsync(
        'cp ./inputs/validator/deployed-dataset.json deployed.json',
      );
      const raw = await execAsync(
        `${iexecPath} registry validate dataset --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.validated.length).toBe(3);
    });

    test('[common] iexec registry validate workerpool', async () => {
      await execAsync('cp ./inputs/validator/iexec-workerpool.json iexec.json');
      await execAsync(
        'cp ./inputs/validator/deployed-workerpool.json deployed.json',
      );
      const raw = await execAsync(
        `${iexecPath} registry validate workerpool --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.validated.length).toBe(3);
    });
  });
});
