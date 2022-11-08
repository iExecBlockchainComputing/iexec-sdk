const semver = require('semver');
const ethers = require('ethers');
const fs = require('fs-extra');
const path = require('path');
const BN = require('bn.js');
const { execAsync } = require('./test-utils');
const { bytes32Regex } = require('../src/common/utils/utils');
const { TEE_FRAMEWORKS } = require('../src/common/utils/constant');

console.log('Node version:', process.version);

const DEFAULT_TIMEOUT = 60000;

jest.setTimeout(DEFAULT_TIMEOUT);

// CONFIG
const { DRONE, INFURA_PROJECT_ID } = process.env;
const iexecPath = DRONE ? 'iexec' : 'node ../src/cli/cmd/iexec.js';

// public chains
console.log('using env INFURA_PROJECT_ID', !!INFURA_PROJECT_ID);
const mainnetHost = INFURA_PROJECT_ID
  ? `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
  : 'mainnet';
const goerliHost = INFURA_PROJECT_ID
  ? `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`
  : 'goerli';
// 1 block / tx
const tokenChainUrl = DRONE
  ? 'http://token-chain:8545'
  : 'http://localhost:8545';
const nativeChainUrl = DRONE
  ? 'http://native-chain:8545'
  : 'http://localhost:18545';
// openethereum node (with ws)
const tokenChainOpenethereumUrl = DRONE
  ? 'http://token-chain-openethereum:8545'
  : 'http://localhost:9545';
// secret management service
const sconeSms = DRONE
  ? 'http://token-sms-scone:13300'
  : 'http://localhost:13301';
const gramineSms = DRONE
  ? 'http://token-sms-gramine:13300'
  : 'http://localhost:13302';

const smsMap = {
  scone: sconeSms,
  gramine: gramineSms,
};
// result proxy
const resultProxyURL = DRONE
  ? 'http://token-result-proxy:13200'
  : 'http://localhost:13200';
// marketplace
const iexecGatewayURL = DRONE
  ? 'http://token-gateway:3000'
  : 'http://localhost:13000';

const nativeChainGasPrice = '0';

const PRIVATE_KEY =
  '0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407';
const PUBLIC_KEY =
  '0x0463b6265f021cc1f249366d5ade5bcdf7d33debe594e9d94affdf1aa02255928490fc2c96990a386499b66d17565de1c12ba8fb4ae3af7539e6c61aa7f0113edd';
const ADDRESS = '0x7bd4783FDCAD405A28052a0d1f11236A741da593';
const POOR_PRIVATE_KEY1 =
  '0xd0c5f29f0e7ebe1d3217096fb06130e217758c90f361d3c52ea26c2a0ecc99fb';
const POOR_ADDRESS1 = '0x650ae1d365369129c326Cd15Bf91793b52B7cf59';
const POOR_PRIVATE_KEY2 =
  '0xcfae38ce58f250c2b5bd28389f42e720c1a8db98ef8eeb0bd4aef2ddf9d56076';
const POOR_ADDRESS2 = '0xA540FCf5f097c3F996e680F5cb266629600F064A';
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const NULL_BYTES32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

const chainId = 65535;
const networkId = `${chainId}`;
const hubAddress = '0xC129e7917b7c7DeDfAa5Fff1FB18d5D7050fE8ca';
const enterpriseHubAddress = '0xb80C02d24791fA92fA8983f15390274698A75D23';
const nativeHubAddress = '0xC129e7917b7c7DeDfAa5Fff1FB18d5D7050fE8ca';
const ensRegistryAddress = '0xaf87b82B01E484f8859c980dE69eC8d09D30F22a';
const ensPublicResolverAddress = '0x464E9FC01C2970173B183D24B43A0FA07e6A072E';

console.log('chainId', chainId);
console.log('hubAddress', hubAddress);
console.log('nativeHubAddress', nativeHubAddress);
console.log('enterpriseHubAddress', enterpriseHubAddress);

// UTILS

const tokenChainRPC = new ethers.providers.JsonRpcProvider(tokenChainUrl);
const tokenChainWallet = new ethers.Wallet(PRIVATE_KEY, tokenChainRPC);

const nativeChainRPC = new ethers.providers.JsonRpcProvider(nativeChainUrl);
const nativeChainWallet = new ethers.Wallet(PRIVATE_KEY, nativeChainRPC);

const filePath = (fileName) => path.join(process.cwd(), fileName);

const loadJSONFile = async (fileName) => {
  const fileJSON = await fs.readFile(filePath(fileName), 'utf8');
  const file = JSON.parse(fileJSON);
  return file;
};

const saveJSONToFile = async (json, fileName) => {
  const text = JSON.stringify(json, null, 2);
  await fs.writeFile(filePath(fileName), text);
};

const checkExists = async (file) => fs.pathExists(file);

const removeWallet = () => fs.remove('./wallet.json').catch(() => {});

const setRichWallet = () =>
  saveJSONToFile(
    {
      privateKey: PRIVATE_KEY,
      publicKey: PUBLIC_KEY,
      address: ADDRESS,
    },
    'wallet.json',
  );

const setPoorWallet1 = () =>
  saveJSONToFile(
    {
      privateKey: POOR_PRIVATE_KEY1,
      publicKey: '',
      address: POOR_ADDRESS1,
    },
    'wallet.json',
  );

const setWallet = async (privateKey) => {
  const wallet = privateKey
    ? new ethers.Wallet(privateKey)
    : ethers.Wallet.createRandom();
  const jsonWallet = {
    privateKey: wallet.privateKey,
    publicKey: wallet.publicKey,
    address: wallet.address,
  };
  await saveJSONToFile(jsonWallet, 'wallet.json');
  return jsonWallet;
};

const setTokenChain = (options) =>
  saveJSONToFile(
    {
      default: 'dev',
      chains: {
        dev: {
          id: networkId,
          host: tokenChainUrl,
          hub: hubAddress,
          sms: smsMap,
          resultProxy: resultProxyURL,
          ensRegistry: ensRegistryAddress,
          ensPublicResolver: ensPublicResolverAddress,
          ...options,
        },
      },
    },
    'chain.json',
  );

const setTokenEnterpriseChain = (defaultChain = 'dev') =>
  saveJSONToFile(
    {
      default: defaultChain,
      chains: {
        dev: {
          id: networkId,
          host: tokenChainUrl,
          hub: hubAddress,
          sms: smsMap,
          resultProxy: resultProxyURL,
          ensRegistry: ensRegistryAddress,
          ensPublicResolver: ensPublicResolverAddress,
          enterprise: {
            enterpriseSwapChainName: 'dev-enterprise',
          },
        },
        'dev-enterprise': {
          id: networkId,
          host: tokenChainUrl,
          hub: enterpriseHubAddress,
          flavour: 'enterprise',
          sms: smsMap,
          resultProxy: resultProxyURL,
          ensRegistry: ensRegistryAddress,
          ensPublicResolver: ensPublicResolverAddress,
          enterprise: {
            enterpriseSwapChainName: 'dev',
          },
        },
      },
    },
    'chain.json',
  );

const setNativeChain = (options) =>
  saveJSONToFile(
    {
      default: 'dev',
      chains: {
        dev: {
          id: networkId,
          host: nativeChainUrl,
          hub: hubAddress,
          native: true,
          useGas: false,
          sms: smsMap,
          resultProxy: resultProxyURL,
          ensRegistry: ensRegistryAddress,
          ensPublicResolver: ensPublicResolverAddress,
          ...options,
        },
      },
    },
    'chain.json',
  );

const setTokenChainOpenethereum = (options) =>
  saveJSONToFile(
    {
      default: 'dev',
      chains: {
        dev: {
          id: networkId,
          host: tokenChainOpenethereumUrl,
          hub: hubAddress,
          sms: smsMap,
          resultProxy: resultProxyURL,
          ensRegistry: ensRegistryAddress,
          ensPublicResolver: ensPublicResolverAddress,
          ...options,
        },
      },
    },
    'chain.json',
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
  iexecJson.order.requestorder.category =
    category || iexecJson.order.requestorder.category;
  iexecJson.order.requestorder.volume =
    volume || iexecJson.order.requestorder.volume;
  await saveJSONToFile(iexecJson, 'iexec.json');
};

const editWorkerpoolorder = async ({ category, volume }) => {
  const iexecJson = await loadJSONFile('iexec.json');
  iexecJson.order.workerpoolorder.category =
    category || iexecJson.order.workerpoolorder.category;
  iexecJson.order.workerpoolorder.volume =
    volume || iexecJson.order.workerpoolorder.volume;
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
  await execAsync('rm -r test/out').catch(() => {});
  await execAsync('rm -r test/datasets').catch(() => {});
  await execAsync('rm -r test/.secrets').catch(() => {});
  await execAsync('rm test/chain.json').catch(() => {});
  await execAsync('rm test/iexec.json').catch(() => {});
  await execAsync('rm test/deployed.json').catch(() => {});
  await execAsync('rm test/orders.json').catch(() => {});
  await execAsync('rm test/results.zip').catch(() => {});
  await execAsync('rm test/wallet.json').catch(() => {});
  await execAsync('mkdir test/out').catch(() => {});
  process.chdir('test');
});

afterAll(() => {
  process.chdir('..');
});

describe('[cli]', () => {
  test('iexec', async () => {
    const out = await execAsync(`${iexecPath}`).catch((e) => e);
    expect(out instanceof Error).toBe(true);
    expect(out.message.indexOf('Usage: iexec [command] [options]')).not.toBe(
      -1,
    );
  });
  test('invalid command', async () => {
    const out = await execAsync(`${iexecPath} test`).catch((e) => e);
    expect(out instanceof Error).toBe(true);
    expect(out.message.indexOf("error: unknown command 'test'")).not.toBe(-1);
    expect(out.message.indexOf('Usage: iexec [command] [options]')).not.toBe(
      -1,
    );
  });
  test('unknown option', async () => {
    const out = await execAsync(`${iexecPath} --test`).catch((e) => e);
    expect(out instanceof Error).toBe(true);
    expect(out.message.indexOf('Usage: iexec [command] [options]')).not.toBe(
      -1,
    );
  });
  test('missing subcommand', async () => {
    const out = await execAsync(`${iexecPath} app`).catch((e) => e);
    expect(out instanceof Error).toBe(true);
    expect(
      out.message.indexOf('Usage: iexec app <command> [options]'),
    ).not.toBe(-1);
  });
  test('invalid subcommand', async () => {
    const out = await execAsync(`${iexecPath} app test`).catch((e) => e);
    expect(out instanceof Error).toBe(true);
    expect(out.message.indexOf("error: unknown command 'test'")).not.toBe(-1);
    expect(
      out.message.indexOf('Usage: iexec app <command> [options]'),
    ).not.toBe(-1);
  });
  test('subcommand unknown option', async () => {
    const out = await execAsync(`${iexecPath} app show --test`).catch((e) => e);
    expect(out instanceof Error).toBe(true);
    expect(out.message.indexOf("error: unknown option '--test'")).not.toBe(-1);
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
    await setTokenChain();
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
    expect(res.host).toBe(tokenChainUrl);
    expect(res.pocoVersion).toBeDefined();
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
    expect(res.balance.ether).toBeDefined();
    expect(res.balance.ether).not.toBe('0');
    expect(res.balance.nRLC).toBeDefined();
    expect(res.balance.nRLC).not.toBe('0');
    expect(res.balance.ether.replace('.', '').indexOf(res.balance.nRLC)).toBe(
      -1,
    );
  });

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
  });

  test('[mainchain] iexec account deposit 10 RLC', async () => {
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
    const amount = '10';
    const raw = await execAsync(
      `${iexecPath} account deposit ${amount} RLC --raw`,
    );
    const res = JSON.parse(raw);
    const bnAmount = new BN(amount).mul(new BN('1000000000'));
    expect(res.ok).toBe(true);
    expect(res.amount).toBe(bnAmount.toString());
    expect(res.txHash).toBeDefined();
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
  });

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
  });

  test('[mainchain] iexec account withdraw 5 RLC', async () => {
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
    const amount = '5';
    const raw = await execAsync(
      `${iexecPath} account withdraw ${amount} RLC --raw`,
    );
    const res = JSON.parse(raw);
    const bnAmount = new BN(amount).mul(new BN('1000000000'));
    expect(res.ok).toBe(true);
    expect(res.amount).toBe(bnAmount.toString());
    expect(res.txHash).toBeDefined();
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
  });

  test('[mainchain] iexec account show', async () => {
    const raw = await execAsync(`${iexecPath} account show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.balance).toBeDefined();
    expect(res.balance.stake).not.toBe('0');
  });

  test('[mainchain] iexec account show [address]', async () => {
    const raw = await execAsync(
      `${iexecPath} account show ${POOR_ADDRESS2} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.balance).toBeDefined();
    expect(res.balance.stake).toBe('0');
    expect(res.balance.locked).toBe('0');
  });

  test('[common] iexec account show --wallet-address <address> (missing wallet file)', async () => {
    const raw = await execAsync(
      `${iexecPath} account show --wallet-address ${POOR_ADDRESS1} --raw`,
    ).catch((e) => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.error.message).toBe(
      'Failed to load wallet address from keystore: Wallet file not found',
    );
    expect(res.error.name).toBe('Error');
    expect(res.balance).toBeUndefined();
  });

  // APP
  test('[common] iexec app init (no wallet)', async () => {
    await removeWallet();
    const raw = await execAsync(`${iexecPath} app init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.app).toBeDefined();
    expect(res.app.owner).not.toBe(ADDRESS);
    expect(res.app.mrenclave).toBeUndefined();
  });

  test('[common] iexec app init --tee)', async () => {
    await removeWallet();
    const raw = await execAsync(`${iexecPath} app init --tee --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.app).toBeDefined();
    expect(res.app.mrenclave).toBeDefined();
    expect(res.app.mrenclave.framework).toBe('SCONE');
  });

  test('[common] iexec app init --tee-framework gramine)', async () => {
    await removeWallet();
    const raw = await execAsync(
      `${iexecPath} app init --tee-framework gramine --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.app).toBeDefined();
    expect(res.app.mrenclave).toBeDefined();
    expect(res.app.mrenclave.framework).toBe('GRAMINE');
  });

  test('[common] iexec app init --tee-framework scone)', async () => {
    await removeWallet();
    const raw = await execAsync(
      `${iexecPath} app init --tee-framework scone --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.app).toBeDefined();
    expect(res.app.mrenclave).toBeDefined();
    expect(res.app.mrenclave.framework).toBe('SCONE');
  });

  test('[common] iexec app init (+ wallet)', async () => {
    await setRichWallet();
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
    mainchainApp = res.address;
  });

  test('[mainchain] iexec app show (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} app show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(mainchainApp);
    expect(res.app).toBeDefined();
    expect(res.app.owner).toBe(ADDRESS);
  });

  test('[mainchain] iexec ens register <name> --for <app>', async () => {
    const raw = await execAsync(
      `${iexecPath} ens register ${mainchainApp.toLowerCase()} --for ${mainchainApp} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.name).toBe(`${mainchainApp.toLowerCase()}.apps.iexec.eth`);
    expect(res.address).toBe(mainchainApp);
    expect(res.registerTxHash).toMatch(bytes32Regex);
    expect(res.setResolverTxHash).toMatch(bytes32Regex);
    expect(res.setAddrTxHash).toMatch(bytes32Regex);
    expect(res.setNameTxHash).toMatch(bytes32Regex);
  });

  test('[mainchain] iexec app show 0 (current user)', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(`${iexecPath} app show 0 --raw`);
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBeDefined();
    expect(res.app).toBeDefined();
    expect(res.app.owner).toBe(ADDRESS);
  });

  test('[mainchain] iexec app show [appAddress]', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(`${iexecPath} app show ${mainchainApp} --raw`);
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(mainchainApp);
    expect(res.app).toBeDefined();
    expect(res.app.owner).toBe(ADDRESS);
    expect(res.ens).toBe(`${mainchainApp.toLowerCase()}.apps.iexec.eth`);
  });

  test('[mainchain] iexec app show 0 --user [address]', async () => {
    await removeWallet();
    const raw = await execAsync(
      `${iexecPath} app show 0 --user ${ADDRESS} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBeDefined();
    expect(res.app).toBeDefined();
    expect(res.app.owner).toBe(ADDRESS);
  });

  test('[mainchain] iexec app count (current user)', async () => {
    await setRichWallet();
    const raw = await execAsync(`${iexecPath} app count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).toBeDefined();
    expect(res.count).not.toBe('0');
  });

  test('[mainchain] iexec app count --user [address]', async () => {
    await removeWallet();
    const raw = await execAsync(
      `${iexecPath} app count --user ${ADDRESS} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).toBeDefined();
    expect(res.count).not.toBe('0');
  });

  // DATASET
  test('[common] iexec dataset init (no wallet)', async () => {
    await removeWallet();
    const raw = await execAsync(`${iexecPath} dataset init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.dataset).toBeDefined();
    expect(res.dataset.owner).not.toBe(ADDRESS);
  });

  test('[common] iexec dataset init (+ wallet)', async () => {
    await setRichWallet();
    const raw = await execAsync(`${iexecPath} dataset init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.dataset).toBeDefined();
    expect(res.dataset.owner).toBe(ADDRESS);
  });

  test('[mainchain] iexec dataset deploy', async () => {
    await setRichWallet();
    await setDatasetUniqueName();
    const raw = await execAsync(`${iexecPath} dataset deploy --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    mainchainDataset = res.address;
  });

  test('[mainchain] iexec dataset show (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} dataset show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(mainchainDataset);
    expect(res.dataset).toBeDefined();
    expect(res.dataset.owner).toBe(ADDRESS);
  });

  test('[mainchain] iexec ens register <name> --for <dataset>', async () => {
    const raw = await execAsync(
      `${iexecPath} ens register ${mainchainDataset.toLowerCase()} --for ${mainchainDataset} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.name).toBe(
      `${mainchainDataset.toLowerCase()}.datasets.iexec.eth`,
    );
    expect(res.address).toBe(mainchainDataset);
    expect(res.registerTxHash).toMatch(bytes32Regex);
    expect(res.setResolverTxHash).toMatch(bytes32Regex);
    expect(res.setAddrTxHash).toMatch(bytes32Regex);
    expect(res.setNameTxHash).toMatch(bytes32Regex);
  });

  test('[mainchain] iexec dataset show 0 (current user)', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(`${iexecPath} dataset show 0 --raw`);
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBeDefined();
    expect(res.dataset).toBeDefined();
    expect(res.dataset.owner).toBe(ADDRESS);
  });

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
    expect(res.ens).toBe(
      `${mainchainDataset.toLowerCase()}.datasets.iexec.eth`,
    );
  });

  test('[mainchain] iexec dataset show 0 --user [address]', async () => {
    await removeWallet();
    const raw = await execAsync(
      `${iexecPath} dataset show 0 --user ${ADDRESS} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBeDefined();
    expect(res.dataset).toBeDefined();
    expect(res.dataset.owner).toBe(ADDRESS);
  });

  test('[mainchain] iexec dataset count (current user)', async () => {
    await setRichWallet();
    const raw = await execAsync(`${iexecPath} dataset count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).toBeDefined();
    expect(res.count).not.toBe('0');
  });

  test('[mainchain] iexec dataset count --user [address]', async () => {
    await removeWallet();
    const raw = await execAsync(
      `${iexecPath} dataset count --user ${ADDRESS} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).toBeDefined();
    expect(res.count).not.toBe('0');
  });

  // WORKERPOOL
  test('[common] iexec workerpool init (no wallet)', async () => {
    await removeWallet();
    const raw = await execAsync(`${iexecPath} workerpool init --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.workerpool).toBeDefined();
    expect(res.workerpool.owner).not.toBe(ADDRESS);
  });

  test('[common] iexec workerpool init (+ wallet)', async () => {
    await setRichWallet();
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
    mainchainWorkerpool = res.address;
  });

  test('[mainchain] iexec workerpool set-api-url (fail no ENS)', async () => {
    const raw = await execAsync(
      `${iexecPath} workerpool set-api-url https://my-workerpool.com ${mainchainWorkerpool} --raw`,
    ).catch((e) => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.error.name).toBe('Error');
    expect(res.error.message).toBe(
      `Missing ENS for workerpool ${mainchainWorkerpool}. You probably forgot to run "iexec ens register <name> --for ${mainchainWorkerpool}"`,
    );
  });

  test('[mainchain] iexec ens register <name> --for <workerpool>', async () => {
    const raw = await execAsync(
      `${iexecPath} ens register ${mainchainWorkerpool.toLowerCase()} --for ${mainchainWorkerpool} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.name).toBe(
      `${mainchainWorkerpool.toLowerCase()}.pools.iexec.eth`,
    );
    expect(res.address).toBe(mainchainWorkerpool);
    expect(res.registerTxHash).toMatch(bytes32Regex);
    expect(res.setResolverTxHash).toMatch(bytes32Regex);
    expect(res.setAddrTxHash).toMatch(bytes32Regex);
    expect(res.setNameTxHash).toMatch(bytes32Regex);
  });

  test('[mainchain] iexec workerpool set-api-url', async () => {
    const raw = await execAsync(
      `${iexecPath} workerpool set-api-url https://my-workerpool.com ${mainchainWorkerpool} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(mainchainWorkerpool);
    expect(res.url).toBe('https://my-workerpool.com');
    expect(res.txHash).toMatch(bytes32Regex);
  });

  test('[mainchain] iexec workerpool set-api-url (from deployed.json)', async () => {
    const raw = await execAsync(
      `${iexecPath} workerpool set-api-url https://my-workerpool-0.com --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(mainchainWorkerpool);
    expect(res.url).toBe('https://my-workerpool-0.com');
    expect(res.txHash).toMatch(bytes32Regex);
  });

  test('[mainchain] iexec workerpool show (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} workerpool show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(mainchainWorkerpool);
    expect(res.workerpool).toBeDefined();
    expect(res.workerpool.owner).toBe(ADDRESS);
    expect(res.apiUrl).toBe('https://my-workerpool-0.com');
    expect(res.ens).toBe(
      `${mainchainWorkerpool.toLowerCase()}.pools.iexec.eth`,
    );
  });

  test('[mainchain] iexec workerpool show 0 (current user)', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(`${iexecPath} workerpool show 0 --raw`);
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBeDefined();
    expect(res.workerpool).toBeDefined();
    expect(res.workerpool.owner).toBe(ADDRESS);
  });

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
  });

  test('[mainchain] iexec workerpool show 0 --user [address]', async () => {
    await removeWallet();
    const raw = await execAsync(
      `${iexecPath} workerpool show 0 --user ${ADDRESS} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBeDefined();
    expect(res.workerpool).toBeDefined();
    expect(res.workerpool.owner).toBe(ADDRESS);
  });

  test('[mainchain] iexec workerpool count (current user)', async () => {
    await setRichWallet();
    const raw = await execAsync(`${iexecPath} workerpool count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).toBeDefined();
    expect(res.count).not.toBe('0');
  });

  test('[mainchain] iexec workerpool count --user [address]', async () => {
    await removeWallet();
    const raw = await execAsync(
      `${iexecPath} workerpool count --user ${ADDRESS} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).toBeDefined();
    expect(res.count).not.toBe('0');
  });

  // CATEGORY
  test('[common] iexec category init', async () => {
    await setRichWallet();
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
    const raw = await execAsync(
      `${iexecPath} order sign --raw --skip-request-check`,
    );
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
  });

  test('[mainchain] iexec order fill', async () => {
    const raw = await execAsync(
      `${iexecPath} order fill --skip-request-check --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.volume).toBe('1');
    expect(res.dealid).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    mainchainDealid = res.dealid;
  });

  test('[mainchain] iexec order sign --app', async () => {
    const raw = await execAsync(`${iexecPath} order sign --app --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeDefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.apporder.app).toBeDefined();
  });

  test('[mainchain] iexec order sign --dataset', async () => {
    const raw = await execAsync(`${iexecPath} order sign --dataset --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeDefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.datasetorder.dataset).toBeDefined();
  });

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
  });

  test('[mainchain] iexec order sign --request', async () => {
    await editRequestorder({
      app: mainchainApp,
      dataset: mainchainDataset,
      workerpool: mainchainWorkerpool,
      category: mainchainNoDurationCatid,
      volume: '5',
    });
    const raw = await execAsync(
      `${iexecPath} order sign --request --skip-request-check --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeDefined();
    expect(res.requestorder.app).toBeDefined();
  });

  test('[mainchain] iexec order fill (BoT 5)', async () => {
    const raw = await execAsync(
      `${iexecPath} order fill --skip-request-check --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.volume).toBe('5');
    expect(res.dealid).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    mainchainDealidNoDuration = res.dealid;
  });

  test('[mainchain] iexec order fill --params <params> --force', async () => {
    const raw = await execAsync(
      `${iexecPath} order fill --params 'arg --option "multiple words"' --skip-request-check --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.volume).toBe('1');
    expect(res.dealid).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
  });

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
  });

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
  });

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
  });

  test('[mainchain] iexec order cancel --request', async () => {
    await execAsync(
      `${iexecPath} order sign --request --skip-request-check --raw`,
    );
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
  });

  test('[mainchain] iexec order cancel --app --dataset --workerpool --request (missing orders)', async () => {
    await execAsync('mv orders.json orders.back');
    await execAsync('cp ./inputs/orders/emptyOrders.json orders.json');
    const raw = await execAsync(
      `${iexecPath} order cancel --app --dataset --workerpool --request --force --raw`,
    ).catch((e) => e.message);
    await execAsync('mv orders.back orders.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.apporder).toBeUndefined();
    expect(res.datasetorder).toBeUndefined();
    expect(res.workerpoolorder).toBeUndefined();
    expect(res.requestorder).toBeUndefined();
    expect(res.fail.length).toBe(4);
  });

  test('[common] iexec app run --workerpool deployed', async () => {
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
      `${iexecPath} app run --workerpool deployed --skip-request-check --force --raw`,
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
    expect(resDeal.deal.dataset.pointer).toBe(NULL_ADDRESS);
    expect(resDeal.deal.dataset.price).toBe('0');
    expect(resDeal.deal.workerpool.pointer).toBe(mainchainWorkerpool);
    expect(resDeal.deal.workerpool.price).toBe('0');
    expect(resDeal.deal.category).toBe('0');
    expect(resDeal.deal.params).toBe(
      `{"iexec_result_storage_provider":"ipfs","iexec_result_storage_proxy":"${resultProxyURL}"}`,
    );
    expect(resDeal.deal.callback).toBe(NULL_ADDRESS);
    expect(resDeal.deal.requester).toBe(ADDRESS);
    expect(resDeal.deal.beneficiary).toBe(ADDRESS);
    expect(resDeal.deal.botFirst).toBe('0');
    expect(resDeal.deal.botSize).toBe('1');
    expect(resDeal.deal.tag).toBe(NULL_BYTES32);
    expect(resDeal.deal.trust).toBe('1');
    expect(Object.keys(resDeal.deal.tasks).length).toBe(1);
    expect(resDeal.deal.tasks['0']).toBeDefined();
  });

  test('[common] iexec app run --workerpool deployed --dataset 0x0000000000000000000000000000000000000000', async () => {
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
      `${iexecPath} app run --workerpool deployed --dataset 0x0000000000000000000000000000000000000000 --skip-request-check --force --raw`,
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
    expect(resDeal.deal.dataset.pointer).toBe(NULL_ADDRESS);
    expect(resDeal.deal.dataset.price).toBe('0');
    expect(resDeal.deal.workerpool.pointer).toBe(mainchainWorkerpool);
    expect(resDeal.deal.workerpool.price).toBe('0');
    expect(resDeal.deal.category).toBe('0');
    expect(resDeal.deal.params).toBe(
      `{"iexec_result_storage_provider":"ipfs","iexec_result_storage_proxy":"${resultProxyURL}"}`,
    );
    expect(resDeal.deal.callback).toBe(NULL_ADDRESS);
    expect(resDeal.deal.requester).toBe(ADDRESS);
    expect(resDeal.deal.beneficiary).toBe(ADDRESS);
    expect(resDeal.deal.botFirst).toBe('0');
    expect(resDeal.deal.botSize).toBe('1');
    expect(resDeal.deal.tag).toBe(NULL_BYTES32);
    expect(resDeal.deal.trust).toBe('1');
    expect(Object.keys(resDeal.deal.tasks).length).toBe(1);
    expect(resDeal.deal.tasks['0']).toBeDefined();
  });

  test('[common] iexec app run --workerpool deployed --dataset deployed --params <params> --tag <tag> --category <catid> --beneficiary <address> --callback <address>', async () => {
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
      `${iexecPath} app run --workerpool deployed --dataset deployed --params '{"iexec_args":"test params"}' --tag tee,gpu --category 1 --beneficiary 0x0000000000000000000000000000000000000000 --callback ${POOR_ADDRESS1} --skip-request-check --force --raw`,
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
    expect(resDeal.deal.params).toBe('{"iexec_args":"test params"}');
    expect(resDeal.deal.callback).toBe(POOR_ADDRESS1);
    expect(resDeal.deal.requester).toBe(ADDRESS);
    expect(resDeal.deal.beneficiary).toBe(NULL_ADDRESS);
    expect(resDeal.deal.botFirst).toBe('0');
    expect(resDeal.deal.botSize).toBe('1');
    expect(resDeal.deal.tag).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000101',
    );
    expect(resDeal.deal.trust).toBe('1');
    expect(Object.keys(resDeal.deal.tasks).length).toBe(1);
    expect(resDeal.deal.tasks['0']).toBeDefined();
  });

  test('[common] iexec app run --workerpool deployed --dataset deployed --args <args> --encrypt-result --input-files https://example.com/foo.txt,https://example.com/bar.zip --storage-provider dropbox --tag tee', async () => {
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
      `${iexecPath} app run --workerpool deployed --args 'command --help' --encrypt-result --input-files https://example.com/foo.txt,https://example.com/bar.zip --storage-provider dropbox --tag tee --skip-request-check --force --raw`,
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
    expect(resDeal.deal.dataset.pointer).toBe(NULL_ADDRESS);
    expect(resDeal.deal.dataset.price).toBe('0');
    expect(resDeal.deal.workerpool.pointer).toBe(mainchainWorkerpool);
    expect(resDeal.deal.workerpool.price).toBe('0');
    expect(resDeal.deal.category).toBe('0');
    expect(resDeal.deal.params).toBe(
      '{"iexec_args":"command --help","iexec_input_files":["https://example.com/foo.txt","https://example.com/bar.zip"],"iexec_result_storage_provider":"dropbox","iexec_result_encryption":true}',
    );
    expect(resDeal.deal.callback).toBe(NULL_ADDRESS);
    expect(resDeal.deal.requester).toBe(ADDRESS);
    expect(resDeal.deal.beneficiary).toBe(ADDRESS);
    expect(resDeal.deal.botFirst).toBe('0');
    expect(resDeal.deal.botSize).toBe('1');
    expect(resDeal.deal.tag).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    );
    expect(resDeal.deal.trust).toBe('1');
    expect(Object.keys(resDeal.deal.tasks).length).toBe(1);
    expect(resDeal.deal.tasks['0']).toBeDefined();
  });

  test('[common] iexec app run --workerpool deployed --watch (timeout)', async () => {
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
      `${iexecPath} app run --workerpool deployed --category ${mainchainNoDurationCatid} --watch --skip-request-check --force --raw`,
    ).catch((e) => e.message);
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
  });

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
  });

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
  });

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
  });

  test('[mainchain] iexec deal show (no deal)', async () => {
    const fakeDealId =
      '0x194488f76903579d3a3acd89cb75420d52e31e03ab194a74b95247339cf2180f';
    const raw = await execAsync(
      `${iexecPath} deal show ${fakeDealId} --raw`,
    ).catch((e) => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.deal).toBeUndefined();
  });

  test('[mainchain] iexec task show (not initialized)', async () => {
    const raw = await execAsync(
      `${iexecPath} task show ${mainchainTaskid} --raw`,
    ).catch((e) => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.task).toBeUndefined();
  });

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
    expect(res.task.consensusValue).toBe(NULL_BYTES32);
    expect(res.task.revealCounter).toBe('0');
    expect(res.task.winnerCounter).toBe('0');
    expect(res.task.contributors).toStrictEqual([]);
    expect(res.task.resultDigest).toBe(NULL_BYTES32);
    expect(res.task.results).toStrictEqual({ storage: 'none' });
    expect(res.task.statusName).toBe('ACTIVE');
    expect(res.task.taskTimedOut).toBe(false);
    expect(res.claimable).toBe(false);
  });

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
    expect(res.task.consensusValue).toBe(NULL_BYTES32);
    expect(res.task.revealCounter).toBe('0');
    expect(res.task.winnerCounter).toBe('0');
    expect(res.task.contributors).toStrictEqual([]);
    expect(res.task.resultDigest).toBe(NULL_BYTES32);
    expect(res.task.results).toStrictEqual({ storage: 'none' });
    expect(res.task.statusName).toBe('TIMEOUT');
    expect(res.task.taskTimedOut).toBe(true);
    expect(res.claimable).toBe(true);
  });

  test('[mainchain] iexec task claim', async () => {
    const raw = await execAsync(
      `${iexecPath} task claim ${mainchainTaskidNoDuration} --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
  });

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
    expect(res.task.consensusValue).toBe(NULL_BYTES32);
    expect(res.task.revealCounter).toBe('0');
    expect(res.task.winnerCounter).toBe('0');
    expect(res.task.contributors).toStrictEqual([]);
    expect(res.task.resultDigest).toBe(NULL_BYTES32);
    expect(res.task.results).toStrictEqual({ storage: 'none' });
    expect(res.task.statusName).toBe('FAILED');
    expect(res.task.taskTimedOut).toBe(true);
    expect(res.claimable).toBe(false);
  });

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
    const initializeAndClaimArrayTx = await tokenChainRPC.getTransaction(
      res.transactions[0].txHash,
    );
    expect(initializeAndClaimArrayTx).toBeDefined();
  });

  // send-ether
  test('[mainchain] iexec wallet send-ether', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet send-ether 1 --to ${POOR_ADDRESS1} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS);
    expect(res.to).toBe(POOR_ADDRESS1);
    expect(res.amount).toBe('1000000000000000000');
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
  });

  test('[mainchain] iexec wallet send-ether', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet send-ether 1 gwei --to ${POOR_ADDRESS1} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS);
    expect(res.to).toBe(POOR_ADDRESS1);
    expect(res.amount).toBe('1000000000');
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
  });

  // send-RLC
  test('[mainchain] iexec wallet send-RLC 0.5', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet send-RLC 0.5 --to ${POOR_ADDRESS1} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS);
    expect(res.to).toBe(POOR_ADDRESS1);
    expect(res.amount).toBe('500000000');
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
  });

  test('[mainchain] iexec wallet send-RLC 1000000000 nRLC', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet send-RLC 1000000000 nRLC --to ${POOR_ADDRESS1} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS);
    expect(res.to).toBe(POOR_ADDRESS1);
    expect(res.amount).toBe('1000000000');
    expect(res.txHash).toBeDefined();
    const tx = await tokenChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
  });

  test('[mainchain] iexec wallet sweep', async () => {
    await setPoorWallet1();
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
  });

  test('[common] app secret', async () => {
    await setTokenChainOpenethereum();
    await setRichWallet();
    await execAsync(`${iexecPath} app init --tee-framework gramine --raw`);
    await setAppUniqueName();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} app deploy --raw`),
    );

    // anyone can check-secret
    await removeWallet();
    const checkNotPushed = JSON.parse(
      await execAsync(`${iexecPath} app check-secret ${address} --raw`),
    );
    expect(checkNotPushed.ok).toBe(true);
    expect(checkNotPushed.isSecretSet).toBe(false);
    // only owner can push
    await setPoorWallet1();
    const pushUnauthorized = JSON.parse(
      await execAsync(
        `${iexecPath} app push-secret  ${address} --secret-value foo --raw`,
      ).catch((err) => err.message),
    );
    expect(pushUnauthorized.ok).toBe(false);
    await setRichWallet();
    const pushAuthorized = JSON.parse(
      await execAsync(
        `${iexecPath} app push-secret  ${address} --secret-value foo --raw`,
      ),
    );
    expect(pushAuthorized.ok).toBe(true);
    // cannot update app secret
    const pushUpdate = JSON.parse(
      await execAsync(
        `${iexecPath} app push-secret ${address} --secret-value bar --raw`,
      ).catch((err) => err.message),
    );
    expect(pushUpdate.ok).toBe(false);
    // check pushed
    await removeWallet();
    const checkPushed = JSON.parse(
      await execAsync(`${iexecPath} app check-secret ${address} --raw`),
    );
    expect(checkPushed.ok).toBe(true);
    expect(checkPushed.isSecretSet).toBe(true);
    // check secret TEE framework validation
    await expect(
      execAsync(
        `${iexecPath} app check-secret ${address} --tee-framework foo --raw`,
      ),
    ).rejects.toThrow();
    // check secret TEE framework override
    const checkOtherFramework = JSON.parse(
      await execAsync(
        `${iexecPath} app check-secret ${address} --tee-framework ${TEE_FRAMEWORKS.SCONE} --raw`,
      ),
    );
    expect(checkOtherFramework.ok).toBe(true);
    expect(checkOtherFramework.isSecretSet).toBe(false);
    // push secret TEE framework override
    await setRichWallet();
    const pushOtherFrameworkAuthorized = JSON.parse(
      await execAsync(
        `${iexecPath} app push-secret  ${address} --secret-value foo --tee-framework ${TEE_FRAMEWORKS.SCONE} --raw`,
      ),
    );
    expect(pushOtherFrameworkAuthorized.ok).toBe(true);
    const checkOtherFrameworkPushed = JSON.parse(
      await execAsync(
        `${iexecPath} app check-secret ${address} --tee-framework ${TEE_FRAMEWORKS.SCONE} --raw`,
      ),
    );
    expect(checkOtherFrameworkPushed.ok).toBe(true);
    expect(checkOtherFrameworkPushed.isSecretSet).toBe(true);
  });

  test('[common] iexec app publish (from deployed)', async () => {
    await setRichWallet();
    await setTokenChainOpenethereum({ iexecGateway: iexecGatewayURL });
    await execAsync(`${iexecPath} app init`);
    await setAppUniqueName();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} app deploy --raw`),
    );
    const raw = await execAsync(`${iexecPath} app publish --force --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.orderHash).toBeDefined();
    const orderShowRes = JSON.parse(
      await execAsync(`${iexecPath} order show --app ${res.orderHash} --raw`),
    );
    expect(orderShowRes.apporder.order).toEqual({
      app: address,
      appprice: 0,
      volume: 1000000,
      tag: NULL_BYTES32,
      datasetrestrict: NULL_ADDRESS,
      workerpoolrestrict: NULL_ADDRESS,
      requesterrestrict: NULL_ADDRESS,
      sign: orderShowRes.apporder.order.sign,
      salt: orderShowRes.apporder.order.salt,
    });
  });

  test('[mainchain] iexec app publish [address] with options', async () => {
    await setRichWallet();
    await setTokenChainOpenethereum({ iexecGateway: iexecGatewayURL });
    await execAsync(`${iexecPath} app init`);
    await setAppUniqueName();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} app deploy --raw`),
    );
    const raw = await execAsync(
      `${iexecPath} app publish ${address} --price 0.1 RLC --volume 100 --tag tee --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.orderHash).toBeDefined();
    const orderShowRes = JSON.parse(
      await execAsync(`${iexecPath} order show --app ${res.orderHash} --raw`),
    );
    expect(orderShowRes.apporder.order).toEqual({
      app: address,
      appprice: 100000000,
      volume: 100,
      tag: '0x0000000000000000000000000000000000000000000000000000000000000001',
      datasetrestrict: NULL_ADDRESS,
      workerpoolrestrict: NULL_ADDRESS,
      requesterrestrict: NULL_ADDRESS,
      sign: orderShowRes.apporder.order.sign,
      salt: orderShowRes.apporder.order.salt,
    });
  });

  test('[common] iexec app unpublish (from deployed)', async () => {
    await setRichWallet();
    await setTokenChainOpenethereum({ iexecGateway: iexecGatewayURL });
    await execAsync(`${iexecPath} app init`);
    await setAppUniqueName();
    await execAsync(`${iexecPath} app deploy --raw`);
    await execAsync(`${iexecPath} app publish --force --raw`);
    const lastOrderHash = JSON.parse(
      await execAsync(`${iexecPath} app publish --force --raw`),
    ).orderHash;
    const raw = await execAsync(`${iexecPath} app unpublish --force --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.unpublished).toBe(lastOrderHash);
    await execAsync(`${iexecPath} app unpublish --force --raw`);
    const rawErr = await execAsync(
      `${iexecPath} app unpublish --force --raw`,
    ).catch((e) => e.message);
    const resErr = JSON.parse(rawErr);
    expect(resErr.ok).toBe(false);
  });

  test('[common] iexec app unpublish [address] --all', async () => {
    await setRichWallet();
    await setTokenChainOpenethereum({ iexecGateway: iexecGatewayURL });
    await execAsync(`${iexecPath} app init`);
    await setAppUniqueName();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} app deploy --raw`),
    );
    const { orderHash } = JSON.parse(
      await execAsync(`${iexecPath} app publish --force --raw`),
    );
    const lastOrderHash = JSON.parse(
      await execAsync(`${iexecPath} app publish --force --raw`),
    ).orderHash;
    const raw = await execAsync(
      `${iexecPath} app unpublish ${address} --all --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.unpublished).toEqual(
      expect.arrayContaining([orderHash, lastOrderHash]),
    );
    const rawErr = await execAsync(
      `${iexecPath} app unpublish --all --force --raw`,
    ).catch((e) => e.message);
    const resErr = JSON.parse(rawErr);
    expect(resErr.ok).toBe(false);
  });

  test('[common] iexec dataset publish (from deployed)', async () => {
    await setRichWallet();
    await setTokenChainOpenethereum({ iexecGateway: iexecGatewayURL });
    await execAsync(`${iexecPath} dataset init`);
    await setDatasetUniqueName();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} dataset deploy --raw`),
    );
    const raw = await execAsync(`${iexecPath} dataset publish --force --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.orderHash).toBeDefined();
    const orderShowRes = JSON.parse(
      await execAsync(
        `${iexecPath} order show --dataset ${res.orderHash} --raw`,
      ),
    );
    expect(orderShowRes.datasetorder.order).toEqual({
      dataset: address,
      datasetprice: 0,
      volume: 1000000,
      tag: NULL_BYTES32,
      apprestrict: NULL_ADDRESS,
      workerpoolrestrict: NULL_ADDRESS,
      requesterrestrict: NULL_ADDRESS,
      sign: orderShowRes.datasetorder.order.sign,
      salt: orderShowRes.datasetorder.order.salt,
    });
  });

  test('[mainchain] iexec dataset publish [address] with options', async () => {
    await setRichWallet();
    await setTokenChainOpenethereum({ iexecGateway: iexecGatewayURL });
    await execAsync(`${iexecPath} dataset init`);
    await setDatasetUniqueName();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} dataset deploy --raw`),
    );
    const raw = await execAsync(
      `${iexecPath} dataset publish ${address} --price 0.1 RLC --volume 100 --tag tee --app-restrict ${POOR_ADDRESS1} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.orderHash).toBeDefined();
    const orderShowRes = JSON.parse(
      await execAsync(
        `${iexecPath} order show --dataset ${res.orderHash} --raw`,
      ),
    );
    expect(orderShowRes.datasetorder.order).toEqual({
      dataset: address,
      datasetprice: 100000000,
      volume: 100,
      tag: '0x0000000000000000000000000000000000000000000000000000000000000001',
      apprestrict: POOR_ADDRESS1,
      workerpoolrestrict: NULL_ADDRESS,
      requesterrestrict: NULL_ADDRESS,
      sign: orderShowRes.datasetorder.order.sign,
      salt: orderShowRes.datasetorder.order.salt,
    });
  });

  test('[common] iexec dataset unpublish (from deployed)', async () => {
    await setRichWallet();
    await setTokenChainOpenethereum({ iexecGateway: iexecGatewayURL });
    await execAsync(`${iexecPath} dataset init`);
    await setDatasetUniqueName();
    await execAsync(`${iexecPath} dataset deploy --raw`);
    await execAsync(`${iexecPath} dataset publish --force --raw`);
    const lastOrderHash = JSON.parse(
      await execAsync(`${iexecPath} dataset publish --force --raw`),
    ).orderHash;
    const raw = await execAsync(`${iexecPath} dataset unpublish --force --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.unpublished).toBe(lastOrderHash);
    await execAsync(`${iexecPath} dataset unpublish --force --raw`);
    const rawErr = await execAsync(
      `${iexecPath} dataset unpublish --force --raw`,
    ).catch((e) => e.message);
    const resErr = JSON.parse(rawErr);
    expect(resErr.ok).toBe(false);
  });

  test('[common] iexec dataset unpublish [address] --all', async () => {
    await setRichWallet();
    await setTokenChainOpenethereum({ iexecGateway: iexecGatewayURL });
    await execAsync(`${iexecPath} dataset init`);
    await setDatasetUniqueName();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} dataset deploy --raw`),
    );
    const { orderHash } = JSON.parse(
      await execAsync(`${iexecPath} dataset publish --force --raw`),
    );
    const lastOrderHash = JSON.parse(
      await execAsync(`${iexecPath} dataset publish --force --raw`),
    ).orderHash;
    const raw = await execAsync(
      `${iexecPath} dataset unpublish ${address} --all --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.unpublished).toEqual(
      expect.arrayContaining([orderHash, lastOrderHash]),
    );
    const rawErr = await execAsync(
      `${iexecPath} dataset unpublish --all --force --raw`,
    ).catch((e) => e.message);
    const resErr = JSON.parse(rawErr);
    expect(resErr.ok).toBe(false);
  });

  test('[common] iexec workerpool publish (from deployed)', async () => {
    await setRichWallet();
    await setTokenChainOpenethereum({ iexecGateway: iexecGatewayURL });
    await execAsync(`${iexecPath} workerpool init`);
    await setWorkerpoolUniqueDescription();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} workerpool deploy --raw`),
    );
    const raw = await execAsync(
      `${iexecPath} workerpool publish --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.orderHash).toBeDefined();
    const orderShowRes = JSON.parse(
      await execAsync(
        `${iexecPath} order show --workerpool ${res.orderHash} --raw`,
      ),
    );
    expect(orderShowRes.workerpoolorder.order).toEqual({
      workerpool: address,
      workerpoolprice: 0,
      volume: 1,
      tag: NULL_BYTES32,
      trust: 0,
      category: 0,
      apprestrict: NULL_ADDRESS,
      datasetrestrict: NULL_ADDRESS,
      requesterrestrict: NULL_ADDRESS,
      sign: orderShowRes.workerpoolorder.order.sign,
      salt: orderShowRes.workerpoolorder.order.salt,
    });
  });

  test('[mainchain] iexec workerpool publish [address] with options', async () => {
    await setRichWallet();
    await setTokenChainOpenethereum({ iexecGateway: iexecGatewayURL });
    await execAsync(`${iexecPath} account deposit 10`);
    await execAsync(`${iexecPath} workerpool init`);
    await setWorkerpoolUniqueDescription();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} workerpool deploy --raw`),
    );
    const raw = await execAsync(
      `${iexecPath} workerpool publish ${address} --price 0.000000002 RLC --volume 5 --tag tee --trust 20 --category 1 --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.orderHash).toBeDefined();
    const orderShowRes = JSON.parse(
      await execAsync(
        `${iexecPath} order show --workerpool ${res.orderHash} --raw`,
      ),
    );
    expect(orderShowRes.workerpoolorder.order).toEqual({
      workerpool: address,
      workerpoolprice: 2,
      volume: 5,
      tag: '0x0000000000000000000000000000000000000000000000000000000000000001',
      trust: 20,
      category: 1,
      apprestrict: NULL_ADDRESS,
      datasetrestrict: NULL_ADDRESS,
      requesterrestrict: NULL_ADDRESS,
      sign: orderShowRes.workerpoolorder.order.sign,
      salt: orderShowRes.workerpoolorder.order.salt,
    });
  });

  test('[common] iexec workerpool unpublish (from deployed)', async () => {
    await setRichWallet();
    await setTokenChainOpenethereum({ iexecGateway: iexecGatewayURL });
    await execAsync(`${iexecPath} workerpool init`);
    await setWorkerpoolUniqueDescription();
    await execAsync(`${iexecPath} workerpool deploy --raw`);
    await execAsync(`${iexecPath} workerpool publish --force --raw`);
    const lastOrderHash = JSON.parse(
      await execAsync(`${iexecPath} workerpool publish --force --raw`),
    ).orderHash;
    const raw = await execAsync(
      `${iexecPath} workerpool unpublish --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.unpublished).toBe(lastOrderHash);
    await execAsync(`${iexecPath} workerpool unpublish --force --raw`);
    const rawErr = await execAsync(
      `${iexecPath} workerpool unpublish --force --raw`,
    ).catch((e) => e.message);
    const resErr = JSON.parse(rawErr);
    expect(resErr.ok).toBe(false);
  });

  test('[common] iexec workerpool unpublish [address] --all', async () => {
    await setRichWallet();
    await setTokenChainOpenethereum({ iexecGateway: iexecGatewayURL });
    await execAsync(`${iexecPath} workerpool init`);
    await setWorkerpoolUniqueDescription();
    const { address } = JSON.parse(
      await execAsync(`${iexecPath} workerpool deploy --raw`),
    );
    const { orderHash } = JSON.parse(
      await execAsync(`${iexecPath} workerpool publish --force --raw`),
    );
    const lastOrderHash = JSON.parse(
      await execAsync(`${iexecPath} workerpool publish --force --raw`),
    ).orderHash;
    const raw = await execAsync(
      `${iexecPath} workerpool unpublish ${address} --all --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.unpublished).toEqual(
      expect.arrayContaining([orderHash, lastOrderHash]),
    );
    const rawErr = await execAsync(
      `${iexecPath} workerpool unpublish --all --force --raw`,
    ).catch((e) => e.message);
    const resErr = JSON.parse(rawErr);
    expect(resErr.ok).toBe(false);
  });

  // REQUESTER
  test('[common] requester secret', async () => {
    await setTokenChainOpenethereum();
    const { privateKey, address } = await setWallet();
    // check own
    const checkOwnNotPushed = JSON.parse(
      await execAsync(`${iexecPath} requester check-secret foo --raw`),
    );
    expect(checkOwnNotPushed.ok).toBe(true);
    expect(checkOwnNotPushed.name).toBe('foo');
    expect(checkOwnNotPushed.isSet).toBe(false);

    // push
    const push = JSON.parse(
      await execAsync(
        `${iexecPath} requester push-secret foo --secret-value FOO --raw`,
      ),
    );
    expect(push.ok).toBe(true);
    expect(push.name).toBe('foo');
    expect(push.isPushed).toBe(true);
    // cannot update requester secret
    const pushUpdate = JSON.parse(
      await execAsync(
        `${iexecPath} requester push-secret foo --secret-value FOOD --raw`,
      ).catch((err) => err.message),
    );
    expect(pushUpdate.ok).toBe(false);

    // check own pushed
    const checkOwnPushed = JSON.parse(
      await execAsync(`${iexecPath} requester check-secret foo --raw`),
    );
    expect(checkOwnPushed.ok).toBe(true);
    expect(checkOwnPushed.name).toBe('foo');
    expect(checkOwnPushed.isSet).toBe(true);

    // anyone can check-secret
    await removeWallet();
    const checkPushed = JSON.parse(
      await execAsync(
        `${iexecPath} requester check-secret foo ${address} --raw`,
      ),
    );
    expect(checkPushed.ok).toBe(true);
    expect(checkPushed.name).toBe('foo');
    expect(checkPushed.isSet).toBe(true);

    const checkNotPushed = JSON.parse(
      await execAsync(
        `${iexecPath} requester check-secret FOO ${address} --raw`,
      ),
    );
    expect(checkNotPushed.ok).toBe(true);
    expect(checkNotPushed.name).toBe('FOO');
    expect(checkNotPushed.isSet).toBe(false);

    // check secret TEE framework validation
    await expect(
      execAsync(
        `${iexecPath} requester check-secret foo ${address} --tee-framework tee --raw`,
      ),
    ).rejects.toThrow();

    // check secret TEE framework override
    const checkOtherFramework = JSON.parse(
      await execAsync(
        `${iexecPath} requester check-secret foo ${address} --tee-framework ${TEE_FRAMEWORKS.GRAMINE} --raw`,
      ),
    );
    expect(checkOtherFramework.ok).toBe(true);
    expect(checkOtherFramework.name).toBe('foo');
    expect(checkOtherFramework.isSet).toBe(false);

    // push secret TEE framework override
    await setWallet(privateKey);
    const pushOtherFramework = JSON.parse(
      await execAsync(
        `${iexecPath} requester push-secret foo --secret-value foo --tee-framework ${TEE_FRAMEWORKS.GRAMINE} --raw`,
      ),
    );
    expect(pushOtherFramework.ok).toBe(true);
    const checkOtherFrameworkPushed = JSON.parse(
      await execAsync(
        `${iexecPath} requester check-secret foo ${address} --tee-framework ${TEE_FRAMEWORKS.GRAMINE} --raw`,
      ),
    );
    expect(checkOtherFrameworkPushed.ok).toBe(true);
    expect(checkOtherFrameworkPushed.name).toBe('foo');
    expect(checkOtherFrameworkPushed.isSet).toBe(true);
  });
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
    await setRichWallet();
    await setNativeChain();
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
    expect(res.pocoVersion).toBeDefined();
    expect(res.host).toBe(nativeChainUrl);
    expect(res.hubAddress).toBe(nativeHubAddress);
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
    expect(res.balance.ether).toBeUndefined();
  });

  test('[sidechain] iexec wallet send-ether', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet send-ether 0.1 --to ${POOR_ADDRESS1} --force --raw`,
    ).catch((e) => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
  });

  test('[sidechain] iexec wallet sendRLC 1000000000', async () => {
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
  });

  test('[sidechain] iexec wallet sendRLC 0.5 RLC', async () => {
    const raw = await execAsync(
      `${iexecPath} wallet sendRLC 0.5 RLC --to ${POOR_ADDRESS1} --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.from).toBe(ADDRESS);
    expect(res.to).toBe(POOR_ADDRESS1);
    expect(res.amount).toBe('500000000');
    expect(res.txHash).toBeDefined();
    const tx = await nativeChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(nativeChainGasPrice);
  });

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
  });

  test('[sidechain] iexec account deposit 5 RLC', async () => {
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
    const amount = '5';
    const raw = await execAsync(
      `${iexecPath} account deposit ${amount} RLC --raw`,
    );
    const res = JSON.parse(raw);
    const bnAmount = new BN(amount).mul(new BN('1000000000'));
    expect(res.ok).toBe(true);
    expect(res.amount).toBe(bnAmount.toString());
    expect(res.txHash).toBeDefined();
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
  });

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
  });

  test('[sidechain] iexec account withdraw 2 RLC', async () => {
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
    const amount = '2';
    const raw = await execAsync(
      `${iexecPath} account withdraw ${amount} RLC --raw`,
    );
    const res = JSON.parse(raw);
    const bnAmount = new BN(amount).mul(new BN('1000000000'));
    expect(res.ok).toBe(true);
    expect(res.amount).toBe(bnAmount.toString());
    expect(res.txHash).toBeDefined();
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
  });

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
  });

  test('[sidechain] iexec app show [appAddress]', async () => {
    await execAsync('mv deployed.json deployed.back');
    const raw = await execAsync(`${iexecPath} app show ${sidechainApp} --raw`);
    await execAsync('mv deployed.back deployed.json');
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(sidechainApp);
    expect(res.app).toBeDefined();
    expect(res.app.owner).toBe(ADDRESS);
  });

  test('[sidechain] iexec app show (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} app show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(sidechainApp);
    expect(res.app).toBeDefined();
    expect(res.app.owner).toBe(ADDRESS);
  });

  test('[sidechain] iexec app count (current user)', async () => {
    const raw = await execAsync(`${iexecPath} app count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).toBeDefined();
    expect(res.count).not.toBe('0');
  });

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
  });

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
  });

  test('[sidechain] iexec dataset show (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} dataset show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(sidechainDataset);
    expect(res.dataset).toBeDefined();
    expect(res.dataset.owner).toBe(ADDRESS);
  });

  test('[sidechain] iexec dataset count (current user)', async () => {
    const raw = await execAsync(`${iexecPath} dataset count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).toBeDefined();
    expect(res.count).not.toBe('0');
  });

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
  });

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
  });

  test('[sidechain] iexec workerpool show (from deployed.json)', async () => {
    const raw = await execAsync(`${iexecPath} workerpool show --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.address).toBe(sidechainWorkerpool);
    expect(res.workerpool).toBeDefined();
    expect(res.workerpool.owner).toBe(ADDRESS);
  });

  test('[sidechain] iexec workerpool count (current user)', async () => {
    const raw = await execAsync(`${iexecPath} workerpool count --raw`);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.count).toBeDefined();
    expect(res.count).not.toBe('0');
  });

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
    const raw = await execAsync(
      `${iexecPath} order sign --skip-request-check --raw`,
    );
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
  });

  test('[sidechain] iexec order fill', async () => {
    const raw = await execAsync(
      `${iexecPath} order fill --skip-request-check --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.volume).toBe('1');
    expect(res.dealid).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await nativeChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(nativeChainGasPrice);
    sidechainDealid = res.dealid;
  });

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
    await execAsync(`${iexecPath} order sign --skip-request-check --raw`);
    const raw = await execAsync(
      `${iexecPath} order fill --skip-request-check --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.volume).toBe('5');
    expect(res.dealid).toBeDefined();
    expect(res.txHash).toBeDefined();
    const tx = await nativeChainRPC.getTransaction(res.txHash);
    expect(tx).toBeDefined();
    expect(tx.gasPrice.toString()).toBe(nativeChainGasPrice);
    sidechainDealidNoDuration = res.dealid;
  });

  test('[sidechain] iexec order cancel --app --dataset --workerpool --request', async () => {
    await execAsync(
      `${iexecPath} order sign --app --dataset --workerpool --request --skip-request-check --force --raw`,
    );
    const raw = await execAsync(
      `${iexecPath} order cancel --app --dataset --workerpool --request --force --raw`,
    ).catch((e) => e);
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
    const cancelApporderTx = await nativeChainRPC.getTransaction(
      res.apporder.txHash,
    );
    expect(cancelApporderTx).toBeDefined();
    expect(cancelApporderTx.gasPrice.toString()).toBe(nativeChainGasPrice);
    const cancelDatasetorderTx = await nativeChainRPC.getTransaction(
      res.datasetorder.txHash,
    );
    expect(cancelDatasetorderTx).toBeDefined();
    expect(cancelDatasetorderTx.gasPrice.toString()).toBe(nativeChainGasPrice);
    const cancelWorkerpoolorderTx = await nativeChainRPC.getTransaction(
      res.workerpoolorder.txHash,
    );
    expect(cancelWorkerpoolorderTx).toBeDefined();
    expect(cancelWorkerpoolorderTx.gasPrice.toString()).toBe(
      nativeChainGasPrice,
    );
    const cancelRequestorderTx = await nativeChainRPC.getTransaction(
      res.requestorder.txHash,
    );
    expect(cancelRequestorderTx).toBeDefined();
    expect(cancelRequestorderTx.gasPrice.toString()).toBe(nativeChainGasPrice);
  });

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
  });

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
  });

  test('[sidechain] iexec deal show (no deal)', async () => {
    const fakeDealId =
      '0x194488f76903579d3a3acd89cb75420d52e31e03ab194a74b95247339cf2180f';
    const raw = await execAsync(
      `${iexecPath} deal show ${fakeDealId} --raw`,
    ).catch((e) => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.deal).toBeUndefined();
  });

  test('[sidechain] iexec task show (not initialized)', async () => {
    const raw = await execAsync(
      `${iexecPath} task show ${sidechainTaskid} --raw`,
    ).catch((e) => e.message);
    const res = JSON.parse(raw);
    expect(res.ok).toBe(false);
    expect(res.task).toBeUndefined();
  });

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
    expect(res.task.consensusValue).toBe(NULL_BYTES32);
    expect(res.task.revealCounter).toBe('0');
    expect(res.task.winnerCounter).toBe('0');
    expect(res.task.contributors).toStrictEqual([]);
    expect(res.task.resultDigest).toBe(NULL_BYTES32);
    expect(res.task.results).toStrictEqual({ storage: 'none' });
    expect(res.task.statusName).toBe('ACTIVE');
    expect(res.task.taskTimedOut).toBe(false);
    expect(res.claimable).toBe(false);
  });

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
    expect(res.task.consensusValue).toBe(NULL_BYTES32);
    expect(res.task.revealCounter).toBe('0');
    expect(res.task.winnerCounter).toBe('0');
    expect(res.task.contributors).toStrictEqual([]);
    expect(res.task.resultDigest).toBe(NULL_BYTES32);
    expect(res.task.results).toStrictEqual({ storage: 'none' });
    expect(res.task.statusName).toBe('TIMEOUT');
    expect(res.task.taskTimedOut).toBe(true);
    expect(res.claimable).toBe(true);
  });

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
  });

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
    expect(res.task.consensusValue).toBe(NULL_BYTES32);
    expect(res.task.revealCounter).toBe('0');
    expect(res.task.winnerCounter).toBe('0');
    expect(res.task.contributors).toStrictEqual([]);
    expect(res.task.resultDigest).toBe(NULL_BYTES32);
    expect(res.task.results).toStrictEqual({ storage: 'none' });
    expect(res.task.statusName).toBe('FAILED');
    expect(res.task.taskTimedOut).toBe(true);
    expect(res.claimable).toBe(false);
  });

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
  });

  test('[sidechain] iexec wallet sweep', async () => {
    await setPoorWallet1();
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
  });

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
  });
});

describe('[Enterprise]', () => {
  beforeAll(async () => {
    await execAsync(`${iexecPath} init --skip-wallet --force`);
    await setRichWallet();
    await setTokenEnterpriseChain();
  });

  afterAll(async () => {
    await execAsync('rm wallet.json').catch(() => {});
    await execAsync('rm iexec.json').catch(() => {});
    await execAsync('rm chain.json').catch(() => {});
  });

  test('[token standard] iexec wallet swap-RLC-for-eRLC 10 RLC', async () => {
    const standardInitialBalance = JSON.parse(
      await execAsync(`${iexecPath} wallet show --raw`),
    ).balance;
    const enterpriseInitialBalance = JSON.parse(
      await execAsync(`${iexecPath} wallet show --chain dev-enterprise --raw`),
    ).balance;
    const raw = await execAsync(
      `${iexecPath} wallet swap-RLC-for-eRLC 6 RLC --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.txHash).toBeDefined();
    expect(res.amount).toBe('6000000000');
    await execAsync(
      `${iexecPath} wallet swap-RLC-for-eRLC 4 RLC --chain dev-enterprise --force --raw`,
    );
    const standardFinalBalance = JSON.parse(
      await execAsync(`${iexecPath} wallet show --raw`),
    ).balance;
    const enterpriseFinalBalance = JSON.parse(
      await execAsync(`${iexecPath} wallet show --chain dev-enterprise --raw`),
    ).balance;
    expect(
      new BN(standardInitialBalance.nRLC)
        .sub(new BN('10000000000'))
        .eq(new BN(standardFinalBalance.nRLC)),
    );
    expect(
      new BN(enterpriseInitialBalance.nRLC)
        .add(new BN('10000000000'))
        .eq(new BN(enterpriseFinalBalance.nRLC)),
    );
  });

  test('[token enterprise] iexec wallet swap-eRLC-for-RLC 10 RLC', async () => {
    const standardInitialBalance = JSON.parse(
      await execAsync(`${iexecPath} wallet show --raw`),
    ).balance;
    const enterpriseInitialBalance = JSON.parse(
      await execAsync(`${iexecPath} wallet show --chain dev-enterprise --raw`),
    ).balance;
    const raw = await execAsync(
      `${iexecPath} wallet swap-eRLC-for-RLC 6 RLC --chain dev-enterprise --force --raw`,
    );
    const res = JSON.parse(raw);
    expect(res.ok).toBe(true);
    expect(res.txHash).toBeDefined();
    expect(res.amount).toBe('6000000000');
    await execAsync(
      `${iexecPath} wallet swap-eRLC-for-RLC 4 RLC --force --raw`,
    );
    const standardFinalBalance = JSON.parse(
      await execAsync(`${iexecPath} wallet show --raw`),
    ).balance;
    const enterpriseFinalBalance = JSON.parse(
      await execAsync(`${iexecPath} wallet show --chain dev-enterprise --raw`),
    ).balance;
    expect(
      new BN(standardInitialBalance.nRLC)
        .sub(new BN('10000000000'))
        .eq(new BN(standardFinalBalance.nRLC)),
    );
    expect(
      new BN(enterpriseInitialBalance.nRLC)
        .add(new BN('10000000000'))
        .eq(new BN(enterpriseFinalBalance.nRLC)),
    );
  });
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
  });

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
  });

  test('check update (no --raw)', async () => {
    await expect(
      execAsync(`${iexecPath} init --skip-wallet --force`),
    ).resolves.toBeDefined();
  });

  describe('[wallet]', () => {
    let importedWalletName;
    let localWalletFileName;
    const ensLabel = `ens_${getId()}`;

    beforeAll(async () => {
      await execAsync('rm wallet.json').catch(() => {});
      await execAsync(`${iexecPath} init --skip-wallet --force`);
      await setTokenChain();
    });

    afterAll(async () => {
      await execAsync('rm -rf out/keystore').catch(() => {});
      await execAsync('rm wallet.json').catch(() => {});
      if (localWalletFileName)
        await execAsync(`rm ${localWalletFileName}`).catch(() => {});
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
      importedWalletName =
        importedWalletFileName.split('/')[
          importedWalletFileName.split('/').length - 1
        ];
    });

    test('iexec wallet create', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet create --password test --force --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.fileName).toBeDefined();
    });

    test('iexec wallet show --wallet-address <address>', async () => {
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
      expect(res.balance.ether).toBeDefined();
      expect(res.balance.nRLC).toBeDefined();
    });

    test('iexec ens register <name>', async () => {
      const raw = await execAsync(
        `${iexecPath} ens register ${ensLabel} --force --password test --wallet-address ${ADDRESS} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.name).toBe(`${ensLabel}.users.iexec.eth`);
      expect(res.address).toBe(ADDRESS);
      expect(res.registerTxHash).toMatch(bytes32Regex);
      expect(res.setResolverTxHash).toMatch(bytes32Regex);
      expect(res.setAddrTxHash).toMatch(bytes32Regex);
      expect(res.setNameTxHash).toMatch(bytes32Regex);
    });

    test('iexec wallet show --show-private-key --wallet-address <address>', async () => {
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
      expect(res.balance.ether).toBeDefined();
      expect(res.balance.nRLC).toBeDefined();
      expect(res.ens).toBe(`${ensLabel}.users.iexec.eth`);
    });

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
      expect(res.balance.ether).toBeDefined();
      expect(res.balance.nRLC).toBeDefined();
    });

    test('iexec wallet show --show-private-key --wallet-address <address> (wrong password)', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --show-private-key --password fail --wallet-address ${ADDRESS} --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe('invalid password');
      expect(res.error.name).toBe('Error');
      expect(res.wallet).toBeUndefined();
      expect(res.balance).toBeUndefined();
    });

    test('iexec wallet show --wallet-address <address> (missing wallet file)', async () => {
      const raw = await execAsync(
        `${iexecPath}  wallet show --wallet-address ${POOR_ADDRESS1} --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe(
        'Failed to load wallet address from keystore: Wallet file not found',
      );
      expect(res.error.name).toBe('Error');
      expect(res.wallet).toBeUndefined();
      expect(res.balance).toBeUndefined();
    });

    // keystoredir custom
    test('iexec wallet import --keystoredir [path]', async () => {
      await execAsync('rm -rf out/keystore && mkdir out/keystore').catch(
        () => {},
      );
      const raw = await execAsync(
        `${iexecPath}  wallet import ${POOR_PRIVATE_KEY1} --password customPath --keystoredir ./out/keystore --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.address).toBe(POOR_ADDRESS1);
      expect(res.fileName.indexOf('out/keystore/')).not.toBe(-1);
    });

    test('iexec wallet show --keystoredir [path]', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --password customPath --keystoredir ./out/keystore --wallet-address ${POOR_ADDRESS1} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(POOR_ADDRESS1);
    });

    // keystoredir local
    test('iexec wallet import --keystoredir local', async () => {
      await execAsync('rm -rf out/keystore && mkdir out/keystore').catch(
        () => {},
      );
      const raw = await execAsync(
        `${iexecPath} wallet import ${POOR_PRIVATE_KEY2} --password 'my local pass phrase' --keystoredir local --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.address).toBe(POOR_ADDRESS2);
      expect(res.fileName.indexOf('/')).toBe(-1);
      localWalletFileName = res.fileName;
    });

    test('iexec wallet show --keystoredir [path]', async () => {
      const raw = await execAsync(
        `${iexecPath} wallet show --password 'my local pass phrase' --keystoredir local --wallet-address ${POOR_ADDRESS2} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(POOR_ADDRESS2);
    });

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
    });

    test('iexec wallet show (unencrypted wallet.json)', async () => {
      const raw = await execAsync(`${iexecPath} wallet show --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.wallet).toBeDefined();
      expect(res.wallet.address).toBe(POOR_ADDRESS1);
    });

    test('iexec wallet show [address]', async () => {
      const raw = await execAsync(`${iexecPath} wallet show ${ADDRESS} --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.balance).toBeDefined();
      expect(res.balance.ether).toBeDefined();
      expect(res.balance.nRLC).toBeDefined();
      expect(res.balance.ether).not.toBe('0');
      expect(res.balance.nRLC).not.toBe('0');
      expect(res.wallet).toBeUndefined();
    });
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
      expect(res.balance.ether).toBeDefined();
      expect(res.balance.nRLC).toBeDefined();
    });

    test('no wallet in keystore, fail on send', async () => {
      await execAsync('rm wallet.json').catch(() => {});
      const raw = await execAsync(
        `${iexecPath} account withdraw 0 ${ADDRESS} --keystoredir ./null --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe(
        "ENOENT: no such file or directory, scandir 'null'",
      );
      expect(res.error.name).toBe('Error');
    });
  });

  describe('[tx option]', () => {
    beforeAll(async () => {
      await execAsync(`${iexecPath} init --skip-wallet --force`);
      await setTokenChain();
      await setRichWallet();
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
    test.skip('tx --gas-price 0', async () => {
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
    test('tx --gas-price 1.1 gwei', async () => {
      const raw = await execAsync(
        `${iexecPath} account deposit 1 --gas-price 1.1 gwei --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.txHash).toBeDefined();
      const tx = await tokenChainRPC.getTransaction(res.txHash);
      expect(tx).toBeDefined();
      expect(tx.gasPrice.toString()).toBe('1100000000');
    });
    test('tx --gas-price -1 (invalid gas-price)', async () => {
      const raw = await execAsync(
        `${iexecPath} account deposit 1 --gas-price -1 --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.txHash).toBeUndefined();
      expect(res.error.message).toBe('-1 is not a valid amount');
    });
    test('tx --gas-price 0.1 wei (invalid gas-price)', async () => {
      const raw = await execAsync(
        `${iexecPath} account deposit 1 --gas-price 0.1 wei --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.txHash).toBeUndefined();
      expect(res.error.message).toBe('0.1 wei is not a valid amount');
    });
    test('tx --gas-price 1 ethereum (invalid gas-price)', async () => {
      const raw = await execAsync(
        `${iexecPath} account deposit 1 --gas-price 1 ethereum --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.txHash).toBeUndefined();
      expect(res.error.message).toBe('1 ethereum is not a valid amount');
    });
  });

  describe('[dataset encryption]', () => {
    beforeAll(async () => {
      await execAsync(`${iexecPath} init --skip-wallet --force`);
      await setTokenChain();
      await setRichWallet();
    });

    test('iexec dataset init --tee', async () => {
      const raw = await execAsync(`${iexecPath} dataset init --tee --raw`);
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
        `${iexecPath} dataset encrypt --original-dataset-dir inputs/originalDataset --force --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.encryptedDatasetFolderPath).toBeDefined();
      expect(res.secretPath).toBeDefined();
      expect(
        res.encryptedDatasetFolderPath.indexOf('/datasets/encrypted'),
      ).not.toBe(-1);
      expect(res.secretPath.indexOf('/.secrets/datasets')).not.toBe(-1);
      expect(res.encryptedFiles).toBeDefined();
      expect(res.encryptedFiles.length).toBe(2);
      expect(res.encryptedFiles[0].original).toBeDefined();
      expect(res.encryptedFiles[0].encrypted).toBeDefined();
      expect(res.encryptedFiles[0].key).toBeDefined();
      expect(res.encryptedFiles[0].checksum).toMatch(bytes32Regex);
      expect(res.encryptedFiles[1].original).toBeDefined();
      expect(res.encryptedFiles[1].encrypted).toBeDefined();
      expect(res.encryptedFiles[1].key).toBeDefined();
      expect(res.encryptedFiles[1].checksum).toMatch(bytes32Regex);
      expect(await checkExists(filePath('.secrets/datasets/dataset.key'))).toBe(
        true,
      );
      expect(
        await checkExists(filePath('.secrets/datasets/dataset.txt.key')),
      ).toBe(true);
      expect(
        await checkExists(filePath('.secrets/datasets/dataset.zip.key')),
      ).toBe(true);
      expect(
        await checkExists(filePath('datasets/encrypted/dataset.txt.enc')),
      ).toBe(true);
      expect(
        await checkExists(filePath('datasets/encrypted/dataset.zip.enc')),
      ).toBe(true);

      // decrypt with openssl
      const decryptedFilePath = 'out/decrypted';
      await expect(
        execAsync(
          `tail -c+17 "${res.encryptedFiles[0].encrypted}" | openssl enc -d -aes-256-cbc -out "${decryptedFilePath}" -K $(cat "${res.encryptedFiles[1].key}" | base64 -d | xxd -p -c 32) -iv $(head -c 16 "${res.encryptedFiles[0].encrypted}" | xxd -p -c 16)`,
        ),
      ).rejects.toBeInstanceOf(Error);
      await expect(
        execAsync(
          `tail -c+17 "${res.encryptedFiles[0].encrypted}" | openssl enc -d -aes-256-cbc -out "${decryptedFilePath}" -K $(cat "${res.encryptedFiles[0].key}" | base64 -d | xxd -p -c 32) -iv $(head -c 16 "${res.encryptedFiles[0].encrypted}" | xxd -p -c 16)`,
        ),
      ).resolves.toBeDefined();
      await expect(
        execAsync(
          `tail -c+17 "${res.encryptedFiles[1].encrypted}" | openssl enc -d -aes-256-cbc -out "${decryptedFilePath}" -K $(cat "${res.encryptedFiles[1].key}" | base64 -d | xxd -p -c 32) -iv $(head -c 16 "${res.encryptedFiles[1].encrypted}" | xxd -p -c 16)`,
        ),
      ).resolves.toBeDefined();
    });

    test('iexec dataset push-secret', async () => {
      await setRichWallet();
      await setTokenChainOpenethereum();
      await execAsync('mkdir -p .secrets/datasets/').catch(() => {});
      await execAsync('echo oops > ./.secrets/datasets/dataset.key');
      const randomAddress = getRandomAddress();
      const resPushNotAllowed = JSON.parse(
        await execAsync(
          `${iexecPath} dataset push-secret ${randomAddress} --raw`,
        ).catch((e) => e.message),
      );
      expect(resPushNotAllowed.ok).toBe(false);
      expect(resPushNotAllowed.error.message).toBe(
        `Wallet ${ADDRESS} is not allowed to set secret for ${randomAddress}`,
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
          (e) => e.message,
        ),
      );
      expect(resAlreadyExists.ok).toBe(false);
      expect(resAlreadyExists.error.message).toBe(
        `Secret already exists for ${address} and can't be updated`,
      );
      // new dataset to push secret on another TEE framework
      await execAsync(`${iexecPath} dataset init`);
      await setDatasetUniqueName();
      const { address: address2 } = JSON.parse(
        await execAsync(`${iexecPath} dataset deploy --raw`),
      );
      await expect(
        execAsync(
          `${iexecPath} dataset push-secret ${address2} --tee-framework foo --raw`,
        ),
      ).rejects.toThrow();
      const resPush2 = JSON.parse(
        await execAsync(
          `${iexecPath} dataset push-secret ${address2} --tee-framework gramine --raw`,
        ),
      );
      expect(resPush2.ok).toBe(true);
      const resAlreadyExists2 = JSON.parse(
        await execAsync(
          `${iexecPath} dataset push-secret ${address2} --tee-framework gramine --raw`,
        ).catch((e) => e.message),
      );
      expect(resAlreadyExists2.ok).toBe(false);
    });

    test('iexec dataset check-secret', async () => {
      await setRichWallet();
      await setTokenChainOpenethereum();
      await execAsync('mkdir -p .secrets/datasets/').catch(() => {});
      await execAsync('echo oops > ./.secrets/datasets/dataset.key');
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

      // testing on gramine dataset

      await execAsync(`${iexecPath} dataset init`);
      await setDatasetUniqueName();
      await execAsync(`${iexecPath} dataset deploy --raw`);
      const resMyDataset2 = JSON.parse(
        await execAsync(`${iexecPath} dataset check-secret --raw`),
      );
      expect(resMyDataset2.ok).toBe(true);
      expect(resMyDataset2.isSecretSet).toBe(false);

      await execAsync(
        `${iexecPath} dataset push-secret --tee-framework gramine --raw`,
      );
      const rawWrongTee = await execAsync(
        `${iexecPath} dataset check-secret --raw`,
      );
      const resWrongTee = JSON.parse(rawWrongTee);
      expect(resWrongTee.ok).toBe(true);
      expect(resWrongTee.isSecretSet).toBe(false);

      const rawGoodTee = await execAsync(
        `${iexecPath} dataset check-secret --tee-framework gramine --raw`,
      );
      const resGoodTee = JSON.parse(rawGoodTee);
      expect(resGoodTee.ok).toBe(true);
      expect(resGoodTee.isSecretSet).toBe(true);

      const rawRandomDataset2 = await execAsync(
        `${iexecPath} dataset check-secret ${getRandomAddress()} --raw`,
      );
      const resRandomDataset2 = JSON.parse(rawRandomDataset2);
      expect(resRandomDataset2.ok).toBe(true);
      expect(resRandomDataset2.isSecretSet).toBe(false);

      await expect(
        execAsync(
          `${iexecPath} dataset check-secret ${getRandomAddress()} --tee-framework foo --raw`,
        ),
      ).rejects.toThrow();
    });
  });

  describe('[result]', () => {
    beforeAll(async () => {
      await execAsync(`${iexecPath} init --skip-wallet --force`);
      await setTokenChain();
    });
    if (semver.gt('v10.12.0', process.version)) {
      test('iexec result generate-encryption-keypair (node version < v10.12.0)', async () => {
        const raw = await execAsync(
          `${iexecPath} result generate-encryption-keypair --force --raw`,
        ).catch((e) => e.message);
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
        ).catch((e) => e.message);
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
        await setRichWallet();
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
      });

      test('iexec result generate-keys (v4 legacy name)', async () => {
        await setRichWallet();
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
      });
    }

    test('iexec result push-encryption-key', async () => {
      await setTokenChainOpenethereum();
      const { address } = await setWallet();
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
      ).catch((e) => e.message);
      const resAlreadyExists = JSON.parse(rawAlreadyExists);
      expect(resAlreadyExists.ok).toBe(false);
      const rawAlreadyExistsForTeeFramework = await execAsync(
        `${iexecPath} result push-encryption-key --tee-framework scone --raw`,
      ).catch((e) => e.message);
      const resAlreadyExistsForTeeFramework = JSON.parse(
        rawAlreadyExistsForTeeFramework,
      );
      expect(resAlreadyExistsForTeeFramework.ok).toBe(false);
      const resNotExistsForTeeFramework = JSON.parse(
        await execAsync(
          `${iexecPath} result push-encryption-key --tee-framework gramine --raw`,
        ),
      );
      expect(resNotExistsForTeeFramework.ok).toBe(true);
      expect(resNotExistsForTeeFramework.isPushed).toBe(true);
      expect(resNotExistsForTeeFramework.isUpdated).toBe(false);
    });

    test('iexec result push-encryption-key --force-update', async () => {
      await setTokenChainOpenethereum();
      const { address } = await setWallet();
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
    });

    test('iexec result push-secret (v4 legacy name)', async () => {
      await setTokenChainOpenethereum();
      const { privateKey, publicKey, address } = getRandomWallet();
      await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
      await execAsync('mkdir -p .secrets/beneficiary/').catch(() => {});
      await execAsync(
        `cp ./inputs/beneficiaryKeys/key.pub ./.secrets/beneficiary/${address}_key.pub`,
      );
      const raw = await execAsync(`${iexecPath} result push-secret --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
    });

    test('iexec result check-encryption-key', async () => {
      await setTokenChainOpenethereum();
      const { privateKey, address } = getRandomWallet();
      const rawUserKey = await execAsync(
        `${iexecPath} result check-encryption-key ${address} --raw`,
      );
      const resUserKey = JSON.parse(rawUserKey);
      expect(resUserKey.ok).toBe(true);
      expect(resUserKey.isEncryptionKeySet).toBe(false);
      await setWallet(privateKey);
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
      const rawExists = await execAsync(
        `${iexecPath} result check-encryption-key --raw`,
      );
      const resExists = JSON.parse(rawExists);
      expect(resExists.ok).toBe(true);
      expect(resExists.isEncryptionKeySet).toBe(true);

      const rawExistsOnTeeFramework = await execAsync(
        `${iexecPath} result check-encryption-key --tee-framework scone --raw`,
      );
      const resExistsOnTeeFramework = JSON.parse(rawExistsOnTeeFramework);
      expect(resExistsOnTeeFramework.ok).toBe(true);
      expect(resExistsOnTeeFramework.isEncryptionKeySet).toBe(true);

      const rawNotExistsOnTeeFramework = await execAsync(
        `${iexecPath} result check-encryption-key --tee-framework gramine --raw`,
      );
      const resNotExistsOnTeeFramework = JSON.parse(rawNotExistsOnTeeFramework);
      expect(resNotExistsOnTeeFramework.ok).toBe(true);
      expect(resNotExistsOnTeeFramework.isEncryptionKeySet).toBe(false);
    });

    test('iexec result check-secret (v4 legacy name)', async () => {
      await setTokenChainOpenethereum();
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
    });

    test('iexec result decrypt --force (wrong beneficiary key)', async () => {
      await setRichWallet();
      await execAsync('mkdir .secrets').catch(() => {});
      await execAsync('mkdir .secrets/beneficiary').catch(() => {});
      await execAsync(
        'cp ./inputs/beneficiaryKeys/unexpected_0x7bd4783FDCAD405A28052a0d1f11236A741da593_key ./.secrets/beneficiary/0x7bd4783FDCAD405A28052a0d1f11236A741da593_key',
      );
      const raw = await execAsync(
        `${iexecPath} result decrypt inputs/encryptedResults/encryptedResults.zip --force --raw`,
      ).catch((e) => e.message);
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
      await setRichWallet();
      const raw = await execAsync(
        `${iexecPath} result decrypt inputs/encryptedResults/encryptedResults.zip --wallet-address ${ADDRESS} --beneficiary-keystoredir inputs/beneficiaryKeys/ --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.resultsPath).toBeDefined();
      expect(res.resultsPath.indexOf('results.zip')).not.toBe(-1);
    });

    test('iexec result decrypt --beneficiary-keystoredir <path> --beneficiary-key-file <fileName> --force ', async () => {
      await setRichWallet();
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
    beforeAll(async () => {
      await setTokenChainOpenethereum();
    });

    test('iexec storage init', async () => {
      const { privateKey, publicKey, address } = getRandomWallet();
      await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
      const raw = await execAsync(`${iexecPath} storage init --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.isInitialized).toBe(true);
      expect(res.isUpdated).toBe(false);
      const rawAlreadyExists = await execAsync(
        `${iexecPath} storage init --raw`,
      ).catch((e) => e.message);
      const resAlreadyExists = JSON.parse(rawAlreadyExists);
      expect(resAlreadyExists.ok).toBe(false);
      expect(resAlreadyExists.error.message).toBe(
        'default storage is already initialized, use --force-update option to update your storage token',
      );
      const rawInitWithTeeFramework = await execAsync(
        `${iexecPath} storage init --tee-framework gramine --raw`,
      );
      const resInitWithTeeFramework = JSON.parse(rawInitWithTeeFramework);
      expect(resInitWithTeeFramework.ok).toBe(true);
      expect(resInitWithTeeFramework.isInitialized).toBe(true);
      expect(resInitWithTeeFramework.isUpdated).toBe(false);
    });

    test('iexec storage init --force-update', async () => {
      const { privateKey, publicKey, address } = getRandomWallet();
      await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
      const raw = await execAsync(
        `${iexecPath} storage init --force-update --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.isInitialized).toBe(true);
      expect(res.isUpdated).toBe(false);
      const rawAlreadyExists = await execAsync(
        `${iexecPath} storage init --force-update --raw`,
      );
      const resAlreadyExists = JSON.parse(rawAlreadyExists);
      expect(resAlreadyExists.ok).toBe(true);
      expect(resAlreadyExists.isInitialized).toBe(true);
      expect(resAlreadyExists.isUpdated).toBe(true);
    });

    test('iexec storage init dropbox', async () => {
      const { privateKey, publicKey, address } = getRandomWallet();
      await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
      const raw = await execAsync(
        `${iexecPath} storage init dropbox --token oops --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.isInitialized).toBe(true);
      expect(res.isUpdated).toBe(false);
      const rawAlreadyExists = await execAsync(
        `${iexecPath} storage init dropbox --token oops --raw`,
      ).catch((e) => e.message);
      const resAlreadyExists = JSON.parse(rawAlreadyExists);
      expect(resAlreadyExists.ok).toBe(false);
      expect(resAlreadyExists.error.message).toBe(
        'dropbox storage is already initialized, use --force-update option to update your storage token',
      );
    });

    test('iexec storage init unsupported', async () => {
      const { privateKey, publicKey, address } = getRandomWallet();
      await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
      const raw = await execAsync(
        `${iexecPath} storage init unsupported --token oops --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe('"unsupported" not supported');
    });

    test('iexec storage check', async () => {
      const { privateKey, publicKey, address } = getRandomWallet();
      await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
      const raw = await execAsync(`${iexecPath} storage check --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.isInitialized).toBe(false);
      await execAsync(`${iexecPath} storage init --raw`);
      const rawAlreadyExists = await execAsync(
        `${iexecPath} storage check --raw`,
      );
      const resAlreadyExists = JSON.parse(rawAlreadyExists);
      expect(resAlreadyExists.ok).toBe(true);
      expect(resAlreadyExists.isInitialized).toBe(true);
      const rawWithTeeFramework = await execAsync(
        `${iexecPath} storage check --tee-framework gramine --raw`,
      );
      const resWithTeeFramework = JSON.parse(rawWithTeeFramework);
      expect(resWithTeeFramework.ok).toBe(true);
      expect(resWithTeeFramework.isInitialized).toBe(false);
    });

    test('iexec storage check --user', async () => {
      const { privateKey, publicKey, address } = getRandomWallet();
      const randomAddress = getRandomAddress();
      await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
      const raw = await execAsync(
        `${iexecPath} storage check --user ${randomAddress} --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.isInitialized).toBe(false);
      await execAsync(`${iexecPath} storage init --raw`);
      const rawAlreadyExists = await execAsync(
        `${iexecPath} storage check --user ${randomAddress} --raw`,
      );
      const resAlreadyExists = JSON.parse(rawAlreadyExists);
      expect(resAlreadyExists.ok).toBe(true);
      expect(resAlreadyExists.isInitialized).toBe(false);
    });

    test('iexec storage check dropbox', async () => {
      const { privateKey, publicKey, address } = getRandomWallet();
      await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
      const raw = await execAsync(`${iexecPath} storage check dropbox --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.isInitialized).toBe(false);
      await execAsync(`${iexecPath} storage init dropbox --token oops --raw`);
      const rawAlreadyExists = await execAsync(
        `${iexecPath} storage check dropbox --raw`,
      );
      const resAlreadyExists = JSON.parse(rawAlreadyExists);
      expect(resAlreadyExists.ok).toBe(true);
      expect(resAlreadyExists.isInitialized).toBe(true);
    });

    test('iexec storage check unsupported', async () => {
      const { privateKey, publicKey, address } = getRandomWallet();
      await saveJSONToFile({ privateKey, publicKey, address }, 'wallet.json');
      const raw = await execAsync(
        `${iexecPath} storage check unsupported --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.error.message).toBe('"unsupported" not supported');
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
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.fail.length).toBe(3);
      expect(res.validated.length).toBe(0);
    });

    test('iexec registry validate dataset (invalid iexec.json, missing deployed.json, missing logo)', async () => {
      const raw = await execAsync(
        `${iexecPath} registry validate dataset --raw`,
      ).catch((e) => e.message);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(false);
      expect(res.fail.length).toBe(3);
      expect(res.validated.length).toBe(0);
    });

    test('iexec registry validate workerpool (invalid iexec.json, missing deployed.json, missing logo)', async () => {
      const raw = await execAsync(
        `${iexecPath} registry validate workerpool --raw`,
      ).catch((e) => e.message);
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

    test('iexec registry validate app (tee app)', async () => {
      await execAsync('cp ./inputs/validator/iexec-app-tee.json iexec.json');
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

  describe('[chain.json]', () => {
    beforeAll(async () => {
      await execAsync(`${iexecPath} init --skip-wallet --force`);
      await loadJSONFile('chain.json').then((obj) => {
        const chainJson = {
          ...obj,
          chains: {
            ...obj.chains,
            mainnet: {
              ...(obj.chains && obj.chains.mainnet),
              host: mainnetHost,
            },
            goerli: { ...(obj.chains && obj.chains.goerli), host: goerliHost },
          },
        };
        saveJSONToFile(chainJson, 'chain.json');
      });
    });

    test('no "native" overwrites in templates', async () => {
      const { chains } = await loadJSONFile('chain.json');
      expect(chains.goerli.native).toBeUndefined();
      expect(chains.mainnet.native).toBeUndefined();
      expect(chains.bellecour.native).toBeUndefined();
    });

    test('mainnet is not native', async () => {
      const raw = await execAsync(`${iexecPath} info --chain mainnet --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.useNative).toBe(false);
    });

    test('goerli is not native', async () => {
      const raw = await execAsync(`${iexecPath} info --chain goerli --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.useNative).toBe(false);
    });

    test('viviani is native', async () => {
      const raw = await execAsync(`${iexecPath} info --chain viviani --raw`);
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.useNative).toBe(true);
    });

    test('bellecour is native', async () => {
      const raw = await execAsync(
        `${iexecPath} info ${ADDRESS} --chain bellecour --raw`,
      );
      const res = JSON.parse(raw);
      expect(res.ok).toBe(true);
      expect(res.useNative).toBe(true);
    });

    test.skip(
      'providers config',
      async () => {
        const chainJsonDefault = await loadJSONFile('chain.json');
        const alchemyFailQuorumFail = {
          alchemy: 'FAIL',
          quorum: 3,
        };
        const alchemyFailQuorumPass = {
          alchemy: 'FAIL',
          quorum: 2,
        };
        const infuraFailQuorumFail = {
          infura: 'FAIL',
          quorum: 3,
        };
        const infuraFailQuorumPass = {
          infura: 'FAIL',
          quorum: 2,
        };
        const etherscanFailQuorumFail = {
          etherscan: 'FAIL',
          quorum: 3,
        };
        const etherscanFailQuorumPass = {
          etherscan: 'FAIL',
          quorum: 2,
        };

        await saveJSONToFile(
          {
            ...chainJsonDefault,
            providers: alchemyFailQuorumFail,
          },
          'chain.json',
        );
        await expect(
          execAsync(`${iexecPath} wallet show ${ADDRESS} --chain goerli --raw`),
        ).rejects.toThrow();
        await saveJSONToFile(
          {
            ...chainJsonDefault,
            providers: alchemyFailQuorumPass,
          },
          'chain.json',
        );
        await expect(
          execAsync(`${iexecPath} wallet show ${ADDRESS} --chain goerli --raw`),
        ).resolves.toBeDefined();

        await saveJSONToFile(
          {
            ...chainJsonDefault,
            providers: etherscanFailQuorumFail,
          },
          'chain.json',
        );
        await expect(
          execAsync(`${iexecPath} wallet show ${ADDRESS} --chain goerli --raw`),
        ).rejects.toThrow();
        await saveJSONToFile(
          {
            ...chainJsonDefault,
            providers: etherscanFailQuorumPass,
          },
          'chain.json',
        );
        await expect(
          execAsync(`${iexecPath} wallet show ${ADDRESS} --chain goerli --raw`),
        ).resolves.toBeDefined();

        await saveJSONToFile(
          {
            ...chainJsonDefault,
            providers: infuraFailQuorumFail,
          },
          'chain.json',
        );
        await expect(
          execAsync(`${iexecPath} wallet show ${ADDRESS} --chain goerli --raw`),
        ).rejects.toThrow();
        await saveJSONToFile(
          {
            ...chainJsonDefault,
            providers: infuraFailQuorumPass,
          },
          'chain.json',
        );
        await expect(
          execAsync(`${iexecPath} wallet show ${ADDRESS} --chain goerli --raw`),
        ).resolves.toBeDefined();
      },
      DEFAULT_TIMEOUT * 2,
    );
  });
});
