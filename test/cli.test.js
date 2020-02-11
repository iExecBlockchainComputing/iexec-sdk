const { exec } = require('child_process');
const semver = require('semver');
const ethers = require('ethers');
const fs = require('fs-extra');
const path = require('path');
const BN = require('bn.js');

console.log('Node version:', process.version);

// CONFIG
const { DRONE } = process.env;
const iexecPath = DRONE ? 'iexec' : 'node ../src/iexec.js';
const ethereumHost = DRONE ? 'ethereum' : 'localhost';
const ethereumURL = `http://${ethereumHost}:8545`;
const chainName = 'dev';
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
const PRIVATE_KEY3 = '0xcfae38ce58f250c2b5bd28389f42e720c1a8db98ef8eeb0bd4aef2ddf9d56076';
const ADDRESS3 = '0xA540FCf5f097c3F996e680F5cb266629600F064A';

// UTILS
const execAsync = cmd => new Promise((res, rej) => {
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      rej(Error(stdout + stderr));
    }
    res(stdout + stderr);
  });
});

const ethRPC = new ethers.providers.JsonRpcProvider(ethereumURL);
const walletWithProvider = new ethers.Wallet(PRIVATE_KEY, ethRPC);

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

const checkExists = async file => fs.pathExists(file);

const filePath = fileName => path.join(process.cwd(), fileName);

const editRequestorder = async ({
  app,
  dataset,
  workerpool,
  category,
  volume,
}) => {
  if (!app || !dataset || !workerpool) throw Error('missing precondition');
  const iexecJson = await loadJSONFile('iexec.json');
  iexecJson.order.requestorder.app = app;
  iexecJson.order.requestorder.dataset = dataset;
  iexecJson.order.requestorder.workerpool = workerpool;
  iexecJson.order.requestorder.category = category || iexecJson.order.requestorder.category;
  iexecJson.order.requestorder.volume = volume || iexecJson.order.requestorder.volume;
  await saveJSONToFile(iexecJson, 'iexec.json');
};

const editWorkerpoolorder = async ({ category, volume }) => {
  const iexecJson = await loadJSONFile('iexec.json');
  iexecJson.order.workerpoolorder.category = category || iexecJson.order.workerpoolorder.category;
  iexecJson.order.workerpoolorder.volume = volume || iexecJson.order.workerpoolorder.volume;
  await saveJSONToFile(iexecJson, 'iexec.json');
};

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

// TESTS
beforeAll(async () => {
  await execAsync('rm -r test/out').catch(e => console.log(e.message));
  await execAsync('rm -r test/datasets').catch(e => console.log(e.message));
  await execAsync('rm -r test/.secrets').catch(e => console.log(e.message));
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

describe('[cli]', () => {
  test('iexec', async () => {
    const out = await execAsync(`${iexecPath}`);
    expect(out.indexOf('Usage: iexec [options] [command]')).not.toBe(-1);
  });
  test('invalid command', async () => {
    const out = await execAsync(`${iexecPath} test`).catch(e => e);
    expect(out instanceof Error).toBe(true);
    expect(out.message.indexOf('Unknown command "iexec test"')).not.toBe(-1);
    expect(out.message.indexOf('Usage: iexec [options] [command]')).not.toBe(
      -1,
    );
  });
  test('missing subcommand', async () => {
    const out = await execAsync(`${iexecPath} app`).catch(e => e);
    expect(out instanceof Error).toBe(true);
    expect(out.message.indexOf('Missing argument')).not.toBe(-1);
    expect(
      out.message.indexOf('Usage: iexec-app [options] [command]'),
    ).not.toBe(-1);
  });
  test('invalid subcommand', async () => {
    const out = await execAsync(`${iexecPath} app test`).catch(e => e);
    expect(out instanceof Error).toBe(true);
    expect(out.message.indexOf('Unknown command "iexec-app test"')).not.toBe(
      -1,
    );
    expect(
      out.message.indexOf('Usage: iexec-app [options] [command]'),
    ).not.toBe(-1);
  });
});

describe('[Mainchain]', () => {
  let mainchainApp;
  let mainchainDataset;
  let mainchainWorkerpool;
  let mainchainNoDurationCatid;
  let mainchainDealid;
  let mainchainTaskid;
  let mainchainDealidNoDuration;
  let mainchainTaskidNoDuration;

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
    // expect(res.pocoVersion).not.toBe(undefined);
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
  test('[mainchain] iexec account deposit 1000', async () => {
    const initialWalletBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} wallet show --raw`),
      ).balance.nRLC,
    );
    const initialAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show --raw`),
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
        await execAsync(`${iexecPath} wallet show --raw`),
      ).balance.nRLC,
    );
    const finalAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show --raw`),
      ).balance.stake,
    );
    expect(initialWalletBalance.sub(bnAmount).eq(finalWalletBalance)).toBe(
      true,
    );
    expect(initialAccountBalance.add(bnAmount).eq(finalAccountBalance)).toBe(
      true,
    );
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  }, 30000);

  test('[mainchain] iexec account withdraw 500', async () => {
    const initialWalletBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} wallet show --raw`),
      ).balance.nRLC,
    );
    const initialAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show --raw`),
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
        await execAsync(`${iexecPath} wallet show --raw`),
      ).balance.nRLC,
    );
    const finalAccountBalance = new BN(
      JSON.parse(
        await execAsync(`${iexecPath} account show --raw`),
      ).balance.stake,
    );
    expect(initialWalletBalance.add(bnAmount).eq(finalWalletBalance)).toBe(
      true,
    );
    expect(initialAccountBalance.sub(bnAmount).eq(finalAccountBalance)).toBe(
      true,
    );
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  }, 30000);

  test('[mainchain] iexec account show', async () => {
    const raw = await execAsync(`${iexecPath} account show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.balance).not.toBe(undefined);
    expect(res.balance.stake).not.toBe('0');
    // expect(res.balance.locked).toBe('0');
  }, 10000);

  test('[mainchain] iexec account show [address]', async () => {
    const raw = await execAsync(`${iexecPath} account show ${ADDRESS3} --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.balance).not.toBe(undefined);
    expect(res.balance.stake).toBe('0');
    expect(res.balance.locked).toBe('0');
  }, 10000);

  test('[common] iexec account show --wallet-address <address> (missing wallet file)', async () => {
    const raw = await execAsync(
      `${iexecPath} account show --wallet-address ${ADDRESS2} --raw`,
    ).catch(e => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.error.message).toBe(
      'Failed to load wallet address from keystore: Wallet file not found',
    );
    expect(res.error.name).toBe('Error');
    expect(res.balance).toBe(undefined);
  }, 10000);

  // APP
  test('[common] iexec app init (no wallet)', async () => {
    await execAsync('mv wallet.json wallet.back');
    const raw = await execAsync(`${iexecPath} app init --raw`);
    await execAsync('mv wallet.back wallet.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.app).not.toBe(undefined);
    expect(res.app.owner).not.toBe(ADDRESS);
  });

  test('[common] iexec app init (+ wallet)', async () => {
    const raw = await execAsync(`${iexecPath} app init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.app).not.toBe(undefined);
    expect(res.app.owner).toBe(ADDRESS);
  });

  test('[mainchain] iexec app deploy', async () => {
    const raw = await execAsync(`${iexecPath} app deploy --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).not.toBe(undefined);
    expect(res.txHash).not.toBe(undefined);
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
    mainchainApp = res.address;
  }, 15000);

  test('[mainchain] iexec app show (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} app show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(mainchainApp);
    expect(res.app).not.toBe(undefined);
    expect(res.app.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec app show 1 (current user)', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(`${iexecPath} app show 1 --raw`);
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).not.toBe(undefined);
    expect(res.app).not.toBe(undefined);
    expect(res.app.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec app show [appAddress]', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(`${iexecPath} app show ${mainchainApp} --raw`);
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(mainchainApp);
    expect(res.app).not.toBe(undefined);
    expect(res.app.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec app show 1 --user [address]', async () => {
    await execAsync('mv wallet.json wallet.back');
    const raw = await execAsync(
      `${iexecPath} app show 1 --user ${ADDRESS} --raw`,
    );
    await execAsync('mv wallet.back wallet.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).not.toBe(undefined);
    expect(res.app).not.toBe(undefined);
    expect(res.app.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec app count (current user)', async () => {
    const raw = await execAsync(`${iexecPath} app count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).not.toBe(undefined);
    expect(res.count).not.toBe('0');
  }, 10000);

  test('[mainchain] iexec app count --user [address]', async () => {
    await execAsync('mv wallet.json wallet.back');
    const raw = await execAsync(
      `${iexecPath} app count --user ${ADDRESS} --raw`,
    );
    await execAsync('mv wallet.back wallet.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).not.toBe(undefined);
    expect(res.count).not.toBe('0');
  }, 10000);

  // DATASET
  test('[common] iexec dataset init (no wallet)', async () => {
    await execAsync('mv wallet.json wallet.back');
    const raw = await execAsync(`${iexecPath} dataset init --raw`);
    await execAsync('mv wallet.back wallet.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.dataset).not.toBe(undefined);
    expect(res.dataset.owner).not.toBe(ADDRESS);
  });

  test('[common] iexec dataset init (+ wallet)', async () => {
    const raw = await execAsync(`${iexecPath} dataset init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.dataset).not.toBe(undefined);
    expect(res.dataset.owner).toBe(ADDRESS);
  });

  test('[mainchain] iexec dataset deploy', async () => {
    const raw = await execAsync(`${iexecPath} dataset deploy --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).not.toBe(undefined);
    expect(res.txHash).not.toBe(undefined);
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
    mainchainDataset = res.address;
  }, 15000);

  test('[mainchain] iexec dataset show (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} dataset show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(mainchainDataset);
    expect(res.dataset).not.toBe(undefined);
    expect(res.dataset.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec dataset show 1 (current user)', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(`${iexecPath} dataset show 1 --raw`);
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).not.toBe(undefined);
    expect(res.dataset).not.toBe(undefined);
    expect(res.dataset.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec dataset show [datasetAddress]', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(
      `${iexecPath} dataset show ${mainchainDataset} --raw`,
    );
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(mainchainDataset);
    expect(res.dataset).not.toBe(undefined);
    expect(res.dataset.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec dataset show 1 --user [address]', async () => {
    await execAsync('mv wallet.json wallet.back');
    const raw = await execAsync(
      `${iexecPath} dataset show 1 --user ${ADDRESS} --raw`,
    );
    await execAsync('mv wallet.back wallet.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).not.toBe(undefined);
    expect(res.dataset).not.toBe(undefined);
    expect(res.dataset.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec dataset count (current user)', async () => {
    const raw = await execAsync(`${iexecPath} dataset count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).not.toBe(undefined);
    expect(res.count).not.toBe('0');
  }, 10000);

  test('[mainchain] iexec dataset count --user [address]', async () => {
    await execAsync('mv wallet.json wallet.back');
    const raw = await execAsync(
      `${iexecPath} dataset count --user ${ADDRESS} --raw`,
    );
    await execAsync('mv wallet.back wallet.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).not.toBe(undefined);
    expect(res.count).not.toBe('0');
  }, 10000);

  // WORKERPOOL
  test('[common] iexec workerpool init (no wallet)', async () => {
    await execAsync('mv wallet.json wallet.back');
    const raw = await execAsync(`${iexecPath} workerpool init --raw`);
    await execAsync('mv wallet.back wallet.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.workerpool).not.toBe(undefined);
    expect(res.workerpool.owner).not.toBe(ADDRESS);
  });

  test('[common] iexec workerpool init (+ wallet)', async () => {
    const raw = await execAsync(`${iexecPath} workerpool init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.workerpool).not.toBe(undefined);
    expect(res.workerpool.owner).toBe(ADDRESS);
  });

  test('[mainchain] iexec workerpool deploy', async () => {
    const raw = await execAsync(`${iexecPath} workerpool deploy --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).not.toBe(undefined);
    expect(res.txHash).not.toBe(undefined);
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
    mainchainWorkerpool = res.address;
  }, 15000);

  test('[mainchain] iexec workerpool show (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} workerpool show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(mainchainWorkerpool);
    expect(res.workerpool).not.toBe(undefined);
    expect(res.workerpool.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec workerpool show 1 (current user)', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(`${iexecPath} workerpool show 1 --raw`);
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).not.toBe(undefined);
    expect(res.workerpool).not.toBe(undefined);
    expect(res.workerpool.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec workerpool show [workerpoolAddress]', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(
      `${iexecPath} workerpool show ${mainchainWorkerpool} --raw`,
    );
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(mainchainWorkerpool);
    expect(res.workerpool).not.toBe(undefined);
    expect(res.workerpool.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec workerpool show 1 --user [address]', async () => {
    await execAsync('mv wallet.json wallet.back');
    const raw = await execAsync(
      `${iexecPath} workerpool show 1 --user ${ADDRESS} --raw`,
    );
    await execAsync('mv wallet.back wallet.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).not.toBe(undefined);
    expect(res.workerpool).not.toBe(undefined);
    expect(res.workerpool.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec workerpool count (current user)', async () => {
    const raw = await execAsync(`${iexecPath} workerpool count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).not.toBe(undefined);
    expect(res.count).not.toBe('0');
  }, 10000);

  test('[mainchain] iexec workerpool count --user [address]', async () => {
    await execAsync('mv wallet.json wallet.back');
    const raw = await execAsync(
      `${iexecPath} workerpool count --user ${ADDRESS} --raw`,
    );
    await execAsync('mv wallet.back wallet.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).not.toBe(undefined);
    expect(res.count).not.toBe('0');
  }, 10000);

  // CATEGORY
  test('[common] iexec category init', async () => {
    const raw = await execAsync(`${iexecPath} category init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.category).not.toBe(undefined);
  });

  test('[mainchain] iexec category create', async () => {
    const raw = await execAsync(`${iexecPath} category create --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.catid).not.toBe(undefined);
    expect(res.txHash).not.toBe(undefined);
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  });

  test('[mainchain] iexec category create (workClockTimeRef=0)', async () => {
    const iexecjson = await loadJSONFile('iexec.json');
    iexecjson.category.workClockTimeRef = '0';
    iexecjson.category.name = 'no duration';
    await saveJSONToFile(iexecjson, 'iexec.json');
    const raw = await execAsync(`${iexecPath} category create --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.catid).not.toBe(undefined);
    expect(res.txHash).not.toBe(undefined);
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
    mainchainNoDurationCatid = res.catid.toString();
  });

  test('[mainchain] iexec category show 0', async () => {
    const raw = await execAsync(`${iexecPath} category show 0 --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.index).toBe('0');
    expect(res.category).not.toBe(undefined);
  });

  test('[mainchain] iexec category count', async () => {
    const raw = await execAsync(`${iexecPath} category count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).not.toBe(undefined);
    expect(res.count).not.toBe('0');
  });

  // ORDER
  test('[common] iexec order init (no deployed.json)', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(`${iexecPath} order init --raw`);
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).not.toBe(undefined);
    expect(res.datasetorder).not.toBe(undefined);
    expect(res.workerpoolorder).not.toBe(undefined);
    expect(res.requestorder).not.toBe(undefined);
    expect(res.requestorder.requester).toBe(ADDRESS);
    expect(res.requestorder.beneficiary).toBe(ADDRESS);
  });

  test('[common] iexec order init --app ', async () => {
    const raw = await execAsync(`${iexecPath} order init --app --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).not.toBe(undefined);
    expect(res.datasetorder).toBe(undefined);
    expect(res.workerpoolorder).toBe(undefined);
    expect(res.requestorder).toBe(undefined);
    expect(res.apporder.app).toBe(mainchainApp);
  });

  test('[common] iexec order init --dataset ', async () => {
    const raw = await execAsync(`${iexecPath} order init --dataset --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBe(undefined);
    expect(res.datasetorder).not.toBe(undefined);
    expect(res.workerpoolorder).toBe(undefined);
    expect(res.requestorder).toBe(undefined);
    expect(res.datasetorder.dataset).toBe(mainchainDataset);
  });

  test('[common] iexec order init --workerpool', async () => {
    const raw = await execAsync(`${iexecPath} order init --workerpool --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBe(undefined);
    expect(res.datasetorder).toBe(undefined);
    expect(res.workerpoolorder).not.toBe(undefined);
    expect(res.requestorder).toBe(undefined);
    expect(res.workerpoolorder.workerpool).toBe(mainchainWorkerpool);
  });

  test('[common] iexec order init --request', async () => {
    const raw = await execAsync(`${iexecPath} order init --request --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBe(undefined);
    expect(res.datasetorder).toBe(undefined);
    expect(res.workerpoolorder).toBe(undefined);
    expect(res.requestorder).not.toBe(undefined);
    expect(res.requestorder.requester).toBe(ADDRESS);
    expect(res.requestorder.beneficiary).toBe(ADDRESS);
  });

  // edit order
  test('[mainchain] iexec order sign', async () => {
    await editRequestorder({
      app: mainchainApp,
      dataset: mainchainDataset,
      workerpool: mainchainWorkerpool,
      category: '0',
    });
    await editWorkerpoolorder({
      category: '0',
    });
    const raw = await execAsync(`${iexecPath} order sign --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).not.toBe(undefined);
    expect(res.datasetorder).not.toBe(undefined);
    expect(res.workerpoolorder).not.toBe(undefined);
    expect(res.requestorder).not.toBe(undefined);
    expect(res.apporder.app).not.toBe(undefined);
    expect(res.datasetorder.dataset).not.toBe(undefined);
    expect(res.workerpoolorder.workerpool).not.toBe(undefined);
    expect(res.requestorder.app).not.toBe(undefined);
  }, 30000);

  test('[mainchain] iexec order fill', async () => {
    const raw = await execAsync(`${iexecPath} order fill --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.volume).toBe('1');
    expect(res.dealid).not.toBe(undefined);
    expect(res.txHash).not.toBe(undefined);
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
    mainchainDealid = res.dealid;
  }, 10000);

  test('[mainchain] iexec order sign --app', async () => {
    const raw = await execAsync(`${iexecPath} order sign --app --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).not.toBe(undefined);
    expect(res.datasetorder).toBe(undefined);
    expect(res.workerpoolorder).toBe(undefined);
    expect(res.requestorder).toBe(undefined);
    expect(res.apporder.app).not.toBe(undefined);
  }, 10000);

  test('[mainchain] iexec order sign --dataset', async () => {
    const raw = await execAsync(`${iexecPath} order sign --dataset --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBe(undefined);
    expect(res.datasetorder).not.toBe(undefined);
    expect(res.workerpoolorder).toBe(undefined);
    expect(res.requestorder).toBe(undefined);
    expect(res.datasetorder.dataset).not.toBe(undefined);
  }, 10000);

  test('[mainchain] iexec order sign --workerpool', async () => {
    await editWorkerpoolorder({
      category: mainchainNoDurationCatid,
      volume: '6',
    });
    const raw = await execAsync(`${iexecPath} order sign --workerpool --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBe(undefined);
    expect(res.datasetorder).toBe(undefined);
    expect(res.workerpoolorder).not.toBe(undefined);
    expect(res.requestorder).toBe(undefined);
    expect(res.workerpoolorder.workerpool).not.toBe(undefined);
  }, 10000);

  test('[mainchain] iexec order sign --request', async () => {
    await editRequestorder({
      app: mainchainApp,
      dataset: mainchainDataset,
      workerpool: mainchainWorkerpool,
      category: mainchainNoDurationCatid,
      volume: '5',
    });
    const raw = await execAsync(`${iexecPath} order sign --request --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBe(undefined);
    expect(res.datasetorder).toBe(undefined);
    expect(res.workerpoolorder).toBe(undefined);
    expect(res.requestorder).not.toBe(undefined);
    expect(res.requestorder.app).not.toBe(undefined);
  }, 10000);

  test('[mainchain] iexec order fill (BoT 5)', async () => {
    const raw = await execAsync(`${iexecPath} order fill --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.volume).toBe('5');
    expect(res.dealid).not.toBe(undefined);
    expect(res.txHash).not.toBe(undefined);
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
    mainchainDealidNoDuration = res.dealid;
  }, 10000);

  test('[mainchain] iexec order fill --params <params> --force', async () => {
    const raw = await execAsync(
      `${iexecPath} order fill --params 'arg --option "multiple words"' --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.volume).toBe('1');
    expect(res.dealid).not.toBe(undefined);
    expect(res.txHash).not.toBe(undefined);
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  }, 10000);

  test('[mainchain] iexec order cancel --app', async () => {
    const raw = await execAsync(
      `${iexecPath} order cancel --app --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).not.toBe(undefined);
    expect(res.apporder.txHash).not.toBe(undefined);
    expect(res.datasetorder).toBe(undefined);
    expect(res.workerpoolorder).toBe(undefined);
    expect(res.requestorder).toBe(undefined);
    expect(res.fail).toBe(undefined);
    const tx = await ethRPC.getTransaction(res.apporder.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  }, 10000);

  test('[mainchain] iexec order cancel --dataset', async () => {
    const raw = await execAsync(
      `${iexecPath} order cancel --dataset --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBe(undefined);
    expect(res.datasetorder).not.toBe(undefined);
    expect(res.datasetorder.txHash).not.toBe(undefined);
    expect(res.workerpoolorder).toBe(undefined);
    expect(res.requestorder).toBe(undefined);
    expect(res.fail).toBe(undefined);
    const tx = await ethRPC.getTransaction(res.datasetorder.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  }, 10000);

  test('[mainchain] iexec order cancel --workerpool', async () => {
    const raw = await execAsync(
      `${iexecPath} order cancel --workerpool --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBe(undefined);
    expect(res.datasetorder).toBe(undefined);
    expect(res.workerpoolorder).not.toBe(undefined);
    expect(res.workerpoolorder.txHash).not.toBe(undefined);
    expect(res.requestorder).toBe(undefined);
    expect(res.fail).toBe(undefined);
    const tx = await ethRPC.getTransaction(res.workerpoolorder.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  }, 10000);

  test('[mainchain] iexec order cancel --request', async () => {
    const raw = await execAsync(
      `${iexecPath} order cancel --request --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBe(undefined);
    expect(res.datasetorder).toBe(undefined);
    expect(res.workerpoolorder).toBe(undefined);
    expect(res.requestorder).not.toBe(undefined);
    expect(res.requestorder.txHash).not.toBe(undefined);
    expect(res.fail).toBe(undefined);
    const tx = await ethRPC.getTransaction(res.requestorder.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  }, 10000);

  test('[mainchain] iexec order cancel --app --dataset --workerpool --request (missing orders)', async () => {
    await execAsync('mv orders.json orders.back');
    await execAsync('cp ./inputs/orders/emptyOrders.json orders.json');
    const raw = await execAsync(
      `${iexecPath} order cancel --app --dataset --workerpool --request --force --raw`,
    ).catch(e => e.message);
    await execAsync('mv orders.back orders.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.apporder).toBe(undefined);
    expect(res.datasetorder).toBe(undefined);
    expect(res.workerpoolorder).toBe(undefined);
    expect(res.requestorder).toBe(undefined);
    expect(res.fail.length).toBe(4);
  }, 10000);

  test('[common] iexec app run --workerpool', async () => {
    const deployed = {
      app: {
        [networkId]: mainchainApp,
      },
      workerpool: {
        [networkId]: mainchainWorkerpool,
      },
    };
    await saveJSONToFile(deployed, 'deployed.json');
    const raw = await execAsync(
      `${iexecPath} app run --workerpool --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.deals).not.toBe(undefined);
    expect(res.deals.length).toBe(1);
    expect(res.deals[0].volume).toBe('1');
    expect(res.deals[0].dealid).not.toBe(undefined);
    expect(res.deals[0].txHash).not.toBe(undefined);

    const rawDeal = await execAsync(
      `${iexecPath} deal show ${res.deals[0].dealid} --raw`,
    );
    const resDeal = JSON.parse(rawDeal);
    expect(resDeal.ok).toBe(true);
    expect(resDeal.deal).not.toBe(undefined);
    expect(resDeal.deal.app.pointer).toBe(mainchainApp);
    expect(resDeal.deal.app.price).toBe('0');
    expect(resDeal.deal.dataset.pointer).toBe(
      '0x0000000000000000000000000000000000000000',
    );
    expect(resDeal.deal.dataset.price).toBe('0');
    expect(resDeal.deal.workerpool.pointer).toBe(mainchainWorkerpool);
    expect(resDeal.deal.workerpool.price).toBe('0');
    expect(resDeal.deal.category).toBe('0');
    expect(resDeal.deal.params).toBe('');
    expect(resDeal.deal.callback).toBe(
      '0x0000000000000000000000000000000000000000',
    );
    expect(resDeal.deal.requester).toBe(ADDRESS);
    expect(resDeal.deal.beneficiary).toBe(ADDRESS);
    expect(resDeal.deal.botFirst).toBe('0');
    expect(resDeal.deal.botSize).toBe('1');
    expect(resDeal.deal.tag).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
    expect(resDeal.deal.trust).toBe('1');
    expect(Object.keys(resDeal.deal.tasks).length).toBe(1);
    expect(resDeal.deal.tasks['0']).not.toBe(undefined);
  }, 15000);

  test('[common] iexec app run --workerpool --dataset --params <params> --tag <tag> --category <catid> --beneficiary <address> --callback <address>', async () => {
    const deployed = {
      app: {
        [networkId]: mainchainApp,
      },
      dataset: {
        [networkId]: mainchainDataset,
      },
      workerpool: {
        [networkId]: mainchainWorkerpool,
      },
    };
    await saveJSONToFile(deployed, 'deployed.json');
    const raw = await execAsync(
      `${iexecPath} app run --workerpool --dataset --params "test params" --tag tee,gpu --category 1 --beneficiary 0x0000000000000000000000000000000000000000 --callback ${ADDRESS2} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.deals).not.toBe(undefined);
    expect(res.deals.length).toBe(1);
    expect(res.deals[0].volume).toBe('1');
    expect(res.deals[0].dealid).not.toBe(undefined);
    expect(res.deals[0].txHash).not.toBe(undefined);

    const rawDeal = await execAsync(
      `${iexecPath} deal show ${res.deals[0].dealid} --raw`,
    );
    const resDeal = JSON.parse(rawDeal);
    expect(resDeal.ok).toBe(true);
    expect(resDeal.deal).not.toBe(undefined);
    expect(resDeal.deal.app.pointer).toBe(mainchainApp);
    expect(resDeal.deal.app.price).toBe('0');
    expect(resDeal.deal.dataset.pointer).toBe(mainchainDataset);
    expect(resDeal.deal.dataset.price).toBe('0');
    expect(resDeal.deal.workerpool.pointer).toBe(mainchainWorkerpool);
    expect(resDeal.deal.workerpool.price).toBe('0');
    expect(resDeal.deal.category).toBe('1');
    expect(resDeal.deal.params).toBe('test params');
    expect(resDeal.deal.callback).toBe(ADDRESS2);
    expect(resDeal.deal.requester).toBe(ADDRESS);
    expect(resDeal.deal.beneficiary).toBe(
      '0x0000000000000000000000000000000000000000',
    );
    expect(resDeal.deal.botFirst).toBe('0');
    expect(resDeal.deal.botSize).toBe('1');
    expect(resDeal.deal.tag).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000101',
    );
    expect(resDeal.deal.trust).toBe('1');
    expect(Object.keys(resDeal.deal.tasks).length).toBe(1);
    expect(resDeal.deal.tasks['0']).not.toBe(undefined);
  }, 15000);

  test('[common] iexec app run --workerpool --watch (timeout)', async () => {
    const deployed = {
      app: {
        [networkId]: mainchainApp,
      },
      workerpool: {
        [networkId]: mainchainWorkerpool,
      },
    };
    await saveJSONToFile(deployed, 'deployed.json');
    const raw = await execAsync(
      `${iexecPath} app run --workerpool --category ${mainchainNoDurationCatid} --watch --force --raw`,
    ).catch(e => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.deals).not.toBe(undefined);
    expect(res.deals.length).toBe(1);
    expect(res.deals[0].volume).toBe('1');
    expect(res.deals[0].dealid).not.toBe(undefined);
    expect(res.deals[0].txHash).not.toBe(undefined);
    expect(res.tasks).not.toBe(undefined);
    expect(res.tasks.length).toBe(1);
    expect(res.tasks[0].idx).toBe('0');
    expect(res.tasks[0].taskid).not.toBe(undefined);
    expect(res.tasks[0].dealid).toBe(res.deals[0].dealid);
    expect(res.tasks[0].status).toBe(0);
    expect(res.tasks[0].statusName).toBe('TIMEOUT');
    expect(res.tasks[0].taskTimedOut).toBe(true);
    expect(res.tasksFailed).not.toBe(undefined);
    expect(res.tasksFailed.length).toBe(1);
    expect(res.tasksFailed[0].idx).toBe('0');
    expect(res.tasksFailed[0].taskid).not.toBe(undefined);
    expect(res.tasksFailed[0].dealid).toBe(res.deals[0].dealid);
    expect(res.tasksFailed[0].status).toBe(0);
    expect(res.tasksFailed[0].statusName).toBe('TIMEOUT');
    expect(res.tasksFailed[0].taskTimedOut).toBe(true);
  }, 15000);

  // DEAL
  test('[mainchain] iexec deal show', async () => {
    const raw = await execAsync(
      `${iexecPath} deal show ${mainchainDealid} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.deal).not.toBe(undefined);
    expect(res.deal.app.pointer).toBe(mainchainApp);
    expect(res.deal.dataset.pointer).toBe(mainchainDataset);
    expect(res.deal.workerpool.pointer).toBe(mainchainWorkerpool);
    expect(res.deal.requester).toBe(ADDRESS);
    expect(res.deal.beneficiary).toBe(ADDRESS);
    expect(res.deal.botFirst).toBe('0');
    expect(res.deal.botSize).toBe('1');
    expect(res.deal.startTime).not.toBe(undefined);
    expect(res.deal.finalTime).not.toBe(undefined);
    expect(res.deal.deadlineReached).toBe(false);
    expect(res.deal.tasks).not.toBe(undefined);
    expect(Object.keys(res.deal.tasks).length).toBe(1);
    expect(res.deal.tasks['0']).not.toBe(undefined);
    mainchainTaskid = res.deal.tasks['0'];
  }, 10000);

  test('[mainchain] iexec deal show (BoT 5)', async () => {
    const raw = await execAsync(
      `${iexecPath} deal show ${mainchainDealidNoDuration} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.deal).not.toBe(undefined);
    expect(res.deal.app.pointer).toBe(mainchainApp);
    expect(res.deal.dataset.pointer).toBe(mainchainDataset);
    expect(res.deal.workerpool.pointer).toBe(mainchainWorkerpool);
    expect(res.deal.requester).toBe(ADDRESS);
    expect(res.deal.beneficiary).toBe(ADDRESS);
    expect(res.deal.botFirst).toBe('0');
    expect(res.deal.botSize).toBe('5');
    expect(res.deal.startTime).not.toBe(undefined);
    expect(res.deal.finalTime).not.toBe(undefined);
    expect(res.deal.deadlineReached).toBe(true);
    expect(res.deal.tasks).not.toBe(undefined);
    expect(Object.keys(res.deal.tasks).length).toBe(5);
    expect(res.deal.tasks['0']).not.toBe(undefined);
    mainchainTaskidNoDuration = res.deal.tasks['0'];
  }, 10000);

  test('[mainchain] iexec deal show (no deal)', async () => {
    const fakeDealId = '0x194488f76903579d3a3acd89cb75420d52e31e03ab194a74b95247339cf2180f';
    const raw = await execAsync(
      `${iexecPath} deal show ${fakeDealId} --raw`,
    ).catch(e => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.deal).toBe(undefined);
  }, 10000);

  test('[mainchain] iexec task show (not initialized)', async () => {
    const raw = await execAsync(
      `${iexecPath} task show ${mainchainTaskid} --raw`,
    ).catch(e => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.task).toBe(undefined);
  }, 10000);

  test('[mainchain] iexec task show (initialized)', async () => {
    await initializeTask(hubAddress, mainchainDealid, 0);
    const raw = await execAsync(
      `${iexecPath} task show ${mainchainTaskid} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.task).not.toBe(undefined);
    expect(res.task.dealid).toBe(mainchainDealid);
    expect(res.task.idx).toBe('0');
    expect(res.task.timeref).not.toBe(undefined);
    expect(res.task.contributionDeadline).not.toBe(undefined);
    expect(res.task.contributionDeadline).not.toBe(undefined);
    expect(res.task.finalDeadline).not.toBe(undefined);
    expect(res.task.consensusValue).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
    expect(res.task.revealCounter).toBe('0');
    expect(res.task.winnerCounter).toBe('0');
    expect(res.task.contributors).toStrictEqual({});
    expect(res.task.resultDigest).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
    expect(res.task.results).toBe('0x');
    expect(res.task.statusName).toBe('ACTIVE');
    expect(res.task.taskTimedOut).toBe(false);
    expect(res.claimable).toBe(false);
  }, 10000);

  test('[mainchain] iexec task show (claimable)', async () => {
    await initializeTask(hubAddress, mainchainDealidNoDuration, 0);
    const raw = await execAsync(
      `${iexecPath} task show ${mainchainTaskidNoDuration} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.task).not.toBe(undefined);
    expect(res.task.dealid).toBe(mainchainDealidNoDuration);
    expect(res.task.idx).toBe('0');
    expect(res.task.timeref).not.toBe(undefined);
    expect(res.task.contributionDeadline).not.toBe(undefined);
    expect(res.task.contributionDeadline).not.toBe(undefined);
    expect(res.task.finalDeadline).not.toBe(undefined);
    expect(res.task.consensusValue).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
    expect(res.task.revealCounter).toBe('0');
    expect(res.task.winnerCounter).toBe('0');
    expect(res.task.contributors).toStrictEqual({});
    expect(res.task.resultDigest).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
    expect(res.task.results).toBe('0x');
    expect(res.task.statusName).toBe('TIMEOUT');
    expect(res.task.taskTimedOut).toBe(true);
    expect(res.claimable).toBe(true);
  }, 10000);

  test('[mainchain] iexec task claim', async () => {
    const raw = await execAsync(
      `${iexecPath} task claim ${mainchainTaskidNoDuration} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.txHash).not.toBe(undefined);
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  }, 10000);

  test('[mainchain] iexec task show (claimed)', async () => {
    const raw = await execAsync(
      `${iexecPath} task show ${mainchainTaskidNoDuration} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.task).not.toBe(undefined);
    expect(res.task.dealid).toBe(mainchainDealidNoDuration);
    expect(res.task.idx).toBe('0');
    expect(res.task.timeref).not.toBe(undefined);
    expect(res.task.contributionDeadline).not.toBe(undefined);
    expect(res.task.contributionDeadline).not.toBe(undefined);
    expect(res.task.finalDeadline).not.toBe(undefined);
    expect(res.task.consensusValue).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
    expect(res.task.revealCounter).toBe('0');
    expect(res.task.winnerCounter).toBe('0');
    expect(res.task.contributors).toStrictEqual({});
    expect(res.task.resultDigest).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
    expect(res.task.results).toBe('0x');
    expect(res.task.statusName).toBe('FAILED');
    expect(res.task.taskTimedOut).toBe(true);
    expect(res.claimable).toBe(false);
  }, 10000);

  test('[mainchain] iexec deal claim', async () => {
    await initializeTask(hubAddress, mainchainDealidNoDuration, 2);
    const raw = await execAsync(
      `${iexecPath} deal claim ${mainchainDealidNoDuration} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.transactions).not.toBe(undefined);
    expect(res.transactions.length).toBe(2);
    expect(res.transactions[0].type).toBe('claimArray');
    expect(res.transactions[1].type).toBe('initializeAndClaimArray');
    expect(res.claimed).not.toBe(undefined);
    expect(Object.keys(res.claimed).length).toBe(4);
    expect(res.claimed['1']).not.toBe(undefined);
    expect(res.claimed['2']).not.toBe(undefined);
    expect(res.claimed['3']).not.toBe(undefined);
    expect(res.claimed['4']).not.toBe(undefined);
    const claimArrayTx = await ethRPC.getTransaction(
      res.transactions[0].txHash,
    );
    expect(claimArrayTx).not.toBe(undefined);
    expect(claimArrayTx.gasPrice.toString()).toBe(chainGasPrice);
    const initializeAndClaimArrayTx = await ethRPC.getTransaction(
      res.transactions[0].txHash,
    );
    expect(initializeAndClaimArrayTx).not.toBe(undefined);
    expect(initializeAndClaimArrayTx.gasPrice.toString()).toBe(chainGasPrice);
  }, 10000);

  // sendETH
  test('[mainchain] iexec wallet sendETH', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet sendETH 1 --to ${ADDRESS2} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS);
    expect(res.to).toBe(ADDRESS2);
    expect(res.amount).toBe('1');
    expect(res.txHash).not.toBe(undefined);
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  }, 10000);

  // sendRLC
  test('[mainchain] iexec wallet sendRLC', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet sendRLC 1000000000 --to ${ADDRESS2} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS);
    expect(res.to).toBe(ADDRESS2);
    expect(res.amount).toBe('1000000000');
    expect(res.txHash).not.toBe(undefined);
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
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
  let sidechainNoDurationCatid;
  let sidechainDealid;
  let sidechainTaskid;
  let sidechainDealidNoDuration;
  let sidechainTaskidNoDuration;

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
    // expect(res.pocoVersion).not.toBe(undefined);
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
    expect(res.balance.ETH).toBe(undefined);
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
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(nativeChainGasPrice);
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
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(nativeChainGasPrice);
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
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(nativeChainGasPrice);
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
    expect(res.txHash).not.toBe(undefined);
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(nativeChainGasPrice);
    sidechainApp = res.address;
  }, 15000);

  test('[sidechain] iexec app show [appAddress]', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(`${iexecPath} app show ${sidechainApp} --raw`);
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(sidechainApp);
    expect(res.app).not.toBe(undefined);
    expect(res.app.owner).toBe(ADDRESS);
  }, 10000);

  test('[sidechain] iexec app show (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} app show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(sidechainApp);
    expect(res.app).not.toBe(undefined);
    expect(res.app.owner).toBe(ADDRESS);
  }, 10000);

  test('[sidechain] iexec app count (current user)', async () => {
    const raw = await execAsync(`${iexecPath} app count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).not.toBe(undefined);
    expect(res.count).not.toBe('0');
  }, 10000);

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
    expect(res.txHash).not.toBe(undefined);
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(nativeChainGasPrice);
    sidechainDataset = res.address;
  }, 15000);

  test('[sidechain] iexec dataset show [datasetAddress]', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(
      `${iexecPath} dataset show ${sidechainDataset} --raw`,
    );
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(sidechainDataset);
    expect(res.dataset).not.toBe(undefined);
    expect(res.dataset.owner).toBe(ADDRESS);
  }, 10000);

  test('[sidechain] iexec dataset show (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} dataset show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(sidechainDataset);
    expect(res.dataset).not.toBe(undefined);
    expect(res.dataset.owner).toBe(ADDRESS);
  }, 10000);

  test('[sidechain] iexec dataset count (current user)', async () => {
    const raw = await execAsync(`${iexecPath} dataset count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).not.toBe(undefined);
    expect(res.count).not.toBe('0');
  }, 10000);

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
    expect(res.txHash).not.toBe(undefined);
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(nativeChainGasPrice);
    sidechainWorkerpool = res.address;
  }, 15000);

  test('[sidechain] iexec workerpool show [workerpoolAddress]', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(
      `${iexecPath} workerpool show ${sidechainWorkerpool} --raw`,
    );
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(sidechainWorkerpool);
    expect(res.workerpool).not.toBe(undefined);
    expect(res.workerpool.owner).toBe(ADDRESS);
  }, 10000);

  test('[sidechain] iexec workerpool show (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} workerpool show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(sidechainWorkerpool);
    expect(res.workerpool).not.toBe(undefined);
    expect(res.workerpool.owner).toBe(ADDRESS);
  }, 10000);

  test('[sidechain] iexec workerpool count (current user)', async () => {
    const raw = await execAsync(`${iexecPath} workerpool count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).not.toBe(undefined);
    expect(res.count).not.toBe('0');
  }, 10000);

  // CATEGORY
  test('[common] iexec category init', async () => {
    const raw = await execAsync(`${iexecPath} category init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.category).not.toBe(undefined);
  });

  test('[sidechain] iexec category create', async () => {
    const raw = await execAsync(`${iexecPath} category create --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.catid).not.toBe(undefined);
    expect(res.txHash).not.toBe(undefined);
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(nativeChainGasPrice);
  });

  test('[sidechain] iexec category create (workClockTimeRef=0)', async () => {
    const iexecjson = await loadJSONFile('iexec.json');
    iexecjson.category.workClockTimeRef = '0';
    iexecjson.category.name = 'no duration';
    await saveJSONToFile(iexecjson, 'iexec.json');
    const raw = await execAsync(`${iexecPath} category create --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.catid).not.toBe(undefined);
    expect(res.txHash).not.toBe(undefined);
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(nativeChainGasPrice);
    sidechainNoDurationCatid = res.catid.toString();
  });

  test('[sidechain] iexec category show 0', async () => {
    const raw = await execAsync(`${iexecPath} category show 0 --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.index).toBe('0');
    expect(res.category).not.toBe(undefined);
  });

  test('[sidechain] iexec category count', async () => {
    const raw = await execAsync(`${iexecPath} category count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).not.toBe(undefined);
    expect(res.count).not.toBe('0');
  });

  test('[common] iexec order init (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} order init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).not.toBe(undefined);
    expect(res.datasetorder).not.toBe(undefined);
    expect(res.workerpoolorder).not.toBe(undefined);
    expect(res.requestorder).not.toBe(undefined);
    expect(res.apporder.app).toBe(sidechainApp);
    expect(res.datasetorder.dataset).toBe(sidechainDataset);
    expect(res.workerpoolorder.workerpool).toBe(sidechainWorkerpool);
    expect(res.requestorder.requester).toBe(ADDRESS);
    expect(res.requestorder.beneficiary).toBe(ADDRESS);
  });

  test('[sidechain] iexec order sign', async () => {
    await editRequestorder({
      app: sidechainApp,
      dataset: sidechainDataset,
      workerpool: sidechainWorkerpool,
      category: '0',
    });
    await editWorkerpoolorder({
      category: '0',
    });
    const raw = await execAsync(`${iexecPath} order sign --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).not.toBe(undefined);
    expect(res.datasetorder).not.toBe(undefined);
    expect(res.workerpoolorder).not.toBe(undefined);
    expect(res.requestorder).not.toBe(undefined);
    expect(res.apporder.app).not.toBe(undefined);
    expect(res.datasetorder.dataset).not.toBe(undefined);
    expect(res.workerpoolorder.workerpool).not.toBe(undefined);
    expect(res.requestorder.app).not.toBe(undefined);
  }, 30000);

  test('[sidechain] iexec order fill', async () => {
    const raw = await execAsync(`${iexecPath} order fill --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.volume).toBe('1');
    expect(res.dealid).not.toBe(undefined);
    expect(res.txHash).not.toBe(undefined);
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(nativeChainGasPrice);
    sidechainDealid = res.dealid;
  }, 10000);

  test('[sidechain] iexec order fill (BoT 5)', async () => {
    await editRequestorder({
      app: sidechainApp,
      dataset: sidechainDataset,
      workerpool: sidechainWorkerpool,
      category: sidechainNoDurationCatid,
      volume: '5',
    });
    await editWorkerpoolorder({
      category: sidechainNoDurationCatid,
      volume: '5',
    });
    await execAsync(`${iexecPath} order sign --raw`);
    const raw = await execAsync(`${iexecPath} order fill --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.volume).toBe('5');
    expect(res.dealid).not.toBe(undefined);
    expect(res.txHash).not.toBe(undefined);
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(nativeChainGasPrice);
    sidechainDealidNoDuration = res.dealid;
  }, 20000);

  test('[sidechain] iexec order cancel --app --dataset --workerpool --request', async () => {
    const raw = await execAsync(
      `${iexecPath} order cancel --app --dataset --workerpool --request --force --raw`,
    ).catch(e => e);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).not.toBe(undefined);
    expect(res.apporder.txHash).not.toBe(undefined);
    expect(res.datasetorder).not.toBe(undefined);
    expect(res.datasetorder.txHash).not.toBe(undefined);
    expect(res.workerpoolorder).not.toBe(undefined);
    expect(res.workerpoolorder.txHash).not.toBe(undefined);
    expect(res.requestorder).not.toBe(undefined);
    expect(res.requestorder.txHash).not.toBe(undefined);
    expect(res.fail).toBe(undefined);
    const cancelAppordertx = await ethRPC.getTransaction(res.apporder.txHash);
    expect(cancelAppordertx).not.toBe(undefined);
    expect(cancelAppordertx.gasPrice.toString()).toBe(nativeChainGasPrice);
    const cancelDatasetordertx = await ethRPC.getTransaction(
      res.datasetorder.txHash,
    );
    expect(cancelDatasetordertx).not.toBe(undefined);
    expect(cancelDatasetordertx.gasPrice.toString()).toBe(nativeChainGasPrice);
    const cancelWorkerpoolordertx = await ethRPC.getTransaction(
      res.workerpoolorder.txHash,
    );
    expect(cancelWorkerpoolordertx).not.toBe(undefined);
    expect(cancelWorkerpoolordertx.gasPrice.toString()).toBe(
      nativeChainGasPrice,
    );
    const cancelRequestordertx = await ethRPC.getTransaction(
      res.requestorder.txHash,
    );
    expect(cancelRequestordertx).not.toBe(undefined);
    expect(cancelRequestordertx.gasPrice.toString()).toBe(nativeChainGasPrice);
  }, 10000);

  test('[sidechain] iexec deal show', async () => {
    const raw = await execAsync(
      `${iexecPath} deal show ${sidechainDealid} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.deal).not.toBe(undefined);
    expect(res.deal.app.pointer).toBe(sidechainApp);
    expect(res.deal.dataset.pointer).toBe(sidechainDataset);
    expect(res.deal.workerpool.pointer).toBe(sidechainWorkerpool);
    expect(res.deal.requester).toBe(ADDRESS);
    expect(res.deal.beneficiary).toBe(ADDRESS);
    expect(res.deal.botFirst).toBe('0');
    expect(res.deal.botSize).toBe('1');
    expect(res.deal.startTime).not.toBe(undefined);
    expect(res.deal.finalTime).not.toBe(undefined);
    expect(res.deal.deadlineReached).toBe(false);
    expect(res.deal.tasks).not.toBe(undefined);
    expect(Object.keys(res.deal.tasks).length).toBe(1);
    expect(res.deal.tasks['0']).not.toBe(undefined);
    sidechainTaskid = res.deal.tasks['0'];
  }, 10000);

  test('[sidechain] iexec deal show (BoT 5)', async () => {
    const raw = await execAsync(
      `${iexecPath} deal show ${sidechainDealidNoDuration} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.deal).not.toBe(undefined);
    expect(res.deal.app.pointer).toBe(sidechainApp);
    expect(res.deal.dataset.pointer).toBe(sidechainDataset);
    expect(res.deal.workerpool.pointer).toBe(sidechainWorkerpool);
    expect(res.deal.requester).toBe(ADDRESS);
    expect(res.deal.beneficiary).toBe(ADDRESS);
    expect(res.deal.botFirst).toBe('0');
    expect(res.deal.botSize).toBe('5');
    expect(res.deal.startTime).not.toBe(undefined);
    expect(res.deal.finalTime).not.toBe(undefined);
    expect(res.deal.deadlineReached).toBe(true);
    expect(res.deal.tasks).not.toBe(undefined);
    expect(Object.keys(res.deal.tasks).length).toBe(5);
    expect(res.deal.tasks['0']).not.toBe(undefined);
    sidechainTaskidNoDuration = res.deal.tasks['2'];
  }, 10000);

  test('[sidechain] iexec deal show (no deal)', async () => {
    const fakeDealId = '0x194488f76903579d3a3acd89cb75420d52e31e03ab194a74b95247339cf2180f';
    const raw = await execAsync(
      `${iexecPath} deal show ${fakeDealId} --raw`,
    ).catch(e => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.deal).toBe(undefined);
  }, 10000);

  test('[sidechain] iexec task show (not initialized)', async () => {
    const raw = await execAsync(
      `${iexecPath} task show ${sidechainTaskid} --raw`,
    ).catch(e => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.task).toBe(undefined);
  }, 10000);

  test('[sidechain] iexec task show (initialized)', async () => {
    await initializeTask(nativeHubAddress, sidechainDealid, 0);
    const raw = await execAsync(
      `${iexecPath} task show ${sidechainTaskid} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.task).not.toBe(undefined);
    expect(res.task.dealid).toBe(sidechainDealid);
    expect(res.task.idx).toBe('0');
    expect(res.task.timeref).not.toBe(undefined);
    expect(res.task.contributionDeadline).not.toBe(undefined);
    expect(res.task.contributionDeadline).not.toBe(undefined);
    expect(res.task.finalDeadline).not.toBe(undefined);
    expect(res.task.consensusValue).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
    expect(res.task.revealCounter).toBe('0');
    expect(res.task.winnerCounter).toBe('0');
    expect(res.task.contributors).toStrictEqual({});
    expect(res.task.resultDigest).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
    expect(res.task.results).toBe('0x');
    expect(res.task.statusName).toBe('ACTIVE');
    expect(res.task.taskTimedOut).toBe(false);
    expect(res.claimable).toBe(false);
  }, 10000);

  test('[sidechain] iexec task show (claimable)', async () => {
    await initializeTask(nativeHubAddress, sidechainDealidNoDuration, 2);
    const raw = await execAsync(
      `${iexecPath} task show ${sidechainTaskidNoDuration} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.task).not.toBe(undefined);
    expect(res.task.dealid).toBe(sidechainDealidNoDuration);
    expect(res.task.idx).toBe('2');
    expect(res.task.timeref).not.toBe(undefined);
    expect(res.task.contributionDeadline).not.toBe(undefined);
    expect(res.task.contributionDeadline).not.toBe(undefined);
    expect(res.task.finalDeadline).not.toBe(undefined);
    expect(res.task.consensusValue).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
    expect(res.task.revealCounter).toBe('0');
    expect(res.task.winnerCounter).toBe('0');
    expect(res.task.contributors).toStrictEqual({});
    expect(res.task.resultDigest).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
    expect(res.task.results).toBe('0x');
    expect(res.task.statusName).toBe('TIMEOUT');
    expect(res.task.taskTimedOut).toBe(true);
    expect(res.claimable).toBe(true);
  }, 10000);

  test('[sidechain] iexec task claim', async () => {
    const raw = await execAsync(
      `${iexecPath} task claim ${sidechainTaskidNoDuration} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.txHash).not.toBe(undefined);
    const tx = await ethRPC.getTransaction(res.txHash);
    expect(tx).not.toBe(undefined);
    expect(tx.gasPrice.toString()).toBe(nativeChainGasPrice);
  }, 10000);

  test('[sidechain] iexec task show (claimed)', async () => {
    const raw = await execAsync(
      `${iexecPath} task show ${sidechainTaskidNoDuration} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.task).not.toBe(undefined);
    expect(res.task.dealid).toBe(sidechainDealidNoDuration);
    expect(res.task.idx).toBe('2');
    expect(res.task.timeref).not.toBe(undefined);
    expect(res.task.contributionDeadline).not.toBe(undefined);
    expect(res.task.contributionDeadline).not.toBe(undefined);
    expect(res.task.finalDeadline).not.toBe(undefined);
    expect(res.task.consensusValue).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
    expect(res.task.revealCounter).toBe('0');
    expect(res.task.winnerCounter).toBe('0');
    expect(res.task.contributors).toStrictEqual({});
    expect(res.task.resultDigest).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
    expect(res.task.results).toBe('0x');
    expect(res.task.statusName).toBe('FAILED');
    expect(res.task.taskTimedOut).toBe(true);
    expect(res.claimable).toBe(false);
  }, 10000);

  test('[sidechain] iexec deal claim', async () => {
    await initializeTask(nativeHubAddress, sidechainDealidNoDuration, 1);
    const raw = await execAsync(
      `${iexecPath} deal claim ${sidechainDealidNoDuration} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.transactions).not.toBe(undefined);
    expect(res.transactions.length).toBe(2);
    expect(res.transactions[0].type).toBe('claimArray');
    expect(res.transactions[1].type).toBe('initializeAndClaimArray');
    expect(res.claimed).not.toBe(undefined);
    expect(Object.keys(res.claimed).length).toBe(4);
    expect(res.claimed['0']).not.toBe(undefined);
    expect(res.claimed['1']).not.toBe(undefined);
    expect(res.claimed['3']).not.toBe(undefined);
    expect(res.claimed['4']).not.toBe(undefined);
    const claimArrayTx = await ethRPC.getTransaction(
      res.transactions[0].txHash,
    );
    expect(claimArrayTx).not.toBe(undefined);
    expect(claimArrayTx.gasPrice.toString()).toBe(nativeChainGasPrice);
    const initializeAndClaimArrayTx = await ethRPC.getTransaction(
      res.transactions[0].txHash,
    );
    expect(initializeAndClaimArrayTx).not.toBe(undefined);
    expect(initializeAndClaimArrayTx.gasPrice.toString()).toBe(
      nativeChainGasPrice,
    );
  }, 10000);

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
    await execAsync('rm -rf datasets').catch(() => {});
    await execAsync('rm -rf .secrets').catch(() => {});
  });

  // init
  test('iexec init', async () => {
    await execAsync('rm iexec.json').catch(() => {});
    await execAsync('rm chain.json').catch(() => {});
    await execAsync('rm -rf datasets').catch(() => {});
    await execAsync('rm -rf .secrets').catch(() => {});
    const raw = await execAsync(
      `${iexecPath} init --password test --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.walletAddress).not.toBe(undefined);
    expect(res.walletFile).not.toBe(undefined);
    expect(res.configFile).toBe('iexec.json');
    expect(res.chainConfigFile).toBe('chain.json');
    expect(await checkExists(filePath('iexec.json'))).toBe(true);
    expect(await checkExists(filePath('chain.json'))).toBe(true);
  }, 10000);

  test('iexec init --skip-wallet', async () => {
    await execAsync('rm iexec.json').catch(() => {});
    await execAsync('rm chain.json').catch(() => {});
    await execAsync('rm -rf datasets').catch(() => {});
    await execAsync('rm -rf .secrets').catch(() => {});
    const raw = await execAsync(
      `${iexecPath} init --skip-wallet --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.walletAddress).toBe(undefined);
    expect(res.walletFile).toBe(undefined);
    expect(res.configFile).toBe('iexec.json');
    expect(res.chainConfigFile).toBe('chain.json');
    expect(await checkExists(filePath('iexec.json'))).toBe(true);
    expect(await checkExists(filePath('chain.json'))).toBe(true);
  }, 10000);

  test('check update (no --raw)', async () => {
    await expect(
      execAsync(`${iexecPath} init --skip-wallet --force`),
    ).resolves.not.toBe(undefined);
  }, 10000);

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
      expect(res.wallet.publicKey).toBe(undefined);
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
      expect(res.wallet.publicKey).toBe(undefined);
      expect(res.wallet.privateKey).toBe(undefined);
      expect(res.balance.ETH).not.toBe(undefined);
      expect(res.balance.nRLC).not.toBe(undefined);
    }, 10000);

    test('iexec wallet show --show-private-key --wallet-address <address> (wrong password)', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --show-private-key --password fail --wallet-address ${ADDRESS} --raw`,
      ).catch(e => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe('invalid password');
      expect(res.error.name).toBe('Error');
      expect(res.wallet).toBe(undefined);
      expect(res.balance).toBe(undefined);
    }, 10000);

    test('iexec wallet show --wallet-address <address> (missing wallet file)', async () => {
      const raw = await execAsync(
        `${iexecPath}  wallet show --wallet-address ${ADDRESS2} --raw`,
      ).catch(e => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe(
        'Failed to load wallet address from keystore: Wallet file not found',
      );
      expect(res.error.name).toBe('Error');
      expect(res.wallet).toBe(undefined);
      expect(res.balance).toBe(undefined);
    }, 10000);

    // keystoredir custom
    test('iexec wallet import --keystoredir [path]', async () => {
      await execAsync(
        'rm -rf out/keystore && mkdir out/keystore',
      ).catch(() => {});
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
      await execAsync(
        'rm -rf out/keystore && mkdir out/keystore',
      ).catch(() => {});
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
      expect(await checkExists(filePath('wallet.json'))).toBe(true);
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

  describe('[keystore]', () => {
    test('no wallet in keystore, use default address on call', async () => {
      await execAsync('rm wallet.json').catch(() => {});
      const raw = await execAsync(
        `${iexecPath} wallet show ${ADDRESS} --keystoredir ./null --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.balance).not.toBe(undefined);
      expect(res.balance.ETH).not.toBe(undefined);
      expect(res.balance.nRLC).not.toBe(undefined);
    }, 10000);

    test('no wallet in keystore, fail on send', async () => {
      await execAsync('rm wallet.json').catch(() => {});
      const raw = await execAsync(
        `${iexecPath} account withdraw 0 ${ADDRESS} --keystoredir ./null --raw`,
      ).catch(e => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe(
        "ENOENT: no such file or directory, scandir 'null'",
      );
      expect(res.error.name).toBe('Error');
    }, 10000);
  });

  describe('[tx option]', () => {
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
    test('tx --gas-price 1000000001', async () => {
      const raw = await execAsync(
        `${iexecPath} account withdraw 0 --gas-price 1000000001 --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.txHash).not.toBe(undefined);
      const tx = await ethRPC.getTransaction(res.txHash);
      expect(tx).not.toBe(undefined);
      expect(tx.gasPrice.toString()).toBe('1000000001');
    });
    test('tx --gas-price 0', async () => {
      const raw = await execAsync(
        `${iexecPath} account withdraw 0 --gas-price 0 --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.txHash).not.toBe(undefined);
      const tx = await ethRPC.getTransaction(res.txHash);
      expect(tx).not.toBe(undefined);
      expect(tx.gasPrice.toString()).toBe('0');
    });
    test('tx --gas-price -1 (invalid gas-price)', async () => {
      const raw = await execAsync(
        `${iexecPath} account withdraw 0 --gas-price -1 --raw`,
      ).catch(e => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.txHash).toBe(undefined);
    });
  });

  describe('[dataset encryption]', () => {
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

    test('iexec dataset init --encrypted', async () => {
      const raw = await execAsync(
        `${iexecPath} dataset init --encrypted --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(await checkExists(filePath('.secrets/datasets/'))).toBe(true);
      expect(await checkExists(filePath('.secrets/datasets/'))).toBe(true);
      expect(await checkExists(filePath('datasets/encrypted/'))).toBe(true);
    });

    test('iexec dataset init --encrypted  --original-dataset-dir ./out/originals  --encrypted-dataset-dir ./out/encrypted --dataset-keystoredir ./out/dataset-secrets', async () => {
      const raw = await execAsync(
        `${iexecPath} dataset init --encrypted  --original-dataset-dir ./out/originals  --encrypted-dataset-dir ./out/encrypted --dataset-keystoredir ./out/dataset-secrets --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(await checkExists(filePath('out/dataset-secrets/'))).toBe(true);
      expect(await checkExists(filePath('out/originals/'))).toBe(true);
      expect(await checkExists(filePath('out/encrypted/'))).toBe(true);
    });

    test('iexec dataset encrypt', async () => {
      const raw = await execAsync(
        `${iexecPath} dataset encrypt --original-dataset-dir inputs/originalDataset --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.encryptedDatasetFolderPath).not.toBe(undefined);
      expect(res.secretPath).not.toBe(undefined);
      expect(
        res.encryptedDatasetFolderPath.indexOf('/datasets/encrypted'),
      ).not.toBe(-1);
      expect(res.secretPath.indexOf('.secrets/datasets')).not.toBe(-1);
      expect(
        await checkExists(filePath('.secrets/datasets/dataset.secret')),
      ).toBe(true);
      expect(
        await checkExists(
          filePath('.secrets/datasets/datasetFolder.zip.secret'),
        ),
      ).toBe(true);
      expect(
        await checkExists(filePath('datasets/encrypted/datasetFolder.zip.enc')),
      ).toBe(true);
      expect(
        await checkExists(filePath('.secrets/datasets/dataset.txt.secret')),
      ).toBe(true);
      expect(
        await checkExists(filePath('datasets/encrypted/dataset.txt.enc')),
      ).toBe(true);
    });

    if (!DRONE) {
      // this test requires docker
      test('openssl decrypt dataset', async () => expect(
        execAsync(
          'docker build inputs/opensslDecryptDataset/ -t openssldecrypt && docker run --rm -v $PWD/.secrets/datasets:/secrets -v $PWD/datasets/encrypted:/encrypted openssldecrypt dataset.txt',
        ),
      ).resolves.not.toBe(1));
    }

    test('iexec dataset encrypt --force --algorithm aes-256-cbc', async () => {
      await execAsync(
        'cp ./inputs/originalDataset/dataset.txt ./datasets/original/dataset.txt ',
      );
      const raw = await execAsync(
        `${iexecPath} dataset encrypt --force --algorithm aes-256-cbc --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.encryptedDatasetFolderPath).not.toBe(undefined);
      expect(res.secretPath).not.toBe(undefined);
      expect(
        res.encryptedDatasetFolderPath.indexOf('/datasets/encrypted'),
      ).not.toBe(-1);
      expect(res.secretPath.indexOf('/.secrets/datasets')).not.toBe(-1);
      expect(
        await checkExists(filePath('.secrets/datasets/dataset.secret')),
      ).toBe(true);
      expect(
        await checkExists(filePath('.secrets/datasets/dataset.txt.secret')),
      ).toBe(true);
      expect(
        await checkExists(filePath('datasets/encrypted/dataset.txt.enc')),
      ).toBe(true);
    });

    if (!DRONE) {
      // this test requires docker
      test('iexec dataset encrypt --algorithm scone', async () => {
        const raw = await execAsync(
          `${iexecPath} dataset encrypt --original-dataset-dir inputs/originalDataset --algorithm scone --raw`,
        );
        const res = JSON.parse(raw);
        expect(res.ok).toBe(true);
        expect(res.encryptedDatasetFolderPath).not.toBe(undefined);
        expect(res.secretPath).not.toBe(undefined);
        expect(
          res.encryptedDatasetFolderPath.indexOf('/datasets/encrypted'),
        ).not.toBe(-1);
        expect(res.secretPath.indexOf('/.secrets/datasets')).not.toBe(-1);
        expect(
          await checkExists(filePath('.secrets/datasets/dataset.secret')),
        ).toBe(true);
        expect(
          await checkExists(
            filePath('.secrets/datasets/datasetFolder.scone.secret'),
          ),
        ).toBe(true);
        expect(
          await checkExists(filePath('datasets/encrypted/datasetFolder.zip')),
        ).toBe(true);
        expect(
          await checkExists(
            filePath('datasets/encrypted/dataset_dataset.txt.zip'),
          ),
        ).toBe(true);
      }, 15000);
    }
  });

  describe('[result]', () => {
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
    if (semver.gt('v10.12.0', process.version)) {
      test('iexec result generate-keys (node version < v10.12.0)', async () => {
        const raw = await execAsync(
          `${iexecPath} result generate-keys --force --raw`,
        ).catch(e => e.message);
        const res = JSON.parse(raw);
        expect(res.ok).toBe(false);
        expect(res.secretPath).toBe(undefined);
        expect(res.privateKeyFile).toBe(undefined);
        expect(res.publicKeyFile).toBe(undefined);
        expect(res.error.name).toBe('Error');
        expect(
          res.error.message.indexOf(
            'Minimum node version to use this command is v10.12.0, found v',
          ),
        ).not.toBe(-1);
      });
    } else {
      test('iexec result generate-keys', async () => {
        const raw = await execAsync(
          `${iexecPath} result generate-keys --force --raw`,
        );
        const res = JSON.parse(raw);
        expect(res.ok).toBe(true);
        expect(res.secretPath).not.toBe(undefined);
        expect(res.secretPath.indexOf('.secrets/beneficiary')).not.toBe(-1);
        expect(res.privateKeyFile).toBe(
          '0x7bd4783FDCAD405A28052a0d1f11236A741da593_key',
        );
        expect(res.publicKeyFile).toBe(
          '0x7bd4783FDCAD405A28052a0d1f11236A741da593_key.pub',
        );
      }, 10000);
    }

    test('iexec result decrypt --force (wrong beneficiary key)', async () => {
      await execAsync('mkdir .secrets').catch(() => {});
      await execAsync('mkdir .secrets/beneficiary').catch(() => {});
      await execAsync(
        'cp ./inputs/beneficiaryKeys/unexpected_0x7bd4783FDCAD405A28052a0d1f11236A741da593_key ./.secrets/beneficiary/0x7bd4783FDCAD405A28052a0d1f11236A741da593_key',
      );
      const raw = await execAsync(
        `${iexecPath} result decrypt inputs/encryptedResults/encryptedResults.zip --force --raw`,
      ).catch(e => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.resultsPath).toBe(undefined);
      expect(res.error).not.toBe(undefined);
      expect(
        res.error.message.indexOf('Failed to decrypt results key'),
      ).not.toBe(-1);
      expect(res.error.name).toBe('Error');
    });

    test('iexec result decrypt --beneficiary-keystoredir <path>', async () => {
      const raw = await execAsync(
        `${iexecPath} result decrypt inputs/encryptedResults/encryptedResults.zip --wallet-address ${ADDRESS} --beneficiary-keystoredir inputs/beneficiaryKeys/ --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.resultsPath).not.toBe(undefined);
      expect(res.resultsPath.indexOf('results.zip')).not.toBe(-1);
    });

    test('iexec result decrypt --beneficiary-keystoredir <path> --beneficiary-key-file <fileName> --force ', async () => {
      const raw = await execAsync(
        `${iexecPath} result decrypt inputs/encryptedResults/encryptedResults.zip --beneficiary-keystoredir inputs/beneficiaryKeys/ --beneficiary-key-file 0xC08C3def622Af1476f2Db0E3CC8CcaeAd07BE3bB_key --force --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.resultsPath).not.toBe(undefined);
      expect(res.resultsPath.indexOf('results.zip')).not.toBe(-1);
    });
  });

  describe('[registry]', () => {
    beforeAll(async () => {
      await execAsync(`${iexecPath} init --skip-wallet --force`);
      await execAsync('rm deployed.json').catch(() => {});
      await execAsync('rm logo.png').catch(() => {});
    });

    test('iexec registry validate app (invalid iexec.json, missing deployed.json, missing logo)', async () => {
      const raw = await execAsync(
        `${iexecPath} registry validate app --raw`,
      ).catch(e => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.fail.length).toBe(3);
      expect(res.validated.length).toBe(0);
    });

    test('iexec registry validate dataset (invalid iexec.json, missing deployed.json, missing logo)', async () => {
      const raw = await execAsync(
        `${iexecPath} registry validate dataset --raw`,
      ).catch(e => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.fail.length).toBe(3);
      expect(res.validated.length).toBe(0);
    });

    test('iexec registry validate workerpool (invalid iexec.json, missing deployed.json, missing logo)', async () => {
      const raw = await execAsync(
        `${iexecPath} registry validate workerpool --raw`,
      ).catch(e => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.fail.length).toBe(3);
      expect(res.validated.length).toBe(0);
    });

    test('iexec registry validate app', async () => {
      await execAsync('cp ./inputs/validator/iexec-app.json iexec.json');
      await execAsync('cp ./inputs/validator/deployed-app.json deployed.json');
      await execAsync('cp ./inputs/validator/logo.png logo.png');
      const raw = await execAsync(`${iexecPath} registry validate app --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.validated.length).toBe(3);
      expect(res.fail).toBe(undefined);
    });

    test('iexec registry validate dataset', async () => {
      await execAsync('cp ./inputs/validator/iexec-dataset.json iexec.json');
      await execAsync(
        'cp ./inputs/validator/deployed-dataset.json deployed.json',
      );
      await execAsync('cp ./inputs/validator/logo.png logo.png');
      const raw = await execAsync(
        `${iexecPath} registry validate dataset --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.validated.length).toBe(3);
      expect(res.fail).toBe(undefined);
    });

    test('iexec registry validate workerpool', async () => {
      await execAsync('cp ./inputs/validator/iexec-workerpool.json iexec.json');
      await execAsync(
        'cp ./inputs/validator/deployed-workerpool.json deployed.json',
      );
      await execAsync('cp ./inputs/validator/logo.png logo.png');
      const raw = await execAsync(
        `${iexecPath} registry validate workerpool --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.validated.length).toBe(3);
      expect(res.fail).toBe(undefined);
    });
  });

  describe('[mainchains/sidechains config]', () => {
    beforeAll(async () => {
      await execAsync(`${iexecPath} init --skip-wallet --force`);
    });

    test('no "native" overwites in templates', async () => {
      const { chains } = await loadJSONFile('chain.json');
      expect(chains.mainnet.native).toBe(undefined);
      expect(chains.bellecour.native).toBe(undefined);
      expect(chains.kovan.native).toBe(undefined);
      expect(chains.goerli.native).toBe(undefined);
    }, 10000);

    test('mainnet is not native', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show ${ADDRESS} --chain mainnet --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.balance).not.toBe(undefined);
      expect(res.balance.nRLC).not.toBe(undefined);
      expect(res.balance.ETH).not.toBe(undefined);
    }, 10000);

    test('kovan is not native', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show ${ADDRESS} --chain kovan --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.balance).not.toBe(undefined);
      expect(res.balance.nRLC).not.toBe(undefined);
      expect(res.balance.ETH).not.toBe(undefined);
    }, 10000);

    test('goerli is not native', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show ${ADDRESS} --chain goerli --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.balance).not.toBe(undefined);
      expect(res.balance.nRLC).not.toBe(undefined);
      expect(res.balance.ETH).not.toBe(undefined);
    }, 10000);

    test('bellecour is native', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show ${ADDRESS} --chain bellecour --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.balance).not.toBe(undefined);
      expect(res.balance.nRLC).not.toBe(undefined);
      expect(res.balance.ETH).toBe(undefined);
    }, 10000);
  });
});
