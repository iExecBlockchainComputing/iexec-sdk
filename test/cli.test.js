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
const tokenChainUrl = DRONE
  ? 'http://token-chain:8545'
  : 'http://localhost:8545';
const nativeChainUrl = DRONE
  ? 'http://native-chain:8545'
  : 'http://localhost:18545';
const chainName = 'dev';
const chainGasPrice = '20000000000';
const nativeChainGasPrice = '0';
let hubAddress;
let nativeHubAddress;
let networkId;

const PRIVATE_KEY = '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407';
const PUBLIC_KEY = '0x0463b6265f021cc1f249366d5ade5bcdf7d33debe594e9d94affdf1aa02255928490fc2c96990a386499b66d17565de1c12ba8fb4ae3af7539e6c61aa7f0113edd';
const ADDRESS = '0x7bd4783FDCAD405A28052a0d1f11236A741da593';
const POOR_PRIVATE_KEY1 = '0xd0c5f29f0e7ebe1d3217096fb06130e217758c90f361d3c52ea26c2a0ecc99fb';
const POOR_ADDRESS1 = '0x650ae1d365369129c326Cd15Bf91793b52B7cf59';
const POOR_PRIVATE_KEY2 = '0xcfae38ce58f250c2b5bd28389f42e720c1a8db98ef8eeb0bd4aef2ddf9d56076';
const POOR_ADDRESS2 = '0xA540FCf5f097c3F996e680F5cb266629600F064A';

// UTILS
const execAsync = cmd => new Promise((res, rej) => {
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      rej(Error(stdout + stderr));
    }
    res(stdout + stderr);
  });
});

const tokenChainRPC = new ethers.providers.JsonRpcProvider(tokenChainUrl);
const tokenChainWallet = new ethers.Wallet(PRIVATE_KEY, tokenChainRPC);

const nativeChainRPC = new ethers.providers.JsonRpcProvider(nativeChainUrl);
const nativeChainWallet = new ethers.Wallet(PRIVATE_KEY, nativeChainRPC);

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

const removeWallet = () => fs.remove('./wallet.json').catch(() => {});

const setRichWallet = () => saveJSONToFile(
  {
    privateKey: PRIVATE_KEY,
    publicKey: PUBLIC_KEY,
    address: ADDRESS,
  },
  'wallet.json',
);

const setPoorWallet1 = () => saveJSONToFile(
  {
    privateKey: POOR_PRIVATE_KEY1,
    publicKey: '',
    address: POOR_ADDRESS1,
  },
  'wallet.json',
);

const setPoorWallet2 = () => saveJSONToFile(
  {
    privateKey: POOR_PRIVATE_KEY2,
    publicKey: '',
    address: POOR_ADDRESS2,
  },
  'wallet.json',
);

let sequenceId = Date.now();
const getId = () => {
  sequenceId += 1;
  return sequenceId;
};

const setAppUniqueName = async () => {
  const iexecJson = await loadJSONFile('iexec.json');
  const name = getId();
  iexecJson.app.name = name;
  await saveJSONToFile(iexecJson, 'iexec.json');
  return name;
};

const setDatasetUniqueName = async () => {
  const iexecJson = await loadJSONFile('iexec.json');
  const name = getId();
  iexecJson.dataset.name = name;
  await saveJSONToFile(iexecJson, 'iexec.json');
  return name;
};

const setWorkerpoolUniqueDescription = async () => {
  const iexecJson = await loadJSONFile('iexec.json');
  const description = getId();
  iexecJson.workerpool.description = description;
  await saveJSONToFile(iexecJson, 'iexec.json');
  return description;
};

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

const getRandomWallet = () => {
  const { privateKey, publicKey, address } = ethers.Wallet.createRandom();
  return { privateKey, publicKey, address };
};
const getRandomAddress = () => getRandomWallet().address;

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
  process.chdir('test');

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

afterAll(() => {
  process.chdir('..');
});

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
    chains.chains.dev.host = tokenChainUrl;
    chains.chains.dev.id = networkId;
    await saveJSONToFile(chains, 'chain.json');
    await setRichWallet();
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
    expect(res.appRegistryAddress).toBeDefined();
    expect(res.datasetRegistryAddress).toBeDefined();
    expect(res.workerpoolRegistryAddress).toBeDefined();
    expect(res.rlcAddress).toBeDefined();
    expect(res.useNative).toBe(false);
  });

  test('[mainchain] iexec wallet show', async () => {
    const raw = await execAsync(`${iexecPath} wallet show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.wallet).toBeDefined();
    expect(res.balance.ETH).toBeDefined();
    expect(res.balance.ETH).not.toBe('0');
    expect(res.balance.nRLC).toBeDefined();
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
    expect(res.txHash).toBeDefined();
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
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
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
    expect(res.txHash).toBeDefined();
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
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  }, 30000);

  test('[mainchain] iexec account show', async () => {
    const raw = await execAsync(`${iexecPath} account show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.balance).toBeDefined();
    expect(res.balance.stake).not.toBe('0');
    // expect(res.balance.locked).toBe('0');
  }, 10000);

  test('[mainchain] iexec account show [address]', async () => {
    const raw = await execAsync(
      `${iexecPath} account show ${POOR_ADDRESS2} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.balance).toBeDefined();
    expect(res.balance.stake).toBe('0');
    expect(res.balance.locked).toBe('0');
  }, 10000);

  test('[common] iexec account show --wallet-address <address> (missing wallet file)', async () => {
    const raw = await execAsync(
      `${iexecPath} account show --wallet-address ${POOR_ADDRESS1} --raw`,
    ).catch(e => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.error.message).toBe(
      'Failed to load wallet address from keystore: Wallet file not found',
    );
    expect(res.error.name).toBe('Error');
    expect(res.balance).toBeUndefined();
  }, 10000);

  // APP
  test('[common] iexec app init (no wallet)', async () => {
    await execAsync('mv wallet.json wallet.back');
    const raw = await execAsync(`${iexecPath} app init --raw`);
    await execAsync('mv wallet.back wallet.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.app).toBeDefined();
    expect(res.app.owner).not.toBe(ADDRESS);
  });

  test('[common] iexec app init (+ wallet)', async () => {
    const raw = await execAsync(`${iexecPath} app init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.app).toBeDefined();
    expect(res.app.owner).toBe(ADDRESS);
  });

  test('[mainchain] iexec app deploy', async () => {
    await setAppUniqueName();
    const raw = await execAsync(`${iexecPath} app deploy --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
    mainchainApp = res.address;
  }, 15000);

  test('[mainchain] iexec app show (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} app show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(mainchainApp);
    expect(res.app).toBeDefined();
    expect(res.app.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec app show 0 (current user)', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(`${iexecPath} app show 0 --raw`);
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBeDefined();
    expect(res.app).toBeDefined();
    expect(res.app.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec app show [appAddress]', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(`${iexecPath} app show ${mainchainApp} --raw`);
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(mainchainApp);
    expect(res.app).toBeDefined();
    expect(res.app.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec app show 0 --user [address]', async () => {
    await execAsync('mv wallet.json wallet.back');
    const raw = await execAsync(
      `${iexecPath} app show 0 --user ${ADDRESS} --raw`,
    );
    await execAsync('mv wallet.back wallet.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBeDefined();
    expect(res.app).toBeDefined();
    expect(res.app.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec app count (current user)', async () => {
    const raw = await execAsync(`${iexecPath} app count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).toBeDefined();
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
    expect(res.count).toBeDefined();
    expect(res.count).not.toBe('0');
  }, 10000);

  // DATASET
  test('[common] iexec dataset init (no wallet)', async () => {
    await execAsync('mv wallet.json wallet.back');
    const raw = await execAsync(`${iexecPath} dataset init --raw`);
    await execAsync('mv wallet.back wallet.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.dataset).toBeDefined();
    expect(res.dataset.owner).not.toBe(ADDRESS);
  });

  test('[common] iexec dataset init (+ wallet)', async () => {
    const raw = await execAsync(`${iexecPath} dataset init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.dataset).toBeDefined();
    expect(res.dataset.owner).toBe(ADDRESS);
  });

  test('[mainchain] iexec dataset deploy', async () => {
    await setDatasetUniqueName();
    const raw = await execAsync(`${iexecPath} dataset deploy --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
    mainchainDataset = res.address;
  }, 15000);

  test('[mainchain] iexec dataset show (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} dataset show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(mainchainDataset);
    expect(res.dataset).toBeDefined();
    expect(res.dataset.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec dataset show 0 (current user)', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(`${iexecPath} dataset show 0 --raw`);
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBeDefined();
    expect(res.dataset).toBeDefined();
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
    expect(res.dataset).toBeDefined();
    expect(res.dataset.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec dataset show 0 --user [address]', async () => {
    await execAsync('mv wallet.json wallet.back');
    const raw = await execAsync(
      `${iexecPath} dataset show 0 --user ${ADDRESS} --raw`,
    );
    await execAsync('mv wallet.back wallet.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBeDefined();
    expect(res.dataset).toBeDefined();
    expect(res.dataset.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec dataset count (current user)', async () => {
    const raw = await execAsync(`${iexecPath} dataset count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).toBeDefined();
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
    expect(res.count).toBeDefined();
    expect(res.count).not.toBe('0');
  }, 10000);

  // WORKERPOOL
  test('[common] iexec workerpool init (no wallet)', async () => {
    await execAsync('mv wallet.json wallet.back');
    const raw = await execAsync(`${iexecPath} workerpool init --raw`);
    await execAsync('mv wallet.back wallet.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.workerpool).toBeDefined();
    expect(res.workerpool.owner).not.toBe(ADDRESS);
  });

  test('[common] iexec workerpool init (+ wallet)', async () => {
    const raw = await execAsync(`${iexecPath} workerpool init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.workerpool).toBeDefined();
    expect(res.workerpool.owner).toBe(ADDRESS);
  });

  test('[mainchain] iexec workerpool deploy', async () => {
    await setWorkerpoolUniqueDescription();
    const raw = await execAsync(`${iexecPath} workerpool deploy --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
    mainchainWorkerpool = res.address;
  }, 15000);

  test('[mainchain] iexec workerpool show (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} workerpool show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(mainchainWorkerpool);
    expect(res.workerpool).toBeDefined();
    expect(res.workerpool.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec workerpool show 0 (current user)', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(`${iexecPath} workerpool show 0 --raw`);
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBeDefined();
    expect(res.workerpool).toBeDefined();
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
    expect(res.workerpool).toBeDefined();
    expect(res.workerpool.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec workerpool show 0 --user [address]', async () => {
    await execAsync('mv wallet.json wallet.back');
    const raw = await execAsync(
      `${iexecPath} workerpool show 0 --user ${ADDRESS} --raw`,
    );
    await execAsync('mv wallet.back wallet.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBeDefined();
    expect(res.workerpool).toBeDefined();
    expect(res.workerpool.owner).toBe(ADDRESS);
  }, 10000);

  test('[mainchain] iexec workerpool count (current user)', async () => {
    const raw = await execAsync(`${iexecPath} workerpool count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).toBeDefined();
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
    expect(res.count).toBeDefined();
    expect(res.count).not.toBe('0');
  }, 10000);

  // CATEGORY
  test('[common] iexec category init', async () => {
    const raw = await execAsync(`${iexecPath} category init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.category).toBeDefined();
  });

  test('[mainchain] iexec category create', async () => {
    const raw = await execAsync(`${iexecPath} category create --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.catid).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
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
    expect(res.catid).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
    mainchainNoDurationCatid = res.catid.toString();
  });

  test('[mainchain] iexec category show 0', async () => {
    const raw = await execAsync(`${iexecPath} category show 0 --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.index).toBe('0');
    expect(res.category).toBeDefined();
  });

  test('[mainchain] iexec category count', async () => {
    const raw = await execAsync(`${iexecPath} category count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).toBeDefined();
    expect(res.count).not.toBe('0');
  });

  // ORDER
  test('[common] iexec order init (no deployed.json)', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(`${iexecPath} order init --raw`);
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeDefined();
    expect(res.datasetorder).toBeDefined();
    expect(res.workerpoolorder).toBeDefined();
    expect(res.requestorder).toBeDefined();
    expect(res.requestorder.requester).toBe(ADDRESS);
    expect(res.requestorder.beneficiary).toBe(ADDRESS);
  });

  test('[common] iexec order init --app ', async () => {
    const raw = await execAsync(`${iexecPath} order init --app --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeDefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.apporder.app).toBe(mainchainApp);
  });

  test('[common] iexec order init --dataset ', async () => {
    const raw = await execAsync(`${iexecPath} order init --dataset --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeDefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.datasetorder.dataset).toBe(mainchainDataset);
  });

  test('[common] iexec order init --workerpool', async () => {
    const raw = await execAsync(`${iexecPath} order init --workerpool --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeDefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.workerpoolorder.workerpool).toBe(mainchainWorkerpool);
  });

  test('[common] iexec order init --request', async () => {
    const raw = await execAsync(`${iexecPath} order init --request --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeDefined();
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
    expect(res.apporder).toBeDefined();
    expect(res.datasetorder).toBeDefined();
    expect(res.workerpoolorder).toBeDefined();
    expect(res.requestorder).toBeDefined();
    expect(res.apporder.app).toBeDefined();
    expect(res.datasetorder.dataset).toBeDefined();
    expect(res.workerpoolorder.workerpool).toBeDefined();
    expect(res.requestorder.app).toBeDefined();
  }, 30000);

  test('[mainchain] iexec order fill', async () => {
    const raw = await execAsync(`${iexecPath} order fill --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.volume).toBe('1');
    expect(res.dealid).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
    mainchainDealid = res.dealid;
  }, 10000);

  test('[mainchain] iexec order sign --app', async () => {
    const raw = await execAsync(`${iexecPath} order sign --app --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeDefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.apporder.app).toBeDefined();
  }, 10000);

  test('[mainchain] iexec order sign --dataset', async () => {
    const raw = await execAsync(`${iexecPath} order sign --dataset --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeDefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.datasetorder.dataset).toBeDefined();
  }, 10000);

  test('[mainchain] iexec order sign --workerpool', async () => {
    await editWorkerpoolorder({
      category: mainchainNoDurationCatid,
      volume: '6',
    });
    const raw = await execAsync(`${iexecPath} order sign --workerpool --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeDefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.workerpoolorder.workerpool).toBeDefined();
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
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeDefined();
    expect(res.requestorder.app).toBeDefined();
  }, 10000);

  test('[mainchain] iexec order fill (BoT 5)', async () => {
    const raw = await execAsync(`${iexecPath} order fill --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.volume).toBe('5');
    expect(res.dealid).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
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
    expect(res.dealid).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  }, 10000);

  test('[mainchain] iexec order cancel --app', async () => {
    await execAsync(`${iexecPath} order sign --app --raw`);
    const raw = await execAsync(
      `${iexecPath} order cancel --app --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeDefined();
    expect(res.apporder.txHash).toBeDefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.fail).toBeUndefined();
    const tx = await tokenChainRPC.getTransaction(res.apporder.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  }, 10000);

  test('[mainchain] iexec order cancel --dataset', async () => {
    await execAsync(`${iexecPath} order sign --dataset --raw`);
    const raw = await execAsync(
      `${iexecPath} order cancel --dataset --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeDefined();
    expect(res.datasetorder.txHash).toBeDefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.fail).toBeUndefined();
    const tx = await tokenChainRPC.getTransaction(res.datasetorder.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  }, 10000);

  test('[mainchain] iexec order cancel --workerpool', async () => {
    await execAsync(`${iexecPath} order sign --workerpool --raw`);
    const raw = await execAsync(
      `${iexecPath} order cancel --workerpool --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeDefined();
    expect(res.workerpoolorder.txHash).toBeDefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.fail).toBeUndefined();
    const tx = await tokenChainRPC.getTransaction(res.workerpoolorder.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  }, 10000);

  test('[mainchain] iexec order cancel --request', async () => {
    await execAsync(`${iexecPath} order sign --request --raw`);
    const raw = await execAsync(
      `${iexecPath} order cancel --request --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeDefined();
    expect(res.requestorder.txHash).toBeDefined();
    expect(res.fail).toBeUndefined();
    const tx = await tokenChainRPC.getTransaction(res.requestorder.txHash);
    expect(tx).toBeDefined();
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
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeUndefined();
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
    expect(res.deals).toBeDefined();
    expect(res.deals.length).toBe(1);
    expect(res.deals[0].volume).toBe('1');
    expect(res.deals[0].dealid).toBeDefined();
    expect(res.deals[0].txHash).toBeDefined();

    const rawDeal = await execAsync(
      `${iexecPath} deal show ${res.deals[0].dealid} --raw`,
    );
    const resDeal = JSON.parse(rawDeal);
    expect(resDeal.ok).toBe(true);
    expect(resDeal.deal).toBeDefined();
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
    expect(resDeal.deal.tasks['0']).toBeDefined();
  }, 15000);

  test('[common] iexec app run --workerpool --dataset 0x0000000000000000000000000000000000000000', async () => {
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
      `${iexecPath} app run --workerpool --dataset 0x0000000000000000000000000000000000000000 --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.deals).toBeDefined();
    expect(res.deals.length).toBe(1);
    expect(res.deals[0].volume).toBe('1');
    expect(res.deals[0].dealid).toBeDefined();
    expect(res.deals[0].txHash).toBeDefined();

    const rawDeal = await execAsync(
      `${iexecPath} deal show ${res.deals[0].dealid} --raw`,
    );
    const resDeal = JSON.parse(rawDeal);
    expect(resDeal.ok).toBe(true);
    expect(resDeal.deal).toBeDefined();
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
    expect(resDeal.deal.tasks['0']).toBeDefined();
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
      `${iexecPath} app run --workerpool --dataset --params "test params" --tag tee,gpu --category 1 --beneficiary 0x0000000000000000000000000000000000000000 --callback ${POOR_ADDRESS1} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.deals).toBeDefined();
    expect(res.deals.length).toBe(1);
    expect(res.deals[0].volume).toBe('1');
    expect(res.deals[0].dealid).toBeDefined();
    expect(res.deals[0].txHash).toBeDefined();

    const rawDeal = await execAsync(
      `${iexecPath} deal show ${res.deals[0].dealid} --raw`,
    );
    const resDeal = JSON.parse(rawDeal);
    expect(resDeal.ok).toBe(true);
    expect(resDeal.deal).toBeDefined();
    expect(resDeal.deal.app.pointer).toBe(mainchainApp);
    expect(resDeal.deal.app.price).toBe('0');
    expect(resDeal.deal.dataset.pointer).toBe(mainchainDataset);
    expect(resDeal.deal.dataset.price).toBe('0');
    expect(resDeal.deal.workerpool.pointer).toBe(mainchainWorkerpool);
    expect(resDeal.deal.workerpool.price).toBe('0');
    expect(resDeal.deal.category).toBe('1');
    expect(resDeal.deal.params).toBe('test params');
    expect(resDeal.deal.callback).toBe(POOR_ADDRESS1);
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
    expect(resDeal.deal.tasks['0']).toBeDefined();
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
    expect(res.deals).toBeDefined();
    expect(res.deals.length).toBe(1);
    expect(res.deals[0].volume).toBe('1');
    expect(res.deals[0].dealid).toBeDefined();
    expect(res.deals[0].txHash).toBeDefined();
    expect(res.tasks).toBeDefined();
    expect(res.tasks.length).toBe(1);
    expect(res.tasks[0].idx).toBe('0');
    expect(res.tasks[0].taskid).toBeDefined();
    expect(res.tasks[0].dealid).toBe(res.deals[0].dealid);
    expect(res.tasks[0].status).toBe(0);
    expect(res.tasks[0].statusName).toBe('TIMEOUT');
    expect(res.tasks[0].taskTimedOut).toBe(true);
    expect(res.failedTasks).toBeDefined();
    expect(res.failedTasks.length).toBe(1);
    expect(res.failedTasks[0].idx).toBe('0');
    expect(res.failedTasks[0].taskid).toBeDefined();
    expect(res.failedTasks[0].dealid).toBe(res.deals[0].dealid);
    expect(res.failedTasks[0].status).toBe(0);
    expect(res.failedTasks[0].statusName).toBe('TIMEOUT');
    expect(res.failedTasks[0].taskTimedOut).toBe(true);
  }, 15000);

  // DEAL
  test('[mainchain] iexec deal show', async () => {
    const raw = await execAsync(
      `${iexecPath} deal show ${mainchainDealid} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.deal).toBeDefined();
    expect(res.deal.app.pointer).toBe(mainchainApp);
    expect(res.deal.dataset.pointer).toBe(mainchainDataset);
    expect(res.deal.workerpool.pointer).toBe(mainchainWorkerpool);
    expect(res.deal.requester).toBe(ADDRESS);
    expect(res.deal.beneficiary).toBe(ADDRESS);
    expect(res.deal.botFirst).toBe('0');
    expect(res.deal.botSize).toBe('1');
    expect(res.deal.startTime).toBeDefined();
    expect(res.deal.finalTime).toBeDefined();
    expect(res.deal.deadlineReached).toBe(false);
    expect(res.deal.tasks).toBeDefined();
    expect(Object.keys(res.deal.tasks).length).toBe(1);
    expect(res.deal.tasks['0']).toBeDefined();
    mainchainTaskid = res.deal.tasks['0'];
  }, 10000);

  test('[mainchain] iexec deal show (BoT 5)', async () => {
    const raw = await execAsync(
      `${iexecPath} deal show ${mainchainDealidNoDuration} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.deal).toBeDefined();
    expect(res.deal.app.pointer).toBe(mainchainApp);
    expect(res.deal.dataset.pointer).toBe(mainchainDataset);
    expect(res.deal.workerpool.pointer).toBe(mainchainWorkerpool);
    expect(res.deal.requester).toBe(ADDRESS);
    expect(res.deal.beneficiary).toBe(ADDRESS);
    expect(res.deal.botFirst).toBe('0');
    expect(res.deal.botSize).toBe('5');
    expect(res.deal.startTime).toBeDefined();
    expect(res.deal.finalTime).toBeDefined();
    expect(res.deal.deadlineReached).toBe(true);
    expect(res.deal.tasks).toBeDefined();
    expect(Object.keys(res.deal.tasks).length).toBe(5);
    expect(res.deal.tasks['0']).toBeDefined();
    mainchainTaskidNoDuration = res.deal.tasks['0'];
  }, 10000);

  test('[mainchain] iexec deal show --watch (BoT 5 timeout)', async () => {
    const raw = await execAsync(
      `${iexecPath} deal show ${mainchainDealidNoDuration} --watch --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.deal).toBeDefined();
    expect(res.deal.app.pointer).toBe(mainchainApp);
    expect(res.deal.dataset.pointer).toBe(mainchainDataset);
    expect(res.deal.workerpool.pointer).toBe(mainchainWorkerpool);
    expect(res.deal.requester).toBe(ADDRESS);
    expect(res.deal.beneficiary).toBe(ADDRESS);
    expect(res.deal.botFirst).toBe('0');
    expect(res.deal.botSize).toBe('5');
    expect(res.deal.startTime).toBeDefined();
    expect(res.deal.finalTime).toBeDefined();
    expect(res.deal.deadlineReached).toBe(true);
    expect(res.deal.tasks).toBeDefined();
    expect(Object.keys(res.deal.tasks).length).toBe(5);
    expect(res.deal.tasks['0']).toBeDefined();
    expect(res.tasksCount).toBe(5);
    expect(res.completedTasksCount).toBe(0);
    expect(res.failedTasksCount).toBe(5);
    expect(res.tasks.length).toBe(5);
    expect(res.tasks[0].idx).toBe('0');
    expect(res.tasks[0].dealid).toBe(mainchainDealidNoDuration);
    expect(res.tasks[0].taskTimedOut).toBe(true);
    expect(res.tasks[0].statusName).toBe('TIMEOUT');
    expect(res.tasks[1].idx).toBe('1');
    expect(res.tasks[1].dealid).toBe(mainchainDealidNoDuration);
    expect(res.tasks[1].taskTimedOut).toBe(true);
    expect(res.tasks[1].statusName).toBe('TIMEOUT');
    expect(res.tasks[2].idx).toBe('2');
    expect(res.tasks[2].dealid).toBe(mainchainDealidNoDuration);
    expect(res.tasks[2].taskTimedOut).toBe(true);
    expect(res.tasks[2].statusName).toBe('TIMEOUT');
    expect(res.tasks[3].idx).toBe('3');
    expect(res.tasks[3].dealid).toBe(mainchainDealidNoDuration);
    expect(res.tasks[3].taskTimedOut).toBe(true);
    expect(res.tasks[3].statusName).toBe('TIMEOUT');
    expect(res.tasks[4].idx).toBe('4');
    expect(res.tasks[4].dealid).toBe(mainchainDealidNoDuration);
    expect(res.tasks[4].taskTimedOut).toBe(true);
    expect(res.tasks[4].statusName).toBe('TIMEOUT');
    expect(res.failedTasks.length).toBe(5);
    expect(res.failedTasks[0].idx).toBe('0');
    expect(res.failedTasks[0].dealid).toBe(mainchainDealidNoDuration);
    expect(res.failedTasks[0].taskTimedOut).toBe(true);
    expect(res.failedTasks[0].statusName).toBe('TIMEOUT');
    expect(res.failedTasks[1].idx).toBe('1');
    expect(res.failedTasks[1].dealid).toBe(mainchainDealidNoDuration);
    expect(res.failedTasks[1].taskTimedOut).toBe(true);
    expect(res.failedTasks[1].statusName).toBe('TIMEOUT');
    expect(res.failedTasks[2].idx).toBe('2');
    expect(res.failedTasks[2].dealid).toBe(mainchainDealidNoDuration);
    expect(res.failedTasks[2].taskTimedOut).toBe(true);
    expect(res.failedTasks[2].statusName).toBe('TIMEOUT');
    expect(res.failedTasks[3].idx).toBe('3');
    expect(res.failedTasks[3].dealid).toBe(mainchainDealidNoDuration);
    expect(res.failedTasks[3].taskTimedOut).toBe(true);
    expect(res.failedTasks[3].statusName).toBe('TIMEOUT');
    expect(res.failedTasks[4].idx).toBe('4');
    expect(res.failedTasks[4].dealid).toBe(mainchainDealidNoDuration);
    expect(res.failedTasks[4].taskTimedOut).toBe(true);
    expect(res.failedTasks[4].statusName).toBe('TIMEOUT');
  }, 10000);

  test('[mainchain] iexec deal show (no deal)', async () => {
    const fakeDealId = '0x194488f76903579d3a3acd89cb75420d52e31e03ab194a74b95247339cf2180f';
    const raw = await execAsync(
      `${iexecPath} deal show ${fakeDealId} --raw`,
    ).catch(e => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.deal).toBeUndefined();
  }, 10000);

  test('[mainchain] iexec task show (not initialized)', async () => {
    const raw = await execAsync(
      `${iexecPath} task show ${mainchainTaskid} --raw`,
    ).catch(e => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.task).toBeUndefined();
  }, 10000);

  test('[mainchain] iexec task show (initialized)', async () => {
    await initializeTask(tokenChainWallet, hubAddress, mainchainDealid, 0);
    const raw = await execAsync(
      `${iexecPath} task show ${mainchainTaskid} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.task).toBeDefined();
    expect(res.task.dealid).toBe(mainchainDealid);
    expect(res.task.idx).toBe('0');
    expect(res.task.timeref).toBeDefined();
    expect(res.task.contributionDeadline).toBeDefined();
    expect(res.task.contributionDeadline).toBeDefined();
    expect(res.task.finalDeadline).toBeDefined();
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
    await initializeTask(
      tokenChainWallet,
      hubAddress,
      mainchainDealidNoDuration,
      0,
    );
    const raw = await execAsync(
      `${iexecPath} task show ${mainchainTaskidNoDuration} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.task).toBeDefined();
    expect(res.task.dealid).toBe(mainchainDealidNoDuration);
    expect(res.task.idx).toBe('0');
    expect(res.task.timeref).toBeDefined();
    expect(res.task.contributionDeadline).toBeDefined();
    expect(res.task.contributionDeadline).toBeDefined();
    expect(res.task.finalDeadline).toBeDefined();
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
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  }, 10000);

  test('[mainchain] iexec task show (claimed)', async () => {
    const raw = await execAsync(
      `${iexecPath} task show ${mainchainTaskidNoDuration} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.task).toBeDefined();
    expect(res.task.dealid).toBe(mainchainDealidNoDuration);
    expect(res.task.idx).toBe('0');
    expect(res.task.timeref).toBeDefined();
    expect(res.task.contributionDeadline).toBeDefined();
    expect(res.task.contributionDeadline).toBeDefined();
    expect(res.task.finalDeadline).toBeDefined();
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
    await initializeTask(
      tokenChainWallet,
      hubAddress,
      mainchainDealidNoDuration,
      2,
    );
    const raw = await execAsync(
      `${iexecPath} deal claim ${mainchainDealidNoDuration} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.transactions).toBeDefined();
    expect(res.transactions.length).toBe(2);
    expect(res.transactions[0].type).toBe('claimArray');
    expect(res.transactions[1].type).toBe('initializeAndClaimArray');
    expect(res.claimed).toBeDefined();
    expect(Object.keys(res.claimed).length).toBe(4);
    expect(res.claimed['1']).toBeDefined();
    expect(res.claimed['2']).toBeDefined();
    expect(res.claimed['3']).toBeDefined();
    expect(res.claimed['4']).toBeDefined();
    const claimArrayTx = await tokenChainRPC.getTransaction(
      res.transactions[0].txHash,
    );
    expect(claimArrayTx).toBeDefined();
    expect(claimArrayTx.gasPrice.toString()).toBe(chainGasPrice);
    const initializeAndClaimArrayTx = await tokenChainRPC.getTransaction(
      res.transactions[0].txHash,
    );
    expect(initializeAndClaimArrayTx).toBeDefined();
    expect(initializeAndClaimArrayTx.gasPrice.toString()).toBe(chainGasPrice);
  }, 10000);

  // sendETH
  test('[mainchain] iexec wallet sendETH', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet sendETH 1 --to ${POOR_ADDRESS1} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS);
    expect(res.to).toBe(POOR_ADDRESS1);
    expect(res.amount).toBe('1');
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  }, 10000);

  // sendRLC
  test('[mainchain] iexec wallet sendRLC', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet sendRLC 1000000000 --to ${POOR_ADDRESS1} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS);
    expect(res.to).toBe(POOR_ADDRESS1);
    expect(res.amount).toBe('1000000000');
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(chainGasPrice);
  }, 10000);

  test('[mainchain] iexec wallet sweep', async () => {
    execAsync('cp inputs/wallet/wallet2.json wallet.json');
    const raw = await execAsync(
      `${iexecPath} wallet sweep --to ${ADDRESS} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(POOR_ADDRESS1);
    expect(res.to).toBe(ADDRESS);
    expect(res.sendERC20TxHash).toBeDefined();
    expect(res.sendNativeTxHash).toBeDefined();
    expect(res.errors).toBeUndefined();
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
    chains.chains.dev.host = nativeChainUrl;
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
    // expect(res.pocoVersion).toBeDefined();
    expect(res.appRegistryAddress).toBeDefined();
    expect(res.datasetRegistryAddress).toBeDefined();
    expect(res.workerpoolRegistryAddress).toBeDefined();
    expect(res.rlcAddress).toBeUndefined();
    expect(res.useNative).toBe(true);
  });

  test('[sidechain] iexec wallet show ', async () => {
    const raw = await execAsync(`${iexecPath} wallet show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.balance.nRLC.substr(0, 2)).not.toBe('0');
    expect(res.balance.ETH).toBeUndefined();
  });

  test('[sidechain] iexec wallet sendETH', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet sendETH 0.1 --to ${POOR_ADDRESS1} --force --raw`,
    ).catch(e => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
  }, 10000);

  test('[sidechain] iexec wallet sendRLC', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet sendRLC 1000000000 --to ${POOR_ADDRESS1} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS);
    expect(res.to).toBe(POOR_ADDRESS1);
    expect(res.amount).toBe('1000000000');
    expect(res.txHash).toBeDefined();
    const tx = await nativeChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
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
    expect(res.txHash).toBeDefined();
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
    const tx = await nativeChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
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
    expect(res.txHash).toBeDefined();
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
    const tx = await nativeChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(nativeChainGasPrice);
  }, 30000);

  test('[common] iexec app init', async () => {
    const raw = await execAsync(`${iexecPath} app init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.app).toBeDefined();
    expect(res.app.owner).toBe(ADDRESS);
  });

  test('[sidechain] iexec app deploy', async () => {
    await setAppUniqueName();
    const raw = await execAsync(`${iexecPath} app deploy --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await nativeChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
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
    expect(res.app).toBeDefined();
    expect(res.app.owner).toBe(ADDRESS);
  }, 10000);

  test('[sidechain] iexec app show (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} app show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(sidechainApp);
    expect(res.app).toBeDefined();
    expect(res.app.owner).toBe(ADDRESS);
  }, 10000);

  test('[sidechain] iexec app count (current user)', async () => {
    const raw = await execAsync(`${iexecPath} app count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).toBeDefined();
    expect(res.count).not.toBe('0');
  }, 10000);

  test('[common] iexec dataset init', async () => {
    const raw = await execAsync(`${iexecPath} dataset init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.dataset).toBeDefined();
    expect(res.dataset.owner).toBe(ADDRESS);
  });

  test('[sidechain] iexec dataset deploy', async () => {
    await setDatasetUniqueName();
    const raw = await execAsync(`${iexecPath} dataset deploy --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await nativeChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
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
    expect(res.dataset).toBeDefined();
    expect(res.dataset.owner).toBe(ADDRESS);
  }, 10000);

  test('[sidechain] iexec dataset show (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} dataset show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(sidechainDataset);
    expect(res.dataset).toBeDefined();
    expect(res.dataset.owner).toBe(ADDRESS);
  }, 10000);

  test('[sidechain] iexec dataset count (current user)', async () => {
    const raw = await execAsync(`${iexecPath} dataset count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).toBeDefined();
    expect(res.count).not.toBe('0');
  }, 10000);

  test('[common] iexec workerpool init', async () => {
    const raw = await execAsync(`${iexecPath} workerpool init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.workerpool).toBeDefined();
    expect(res.workerpool.owner).toBe(ADDRESS);
  });

  test('[sidechain] iexec workerpool deploy', async () => {
    await setWorkerpoolUniqueDescription();
    const raw = await execAsync(`${iexecPath} workerpool deploy --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await nativeChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
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
    expect(res.workerpool).toBeDefined();
    expect(res.workerpool.owner).toBe(ADDRESS);
  }, 10000);

  test('[sidechain] iexec workerpool show (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} workerpool show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(sidechainWorkerpool);
    expect(res.workerpool).toBeDefined();
    expect(res.workerpool.owner).toBe(ADDRESS);
  }, 10000);

  test('[sidechain] iexec workerpool count (current user)', async () => {
    const raw = await execAsync(`${iexecPath} workerpool count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).toBeDefined();
    expect(res.count).not.toBe('0');
  }, 10000);

  // CATEGORY
  test('[common] iexec category init', async () => {
    const raw = await execAsync(`${iexecPath} category init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.category).toBeDefined();
  });

  test('[sidechain] iexec category create', async () => {
    const raw = await execAsync(`${iexecPath} category create --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.catid).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await nativeChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
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
    expect(res.catid).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await nativeChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(nativeChainGasPrice);
    sidechainNoDurationCatid = res.catid.toString();
  });

  test('[sidechain] iexec category show 0', async () => {
    const raw = await execAsync(`${iexecPath} category show 0 --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.index).toBe('0');
    expect(res.category).toBeDefined();
  });

  test('[sidechain] iexec category count', async () => {
    const raw = await execAsync(`${iexecPath} category count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).toBeDefined();
    expect(res.count).not.toBe('0');
  });

  test('[common] iexec order init (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} order init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeDefined();
    expect(res.datasetorder).toBeDefined();
    expect(res.workerpoolorder).toBeDefined();
    expect(res.requestorder).toBeDefined();
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
    expect(res.apporder).toBeDefined();
    expect(res.datasetorder).toBeDefined();
    expect(res.workerpoolorder).toBeDefined();
    expect(res.requestorder).toBeDefined();
    expect(res.apporder.app).toBeDefined();
    expect(res.datasetorder.dataset).toBeDefined();
    expect(res.workerpoolorder.workerpool).toBeDefined();
    expect(res.requestorder.app).toBeDefined();
  }, 30000);

  test('[sidechain] iexec order fill', async () => {
    const raw = await execAsync(`${iexecPath} order fill --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.volume).toBe('1');
    expect(res.dealid).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await nativeChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
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
    expect(res.dealid).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await nativeChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(nativeChainGasPrice);
    sidechainDealidNoDuration = res.dealid;
  }, 20000);

  test('[sidechain] iexec order cancel --app --dataset --workerpool --request', async () => {
    await execAsync(
      `${iexecPath} order sign --app --dataset --workerpool --request --force --raw`,
    );
    const raw = await execAsync(
      `${iexecPath} order cancel --app --dataset --workerpool --request --force --raw`,
    ).catch(e => e);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeDefined();
    expect(res.apporder.txHash).toBeDefined();
    expect(res.datasetorder).toBeDefined();
    expect(res.datasetorder.txHash).toBeDefined();
    expect(res.workerpoolorder).toBeDefined();
    expect(res.workerpoolorder.txHash).toBeDefined();
    expect(res.requestorder).toBeDefined();
    expect(res.requestorder.txHash).toBeDefined();
    expect(res.fail).toBeUndefined();
    const cancelAppordertx = await nativeChainRPC.getTransaction(
      res.apporder.txHash,
    );
    expect(cancelAppordertx).toBeDefined();
    expect(cancelAppordertx.gasPrice.toString()).toBe(nativeChainGasPrice);
    const cancelDatasetordertx = await nativeChainRPC.getTransaction(
      res.datasetorder.txHash,
    );
    expect(cancelDatasetordertx).toBeDefined();
    expect(cancelDatasetordertx.gasPrice.toString()).toBe(nativeChainGasPrice);
    const cancelWorkerpoolordertx = await nativeChainRPC.getTransaction(
      res.workerpoolorder.txHash,
    );
    expect(cancelWorkerpoolordertx).toBeDefined();
    expect(cancelWorkerpoolordertx.gasPrice.toString()).toBe(
      nativeChainGasPrice,
    );
    const cancelRequestordertx = await nativeChainRPC.getTransaction(
      res.requestorder.txHash,
    );
    expect(cancelRequestordertx).toBeDefined();
    expect(cancelRequestordertx.gasPrice.toString()).toBe(nativeChainGasPrice);
  }, 10000);

  test('[sidechain] iexec deal show', async () => {
    const raw = await execAsync(
      `${iexecPath} deal show ${sidechainDealid} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.deal).toBeDefined();
    expect(res.deal.app.pointer).toBe(sidechainApp);
    expect(res.deal.dataset.pointer).toBe(sidechainDataset);
    expect(res.deal.workerpool.pointer).toBe(sidechainWorkerpool);
    expect(res.deal.requester).toBe(ADDRESS);
    expect(res.deal.beneficiary).toBe(ADDRESS);
    expect(res.deal.botFirst).toBe('0');
    expect(res.deal.botSize).toBe('1');
    expect(res.deal.startTime).toBeDefined();
    expect(res.deal.finalTime).toBeDefined();
    expect(res.deal.deadlineReached).toBe(false);
    expect(res.deal.tasks).toBeDefined();
    expect(Object.keys(res.deal.tasks).length).toBe(1);
    expect(res.deal.tasks['0']).toBeDefined();
    sidechainTaskid = res.deal.tasks['0'];
  }, 10000);

  test('[sidechain] iexec deal show (BoT 5)', async () => {
    const raw = await execAsync(
      `${iexecPath} deal show ${sidechainDealidNoDuration} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.deal).toBeDefined();
    expect(res.deal.app.pointer).toBe(sidechainApp);
    expect(res.deal.dataset.pointer).toBe(sidechainDataset);
    expect(res.deal.workerpool.pointer).toBe(sidechainWorkerpool);
    expect(res.deal.requester).toBe(ADDRESS);
    expect(res.deal.beneficiary).toBe(ADDRESS);
    expect(res.deal.botFirst).toBe('0');
    expect(res.deal.botSize).toBe('5');
    expect(res.deal.startTime).toBeDefined();
    expect(res.deal.finalTime).toBeDefined();
    expect(res.deal.deadlineReached).toBe(true);
    expect(res.deal.tasks).toBeDefined();
    expect(Object.keys(res.deal.tasks).length).toBe(5);
    expect(res.deal.tasks['0']).toBeDefined();
    sidechainTaskidNoDuration = res.deal.tasks['2'];
  }, 10000);

  test('[sidechain] iexec deal show (no deal)', async () => {
    const fakeDealId = '0x194488f76903579d3a3acd89cb75420d52e31e03ab194a74b95247339cf2180f';
    const raw = await execAsync(
      `${iexecPath} deal show ${fakeDealId} --raw`,
    ).catch(e => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.deal).toBeUndefined();
  }, 10000);

  test('[sidechain] iexec task show (not initialized)', async () => {
    const raw = await execAsync(
      `${iexecPath} task show ${sidechainTaskid} --raw`,
    ).catch(e => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.task).toBeUndefined();
  }, 10000);

  test('[sidechain] iexec task show (initialized)', async () => {
    await initializeTask(
      nativeChainWallet,
      nativeHubAddress,
      sidechainDealid,
      0,
    );
    const raw = await execAsync(
      `${iexecPath} task show ${sidechainTaskid} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.task).toBeDefined();
    expect(res.task.dealid).toBe(sidechainDealid);
    expect(res.task.idx).toBe('0');
    expect(res.task.timeref).toBeDefined();
    expect(res.task.contributionDeadline).toBeDefined();
    expect(res.task.contributionDeadline).toBeDefined();
    expect(res.task.finalDeadline).toBeDefined();
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
    await initializeTask(
      nativeChainWallet,
      nativeHubAddress,
      sidechainDealidNoDuration,
      2,
    );
    const raw = await execAsync(
      `${iexecPath} task show ${sidechainTaskidNoDuration} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.task).toBeDefined();
    expect(res.task.dealid).toBe(sidechainDealidNoDuration);
    expect(res.task.idx).toBe('2');
    expect(res.task.timeref).toBeDefined();
    expect(res.task.contributionDeadline).toBeDefined();
    expect(res.task.contributionDeadline).toBeDefined();
    expect(res.task.finalDeadline).toBeDefined();
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
    expect(res.txHash).toBeDefined();
    const tx = await nativeChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(nativeChainGasPrice);
  }, 10000);

  test('[sidechain] iexec task show (claimed)', async () => {
    const raw = await execAsync(
      `${iexecPath} task show ${sidechainTaskidNoDuration} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.task).toBeDefined();
    expect(res.task.dealid).toBe(sidechainDealidNoDuration);
    expect(res.task.idx).toBe('2');
    expect(res.task.timeref).toBeDefined();
    expect(res.task.contributionDeadline).toBeDefined();
    expect(res.task.contributionDeadline).toBeDefined();
    expect(res.task.finalDeadline).toBeDefined();
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
    await initializeTask(
      nativeChainWallet,
      nativeHubAddress,
      sidechainDealidNoDuration,
      1,
    );
    const raw = await execAsync(
      `${iexecPath} deal claim ${sidechainDealidNoDuration} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.transactions).toBeDefined();
    expect(res.transactions.length).toBe(2);
    expect(res.transactions[0].type).toBe('claimArray');
    expect(res.transactions[1].type).toBe('initializeAndClaimArray');
    expect(res.claimed).toBeDefined();
    expect(Object.keys(res.claimed).length).toBe(4);
    expect(res.claimed['0']).toBeDefined();
    expect(res.claimed['1']).toBeDefined();
    expect(res.claimed['3']).toBeDefined();
    expect(res.claimed['4']).toBeDefined();
    const claimArrayTx = await nativeChainRPC.getTransaction(
      res.transactions[0].txHash,
    );
    expect(claimArrayTx).toBeDefined();
    expect(claimArrayTx.gasPrice.toString()).toBe(nativeChainGasPrice);
    const initializeAndClaimArrayTx = await nativeChainRPC.getTransaction(
      res.transactions[0].txHash,
    );
    expect(initializeAndClaimArrayTx).toBeDefined();
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
    expect(res.from).toBe(POOR_ADDRESS1);
    expect(res.to).toBe(ADDRESS);
    expect(res.sendERC20TxHash).toBeUndefined();
    expect(res.sendNativeTxHash).toBeDefined();
    expect(res.errors).toBeUndefined();
  }, 15000);

  test('[sidechain] iexec wallet sweep (empty wallet)', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet sweep --to ${ADDRESS} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(POOR_ADDRESS1);
    expect(res.to).toBe(ADDRESS);
    expect(res.sendERC20TxHash).toBeUndefined();
    expect(res.sendNativeTxHash).toBeUndefined();
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
    expect(res.walletAddress).toBeDefined();
    expect(res.walletFile).toBeDefined();
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
    expect(res.walletAddress).toBeUndefined();
    expect(res.walletFile).toBeUndefined();
    expect(res.configFile).toBe('iexec.json');
    expect(res.chainConfigFile).toBe('chain.json');
    expect(await checkExists(filePath('iexec.json'))).toBe(true);
    expect(await checkExists(filePath('chain.json'))).toBe(true);
  }, 10000);

  test('check update (no --raw)', async () => {
    await expect(
      execAsync(`${iexecPath} init --skip-wallet --force`),
    ).resolves.toBeDefined();
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
      chains.chains.dev.host = tokenChainUrl;
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
      expect(res.wallet).toBeDefined();
      expect(res.address).toBe(ADDRESS);
      expect(res.fileName).toBeDefined();
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
      expect(res.wallet).toBeDefined();
      expect(res.fileName).toBeDefined();
    }, 10000);

    test('iexec wallet show --wallet-addres <address>', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --password test --wallet-address ${ADDRESS} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(ADDRESS);
      expect(res.wallet.publicKey).toBeUndefined();
      expect(res.wallet.privateKey).toBeUndefined();
      expect(res.balance.ETH).toBeDefined();
      expect(res.balance.nRLC).toBeDefined();
    }, 10000);

    test('iexec wallet show --show-private-key --wallet-addres <address>', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --show-private-key --password test --wallet-address ${ADDRESS} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(ADDRESS);
      expect(res.wallet.publicKey).toBe(PUBLIC_KEY);
      expect(res.wallet.privateKey).toBe(PRIVATE_KEY);
      expect(res.balance.ETH).toBeDefined();
      expect(res.balance.nRLC).toBeDefined();
    }, 10000);

    test('iexec wallet show --wallet-file <fileName>', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --password test --wallet-file ${importedWalletName} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(ADDRESS);
      expect(res.wallet.publicKey).toBeUndefined();
      expect(res.wallet.privateKey).toBeUndefined();
      expect(res.balance.ETH).toBeDefined();
      expect(res.balance.nRLC).toBeDefined();
    }, 10000);

    test('iexec wallet show --show-private-key --wallet-address <address> (wrong password)', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --show-private-key --password fail --wallet-address ${ADDRESS} --raw`,
      ).catch(e => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe('invalid password');
      expect(res.error.name).toBe('Error');
      expect(res.wallet).toBeUndefined();
      expect(res.balance).toBeUndefined();
    }, 10000);

    test('iexec wallet show --wallet-address <address> (missing wallet file)', async () => {
      const raw = await execAsync(
        `${iexecPath}  wallet show --wallet-address ${POOR_ADDRESS1} --raw`,
      ).catch(e => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe(
        'Failed to load wallet address from keystore: Wallet file not found',
      );
      expect(res.error.name).toBe('Error');
      expect(res.wallet).toBeUndefined();
      expect(res.balance).toBeUndefined();
    }, 10000);

    // keystoredir custom
    test('iexec wallet import --keystoredir [path]', async () => {
      await execAsync(
        'rm -rf out/keystore && mkdir out/keystore',
      ).catch(() => {});
      const raw = await execAsync(
        `${iexecPath}  wallet import ${POOR_PRIVATE_KEY1} --password customPath --keystoredir ./out/keystore --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.address).toBe(POOR_ADDRESS1);
      expect(res.fileName.indexOf('out/keystore/')).not.toBe(-1);
    }, 10000);

    test('iexec wallet show --keystoredir [path]', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --password customPath --keystoredir ./out/keystore --wallet-address ${POOR_ADDRESS1} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(POOR_ADDRESS1);
    }, 10000);

    // keystoredir local
    test('iexec wallet import --keystoredir local', async () => {
      await execAsync(
        'rm -rf out/keystore && mkdir out/keystore',
      ).catch(() => {});
      const raw = await execAsync(
        `${iexecPath} wallet import ${POOR_PRIVATE_KEY2} --password 'my local pass phrase' --keystoredir local --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.address).toBe(POOR_ADDRESS2);
      expect(res.fileName.indexOf('/')).toBe(-1);
      localWalletFileName = res.fileName;
    }, 10000);

    test('iexec wallet show --keystoredir [path]', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --password 'my local pass phrase' --keystoredir local --wallet-address ${POOR_ADDRESS2} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(POOR_ADDRESS2);
    }, 10000);

    // unencrypted
    test('iexec wallet import --unencrypted', async () => {
      await execAsync('rm wallet.json').catch(() => {});
      const raw = await execAsync(
        `${iexecPath} wallet import ${POOR_PRIVATE_KEY1} --unencrypted --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet.privateKey).toBe(POOR_PRIVATE_KEY1);
      expect(res.wallet.address).toBe(POOR_ADDRESS1);
      expect(res.address).toBe(POOR_ADDRESS1);
      expect(res.fileName.indexOf('/')).toBe(-1);
      expect(await checkExists(filePath('wallet.json'))).toBe(true);
    }, 10000);

    test('iexec wallet show (unencrypted wallet.json)', async () => {
      const raw = await execAsync(`${iexecPath} wallet show --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(POOR_ADDRESS1);
    }, 10000);

    test('iexec wallet show [address]', async () => {
      const raw = await execAsync(`${iexecPath} wallet show ${ADDRESS} --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.balance).toBeDefined();
      expect(res.balance.ETH).toBeDefined();
      expect(res.balance.nRLC).toBeDefined();
      expect(res.balance.ETH).not.toBe('0');
      expect(res.balance.nRLC).not.toBe('0');
      expect(res.wallet).toBeUndefined();
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
      expect(res.balance).toBeDefined();
      expect(res.balance.ETH).toBeDefined();
      expect(res.balance.nRLC).toBeDefined();
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
      chains.chains.dev.host = tokenChainUrl;
      chains.chains.dev.id = networkId;
      await saveJSONToFile(chains, 'chain.json');
      await execAsync('cp inputs/wallet/wallet.json wallet.json');
    });
    test('tx --gas-price 1000000001', async () => {
      const raw = await execAsync(
        `${iexecPath} account deposit 1 --gas-price 1000000001 --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.txHash).toBeDefined();
      const tx = await tokenChainRPC.getTransaction(res.txHash);
      expect(tx).toBeDefined();
      expect(tx.gasPrice.toString()).toBe('1000000001');
    });
    test('tx --gas-price 0', async () => {
      const raw = await execAsync(
        `${iexecPath} account deposit 1 --gas-price 0 --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.txHash).toBeDefined();
      const tx = await tokenChainRPC.getTransaction(res.txHash);
      expect(tx).toBeDefined();
      expect(tx.gasPrice.toString()).toBe('0');
    });
    test('tx --gas-price -1 (invalid gas-price)', async () => {
      const raw = await execAsync(
        `${iexecPath} account deposit 1 --gas-price -1 --raw`,
      ).catch(e => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.txHash).toBeUndefined();
    });
  });

  describe('[dataset encryption]', () => {
    beforeAll(async () => {
      await execAsync(`${iexecPath} init --skip-wallet --force`);
      const chains = await loadJSONFile('chain.json');
      chains.default = chainName;
      chains.chains.dev.hub = hubAddress;
      chains.chains.dev.host = tokenChainUrl;
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
      expect(res.encryptedDatasetFolderPath).toBeDefined();
      expect(res.secretPath).toBeDefined();
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
      expect(res.encryptedDatasetFolderPath).toBeDefined();
      expect(res.secretPath).toBeDefined();
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
        expect(res.encryptedDatasetFolderPath).toBeDefined();
        expect(res.secretPath).toBeDefined();
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

    if (!DRONE) {
      // this test require nexus.iex.ec image
      test('iexec dataset push-secret', async () => {
        await setRichWallet();
        await execAsync('mkdir -p .secrets/datasets/').catch(() => {});
        await execAsync('echo oops > ./.secrets/datasets/dataset.secret');
        const randomAddress = getRandomAddress();
        const resPushNotAllowed = JSON.parse(
          await execAsync(
            `${iexecPath} dataset push-secret ${randomAddress} --raw`,
          ).catch(e => e.message),
        );
        expect(resPushNotAllowed.ok).toBe(false);
        expect(resPushNotAllowed.error.message).toBe(
          `wallet ${ADDRESS} is not allowed to set secret for ${randomAddress}`,
        );
        await execAsync(`${iexecPath} dataset init`);
        await setDatasetUniqueName();
        const { address } = JSON.parse(
          await execAsync(`${iexecPath} dataset deploy --raw`),
        );
        const resPush = JSON.parse(
          await execAsync(`${iexecPath} dataset push-secret --raw`),
        );
        expect(resPush.ok).toBe(true);
        const resAlreadyExists = JSON.parse(
          await execAsync(`${iexecPath} dataset push-secret --raw`).catch(
            e => e.message,
          ),
        );
        expect(resAlreadyExists.ok).toBe(false);
        expect(resAlreadyExists.error.message).toBe(
          `secret already exists for ${address} and can't be updated`,
        );
      }, 10000);

      test('iexec dataset check-secret', async () => {
        await setRichWallet();
        await execAsync('mkdir -p .secrets/datasets/').catch(() => {});
        await execAsync('echo oops > ./.secrets/datasets/dataset.secret');
        await execAsync(`${iexecPath} dataset init`);
        await setDatasetUniqueName();
        await execAsync(`${iexecPath} dataset deploy --raw`);
        const resMyDataset = JSON.parse(
          await execAsync(`${iexecPath} dataset check-secret --raw`),
        );
        expect(resMyDataset.ok).toBe(true);
        expect(resMyDataset.isSecretSet).toBe(false);
        await execAsync(`${iexecPath} dataset push-secret --raw`);
        const rawAlreadyExists = await execAsync(
          `${iexecPath} dataset check-secret --raw`,
        );
        const resAlreadyExists = JSON.parse(rawAlreadyExists);
        expect(resAlreadyExists.ok).toBe(true);
        expect(resAlreadyExists.isSecretSet).toBe(true);
        const rawRandomDataset = await execAsync(
          `${iexecPath} dataset check-secret ${getRandomAddress()} --raw`,
        );
        const resRandomDataset = JSON.parse(rawRandomDataset);
        expect(resRandomDataset.ok).toBe(true);
        expect(resRandomDataset.isSecretSet).toBe(false);
      }, 15000);
    }
  });

  describe('[result]', () => {
    beforeAll(async () => {
      await execAsync(`${iexecPath} init --skip-wallet --force`);
      const chains = await loadJSONFile('chain.json');
      chains.default = chainName;
      chains.chains.dev.hub = hubAddress;
      chains.chains.dev.host = tokenChainUrl;
      chains.chains.dev.id = networkId;
      await saveJSONToFile(chains, 'chain.json');
      await execAsync('cp inputs/wallet/wallet.json wallet.json');
    });
    if (semver.gt('v10.12.0', process.version)) {
      test('iexec result generate-encryption-keypair (node version < v10.12.0)', async () => {
        const raw = await execAsync(
          `${iexecPath} result generate-encryption-keypair --force --raw`,
        ).catch(e => e.message);
        const res = JSON.parse(raw);
        expect(res.ok).toBe(false);
        expect(res.secretPath).toBeUndefined();
        expect(res.privateKeyFile).toBeUndefined();
        expect(res.publicKeyFile).toBeUndefined();
        expect(res.error.name).toBe('Error');
        expect(
          res.error.message.indexOf(
            'Minimum node version to use this command is v10.12.0, found v',
          ),
        ).not.toBe(-1);
      });
      test('iexec result generate-keys (v4 legacy name) (node version < v10.12.0)', async () => {
        const raw = await execAsync(
          `${iexecPath} result generate-keys --force --raw`,
        ).catch(e => e.message);
        const res = JSON.parse(raw);
        expect(res.ok).toBe(false);
        expect(res.secretPath).toBeUndefined();
        expect(res.privateKeyFile).toBeUndefined();
        expect(res.publicKeyFile).toBeUndefined();
        expect(res.error.name).toBe('Error');
        expect(
          res.error.message.indexOf(
            'Minimum node version to use this command is v10.12.0, found v',
          ),
        ).not.toBe(-1);
      });
    } else {
      test('iexec result generate-encryption-keypair', async () => {
        const raw = await execAsync(
          `${iexecPath} result generate-encryption-keypair --force --raw`,
        );
        const res = JSON.parse(raw);
        expect(res.ok).toBe(true);
        expect(res.secretPath).toBeDefined();
        expect(res.secretPath.indexOf('.secrets/beneficiary')).not.toBe(-1);
        expect(res.privateKeyFile).toBe(
          '0x7bd4783FDCAD405A28052a0d1f11236A741da593_key',
        );
        expect(res.publicKeyFile).toBe(
          '0x7bd4783FDCAD405A28052a0d1f11236A741da593_key.pub',
        );
      }, 10000);

      test('iexec result generate-keys (v4 legacy name)', async () => {
        const raw = await execAsync(
          `${iexecPath} result generate-keys --force --raw`,
        );
        const res = JSON.parse(raw);
        expect(res.ok).toBe(true);
        expect(res.secretPath).toBeDefined();
        expect(res.secretPath.indexOf('.secrets/beneficiary')).not.toBe(-1);
        expect(res.privateKeyFile).toBe(
          '0x7bd4783FDCAD405A28052a0d1f11236A741da593_key',
        );
        expect(res.publicKeyFile).toBe(
          '0x7bd4783FDCAD405A28052a0d1f11236A741da593_key.pub',
        );
      }, 10000);
    }

    if (!DRONE) {
      // this test require nexus.iex.ec image
      test('iexec result push-encryption-key', async () => {
        const { privateKey, publicKey, address } = getRandomWallet();
        await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
        await execAsync('mkdir -p .secrets/beneficiary/').catch(() => {});
        await execAsync(
          `cp ./inputs/beneficiaryKeys/key.pub ./.secrets/beneficiary/${address}_key.pub`,
        );
        const raw = await execAsync(
          `${iexecPath} result push-encryption-key --raw`,
        );
        const res = JSON.parse(raw);
        expect(res.ok).toBe(true);
        expect(res.isPushed).toBe(true);
        expect(res.isUpdated).toBe(false);
        const rawAlreadyExists = await execAsync(
          `${iexecPath} result push-encryption-key --raw`,
        ).catch(e => e.message);
        const resAlreadyExists = JSON.parse(rawAlreadyExists);
        expect(resAlreadyExists.ok).toBe(false);
      }, 10000);

      test('iexec result push-encryption-key --force-update', async () => {
        const { privateKey, publicKey, address } = getRandomWallet();
        await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
        await execAsync('mkdir -p .secrets/beneficiary/').catch(() => {});
        await execAsync(
          `cp ./inputs/beneficiaryKeys/key.pub ./.secrets/beneficiary/${address}_key.pub`,
        );
        const raw = await execAsync(
          `${iexecPath} result push-encryption-key --force-update --raw`,
        );
        const res = JSON.parse(raw);
        expect(res.ok).toBe(true);
        expect(res.isPushed).toBe(true);
        expect(res.isUpdated).toBe(false);
        const rawAlreadyExists = await execAsync(
          `${iexecPath} result push-encryption-key --force-update --raw`,
        );
        const resAlreadyExists = JSON.parse(rawAlreadyExists);
        expect(resAlreadyExists.ok).toBe(true);
        expect(resAlreadyExists.isPushed).toBe(true);
        expect(resAlreadyExists.isUpdated).toBe(true);
      }, 10000);

      test('iexec result push-secret (v4 legacy name)', async () => {
        const { privateKey, publicKey, address } = getRandomWallet();
        await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
        await execAsync('mkdir -p .secrets/beneficiary/').catch(() => {});
        await execAsync(
          `cp ./inputs/beneficiaryKeys/key.pub ./.secrets/beneficiary/${address}_key.pub`,
        );
        const raw = await execAsync(`${iexecPath} result push-secret --raw`);
        const res = JSON.parse(raw);
        expect(res.ok).toBe(true);
      }, 10000);

      test('iexec result check-encryption-key', async () => {
        const { privateKey, publicKey, address } = getRandomWallet();
        const rawUserKey = await execAsync(
          `${iexecPath} result check-encryption-key ${address} --raw`,
        );
        const resUserKey = JSON.parse(rawUserKey);
        expect(resUserKey.ok).toBe(true);
        expect(resUserKey.isEncryptionKeySet).toBe(false);
        await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
        await execAsync('mkdir -p .secrets/beneficiary/').catch(() => {});
        await execAsync(
          `cp ./inputs/beneficiaryKeys/key.pub ./.secrets/beneficiary/${address}_key.pub`,
        );
        const rawMyKey = await execAsync(
          `${iexecPath} result check-encryption-key --raw`,
        );
        const resMyKey = JSON.parse(rawMyKey);
        expect(resMyKey.ok).toBe(true);
        expect(resMyKey.isEncryptionKeySet).toBe(false);
        await execAsync(`${iexecPath} result push-encryption-key --raw`);
        const rawAlreadyExists = await execAsync(
          `${iexecPath} result check-encryption-key --raw`,
        );
        const resAlreadyExists = JSON.parse(rawAlreadyExists);
        expect(resAlreadyExists.ok).toBe(true);
        expect(resAlreadyExists.isEncryptionKeySet).toBe(true);
      }, 10000);

      test('iexec result check-secret (v4 legacy name)', async () => {
        const { privateKey, publicKey, address } = getRandomWallet();
        const rawUserKey = await execAsync(
          `${iexecPath} result check-secret ${address} --raw`,
        );
        const resUserKey = JSON.parse(rawUserKey);
        expect(resUserKey.ok).toBe(true);
        expect(resUserKey.isEncryptionKeySet).toBe(false);
        await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
        await execAsync('mkdir -p .secrets/beneficiary/').catch(() => {});
        await execAsync(
          `cp ./inputs/beneficiaryKeys/key.pub ./.secrets/beneficiary/${address}_key.pub`,
        );
        const rawMyKey = await execAsync(
          `${iexecPath} result check-secret --raw`,
        );
        const resMyKey = JSON.parse(rawMyKey);
        expect(resMyKey.ok).toBe(true);
        expect(resMyKey.isEncryptionKeySet).toBe(false);
        await execAsync(`${iexecPath} result push-encryption-key --raw`);
        const rawAlreadyExists = await execAsync(
          `${iexecPath} result check-secret --raw`,
        );
        const resAlreadyExists = JSON.parse(rawAlreadyExists);
        expect(resAlreadyExists.ok).toBe(true);
        expect(resAlreadyExists.isEncryptionKeySet).toBe(true);
      }, 10000);
    }

    test('iexec result decrypt --force (wrong beneficiary key)', async () => {
      await execAsync('cp inputs/wallet/wallet.json wallet.json');
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
      expect(res.resultsPath).toBeUndefined();
      expect(res.error).toBeDefined();
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
      expect(res.resultsPath).toBeDefined();
      expect(res.resultsPath.indexOf('results.zip')).not.toBe(-1);
    });

    test('iexec result decrypt --beneficiary-keystoredir <path> --beneficiary-key-file <fileName> --force ', async () => {
      const raw = await execAsync(
        `${iexecPath} result decrypt inputs/encryptedResults/encryptedResults.zip --beneficiary-keystoredir inputs/beneficiaryKeys/ --beneficiary-key-file 0xC08C3def622Af1476f2Db0E3CC8CcaeAd07BE3bB_key --force --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.resultsPath).toBeDefined();
      expect(res.resultsPath.indexOf('results.zip')).not.toBe(-1);
    });
  });

  describe('[storage]', () => {
    if (!DRONE) {
      // this test require nexus.iex.ec image
      test('iexec storage init', async () => {
        const { privateKey, publicKey, address } = getRandomWallet();
        await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
        const raw = await execAsync(`${iexecPath} storage init --raw`);
        const res = JSON.parse(raw);
        expect(res.ok).toBe(true);
        expect(res.isInitilized).toBe(true);
        expect(res.isUpdated).toBe(false);
        const rawAlreadyExists = await execAsync(
          `${iexecPath} storage init --raw`,
        ).catch(e => e.message);
        const resAlreadyExists = JSON.parse(rawAlreadyExists);
        expect(resAlreadyExists.ok).toBe(false);
        expect(resAlreadyExists.error.message).toBe(
          'default storage is already initialized, use --force-update option to update your storage token',
        );
      }, 10000);

      test('iexec storage init --force-update', async () => {
        const { privateKey, publicKey, address } = getRandomWallet();
        await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
        const raw = await execAsync(
          `${iexecPath} storage init --force-update --raw`,
        );
        const res = JSON.parse(raw);
        expect(res.ok).toBe(true);
        expect(res.isInitilized).toBe(true);
        expect(res.isUpdated).toBe(false);
        const rawAlreadyExists = await execAsync(
          `${iexecPath} storage init --force-update --raw`,
        );
        const resAlreadyExists = JSON.parse(rawAlreadyExists);
        expect(resAlreadyExists.ok).toBe(true);
        expect(resAlreadyExists.isInitilized).toBe(true);
        expect(resAlreadyExists.isUpdated).toBe(true);
      }, 10000);

      test('iexec storage init dropbox', async () => {
        const { privateKey, publicKey, address } = getRandomWallet();
        await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
        const raw = await execAsync(
          `${iexecPath} storage init dropbox --token oops --raw`,
        );
        const res = JSON.parse(raw);
        expect(res.ok).toBe(true);
        expect(res.isInitilized).toBe(true);
        expect(res.isUpdated).toBe(false);
        const rawAlreadyExists = await execAsync(
          `${iexecPath} storage init dropbox --token oops --raw`,
        ).catch(e => e.message);
        const resAlreadyExists = JSON.parse(rawAlreadyExists);
        expect(resAlreadyExists.ok).toBe(false);
        expect(resAlreadyExists.error.message).toBe(
          'dropbox storage is already initialized, use --force-update option to update your storage token',
        );
      }, 10000);

      test('iexec storage init unsupported', async () => {
        const { privateKey, publicKey, address } = getRandomWallet();
        await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
        const raw = await execAsync(
          `${iexecPath} storage init unsupported --token oops --raw`,
        ).catch(e => e.message);
        const res = JSON.parse(raw);
        expect(res.ok).toBe(false);
        expect(res.error.message).toBe('"unsupported" not supported');
      }, 10000);

      test('iexec storage check', async () => {
        const { privateKey, publicKey, address } = getRandomWallet();
        await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
        const raw = await execAsync(`${iexecPath} storage check --raw`);
        const res = JSON.parse(raw);
        expect(res.ok).toBe(true);
        expect(res.isInitilized).toBe(false);
        await execAsync(`${iexecPath} storage init --raw`);
        const rawAlreadyExists = await execAsync(
          `${iexecPath} storage check --raw`,
        );
        const resAlreadyExists = JSON.parse(rawAlreadyExists);
        expect(resAlreadyExists.ok).toBe(true);
        expect(resAlreadyExists.isInitilized).toBe(true);
      }, 10000);

      test('iexec storage check --user', async () => {
        const { privateKey, publicKey, address } = getRandomWallet();
        const randomAddress = getRandomAddress();
        await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
        const raw = await execAsync(
          `${iexecPath} storage check --user ${randomAddress} --raw`,
        );
        const res = JSON.parse(raw);
        expect(res.ok).toBe(true);
        expect(res.isInitilized).toBe(false);
        await execAsync(`${iexecPath} storage init --raw`);
        const rawAlreadyExists = await execAsync(
          `${iexecPath} storage check --user ${randomAddress} --raw`,
        );
        const resAlreadyExists = JSON.parse(rawAlreadyExists);
        expect(resAlreadyExists.ok).toBe(true);
        expect(resAlreadyExists.isInitilized).toBe(false);
      }, 10000);

      test('iexec storage check dropbox', async () => {
        const { privateKey, publicKey, address } = getRandomWallet();
        await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
        const raw = await execAsync(`${iexecPath} storage check dropbox --raw`);
        const res = JSON.parse(raw);
        expect(res.ok).toBe(true);
        expect(res.isInitilized).toBe(false);
        await execAsync(`${iexecPath} storage init dropbox --token oops --raw`);
        const rawAlreadyExists = await execAsync(
          `${iexecPath} storage check dropbox --raw`,
        );
        const resAlreadyExists = JSON.parse(rawAlreadyExists);
        expect(resAlreadyExists.ok).toBe(true);
        expect(resAlreadyExists.isInitilized).toBe(true);
      }, 10000);

      test('iexec storage check unsupported', async () => {
        const { privateKey, publicKey, address } = getRandomWallet();
        await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
        const raw = await execAsync(
          `${iexecPath} storage check unsupported --raw`,
        ).catch(e => e.message);
        const res = JSON.parse(raw);
        expect(res.ok).toBe(false);
        expect(res.error.message).toBe('"unsupported" not supported');
      }, 10000);
    }
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
      expect(res.fail).toBeUndefined();
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
      expect(res.fail).toBeUndefined();
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
      expect(res.fail).toBeUndefined();
    });
  });

  describe('[mainchains/sidechains config]', () => {
    beforeAll(async () => {
      await execAsync(`${iexecPath} init --skip-wallet --force`);
    });

    test('no "native" overwites in templates', async () => {
      const { chains } = await loadJSONFile('chain.json');
      expect(chains.mainnet.native).toBeUndefined();
      expect(chains.bellecour.native).toBeUndefined();
      expect(chains.kovan.native).toBeUndefined();
      expect(chains.goerli.native).toBeUndefined();
    }, 10000);

    // not deployed yet
    test.skip('mainnet is not native', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show ${ADDRESS} --chain mainnet --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.balance).toBeDefined();
      expect(res.balance.nRLC).toBeDefined();
      expect(res.balance.ETH).toBeDefined();
    }, 10000);

    test.skip('kovan is not native', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show ${ADDRESS} --chain kovan --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.balance).toBeDefined();
      expect(res.balance.nRLC).toBeDefined();
      expect(res.balance.ETH).toBeDefined();
    }, 10000);

    test.skip('goerli is not native', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show ${ADDRESS} --chain goerli --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.balance).toBeDefined();
      expect(res.balance.nRLC).toBeDefined();
      expect(res.balance.ETH).toBeDefined();
    }, 10000);

    test.skip('bellecour is native', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show ${ADDRESS} --chain bellecour --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.balance).toBeDefined();
      expect(res.balance.nRLC).toBeDefined();
      expect(res.balance.ETH).toBeUndefined();
    }, 10000);
  });
});
