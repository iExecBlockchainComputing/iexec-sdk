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
test('setup', async () => {
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

test(
  '[common] iexec init',
  async () => expect(
    execAsync(`${iexecPath} init --password test --force ${saveRaw()}`),
  ).resolves.not.toBe(1),
  10000,
);

// CHAIN.JSON
test('[mainchain] edit chain.json use mainchain', async () => {
  const chains = await loadJSONFile('chain.json');
  chains.default = chainName;
  chains.chains.dev.hub = hubAddress;
  chains.chains.dev.host = ethereumURL;
  chains.chains.dev.id = networkId;
  await saveJSONToFile(chains, 'chain.json');
});

test(
  '[common] iexec wallet create',
  () => expect(
    execAsync(
      `${iexecPath} wallet create --password test --force ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

test(
  '[common] iexec wallet import',
  () => expect(
    execAsync(
      `${iexecPath} wallet import ${PRIVATE_KEY} --password test --force --raw > out/walletImport_stdout.json`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

test(
  'iexec wallet show (+ wallet from address)',
  () => expect(
    execAsync(
      `${iexecPath} wallet show --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

test('iexec wallet show (+ wallet from file name)', async () => {
  const { fileName } = await loadJSONFile('out/walletImport_stdout.json');
  const walletFile = fileName.split('/')[fileName.split('/').length - 1];
  return expect(
    execAsync(
      `${iexecPath} wallet show --password test --wallet-file ${walletFile} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1);
}, 10000);

test(
  'iexec wallet show (wrong password)',
  () => expect(
    execAsync(
      `${iexecPath} wallet show --password fail --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).rejects.not.toBe(1),
  10000,
);

test(
  'iexec wallet show (missing wallet file)',
  () => expect(
    execAsync(
      `${iexecPath} wallet show --password fail --wallet-address ${ADDRESS2} ${saveRaw()}`,
    ),
  ).rejects.not.toBe(1),
  10000,
);

test(
  'iexec wallet show [address]',
  () => expect(
    execAsync(`${iexecPath} wallet show ${ADDRESS} ${saveRaw()}`),
  ).resolves.not.toBe(1),
  10000,
);

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

// ACCOUNT
test(
  'iexec account show (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} account show --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
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
  const raw = await execAsync(
    `${iexecPath} account deposit ${amount} --password test --wallet-address ${ADDRESS} --raw`,
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
  expect(initialWalletBalance.sub(bnAmount).eq(finalWalletBalance)).toBe(true);
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
    `${iexecPath} account withdraw ${amount} --password test --wallet-address ${ADDRESS} --raw`,
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
  expect(initialWalletBalance.add(bnAmount).eq(finalWalletBalance)).toBe(true);
  expect(initialAccountBalance.sub(bnAmount).eq(finalAccountBalance)).toBe(
    true,
  );
}, 30000);
test(
  'iexec account withdraw 500 --gas-price 1000000000 (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} account withdraw 500 --gas-price 1000000000 --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  15000,
);

// APP
test(
  '[common] iexec app init (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} app init --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test('[common] iexec app init (no wallet)', () => expect(execAsync(`${iexecPath} app init ${saveRaw()}`)).resolves.not.toBe(1));
test(
  'iexec app deploy (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} app deploy --password test --wallet-address ${ADDRESS} --raw > out/appDeploy_stdout.json`,
    ),
  ).resolves.not.toBe(1),
  15000,
);
test(
  'iexec app show 1 (no wallet)',
  () => expect(execAsync(`${iexecPath} app show 1 ${saveRaw()}`)).resolves.not.toBe(
    1,
  ),
  10000,
);
test(
  'iexec app show 1 (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} app show 1 --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
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
  () => expect(execAsync(`${iexecPath} app count ${saveRaw()}`)).resolves.not.toBe(
    1,
  ),
  10000,
);
test(
  'iexec app count (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} app count --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
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
    execAsync(
      `${iexecPath} dataset init --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test('[common] iexec dataset init (no wallet)', () => expect(execAsync(`${iexecPath} dataset init ${saveRaw()}`)).resolves.not.toBe(
  1,
));
test(
  'iexec dataset deploy (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} dataset deploy --password test --wallet-address ${ADDRESS} --raw > out/datasetDeploy_stdout.json`,
    ),
  ).resolves.not.toBe(1),
  15000,
);
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
    execAsync(
      `${iexecPath} dataset show 1 --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
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
    execAsync(
      `${iexecPath} dataset count --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
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
    execAsync(
      `${iexecPath} workerpool init --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test('[common] iexec workerpool init (no wallet)', () => expect(execAsync(`${iexecPath} workerpool init`)).resolves.not.toBe(1));
test(
  'iexec workerpool deploy (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} workerpool deploy --password test --wallet-address ${ADDRESS} --raw > out/workerpoolDeploy_stdout.json`,
    ),
  ).resolves.not.toBe(1),
  15000,
);
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
    execAsync(
      `${iexecPath} workerpool show 1 --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
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
    execAsync(
      `${iexecPath} workerpool count --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test(
  'iexec workerpool count --user',
  () => expect(
    execAsync(`${iexecPath} workerpool count --user ${ADDRESS} ${saveRaw()}`),
  ).resolves.not.toBe(1),
  10000,
);

// CATEGORY
test('[common] iexec category init', () => expect(execAsync(`${iexecPath} category init`)).resolves.not.toBe(1));
test(
  'iexec category create (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} category create --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
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
    execAsync(
      `${iexecPath} order init --request --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

// edit order
test('edit requestOrder app iexec.json => use deployed app', async () => {
  const { address } = await loadJSONFile('out/appDeploy_stdout.json');
  return expect(
    execAsync(
      `sed -i 's/"app": "0x0000000000000000000000000000000000000000",/"app": "${address}",/' iexec.json`,
    ),
  ).resolves.not.toBe(1);
});
test('edit requestOrder dataset iexec.json => use deployed dataset', async () => {
  const { address } = await loadJSONFile('out/datasetDeploy_stdout.json');
  return expect(
    execAsync(
      `sed -i 's/"dataset": "0x0000000000000000000000000000000000000000",/"dataset": "${address}",/' iexec.json`,
    ),
  ).resolves.not.toBe(1);
});
test('edit requestOrder workerpool iexec.json => use deployed workerpool', async () => {
  const { address } = await loadJSONFile('out/workerpoolDeploy_stdout.json');
  return expect(
    execAsync(
      `sed -i 's/"workerpool": "0x0000000000000000000000000000000000000000",/"workerpool": "${address}",/' iexec.json`,
    ),
  ).resolves.not.toBe(1);
});

test(
  'iexec order sign (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} order sign --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  30000,
);

test(
  'iexec order sign --request (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} order sign --request --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  15000,
);

test(
  'iexec order fill (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} order fill --password test --wallet-address ${ADDRESS} --raw > 'out/orderFill_stdout.json'`,
    ),
  ).resolves.not.toBe(1),
  15000,
);

test(
  'iexec order sign --app (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} order sign --app --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  15000,
);
test(
  'iexec order sign --dataset (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} order sign --dataset --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  15000,
);
test(
  'iexec order sign --workerpool (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} order sign --workerpool --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  15000,
);

test(
  'iexec order fill --params <params> --force (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} order fill --params 'arg --option "multiple words"' --force --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  15000,
);

test(
  'iexec order cancel --app (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} order cancel --app --force --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  15000,
);
test(
  'iexec order cancel --dataset (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} order cancel --dataset --force --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  15000,
);
test(
  'iexec order cancel --workerpool (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} order cancel --workerpool --force --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  15000,
);
test(
  'iexec order cancel --request (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} order cancel --request --force --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
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

// tee
test('[common] iexec tee init', async () => expect(execAsync(`${iexecPath} tee init ${saveRaw()}`)).resolves.not.toBe(1));

test('[common] iexec tee encrypt-dataset', async () => expect(
  execAsync(
    `${iexecPath} tee encrypt-dataset --original-dataset-dir inputs/originalDataset ${saveRaw()}`,
  ),
).resolves.not.toBe(1));

// require docker
if (!DRONE) {
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

// require docker
if (!DRONE) {
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
    `${iexecPath} tee decrypt-results inputs/encryptedResults/encryptedResults.zip --beneficiary-keystoredir inputs/beneficiaryKeys/ ${saveRaw()}`,
  ),
).resolves.not.toBe(1));

test('[common] iexec tee decrypt-results --beneficiary-keystoredir <path> --beneficiary-key-file <fileName> --force ', async () => expect(
  execAsync(
    `${iexecPath} tee decrypt-results inputs/encryptedResults/encryptedResults.zip --beneficiary-keystoredir inputs/beneficiaryKeys/ --beneficiary-key-file 0xC08C3def622Af1476f2Db0E3CC8CcaeAd07BE3bB_key  --force ${saveRaw()}`,
  ),
).resolves.not.toBe(1));

// keystoredir custom
test(
  '[common] iexec wallet import --keystoredir [path]',
  () => expect(
    execAsync(
      `${iexecPath} wallet import ${PRIVATE_KEY2} --password customPath --keystoredir ~/temp/iexecSDKTest ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

test(
  'iexec wallet show --keystoredir [path] --wallet-address',
  () => expect(
    execAsync(
      `${iexecPath} wallet show --password customPath --keystoredir ~/temp/iexecSDKTest --wallet-address ${ADDRESS2} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

// keystoredir local
test(
  '[common] iexec wallet import --keystoredir local',
  () => expect(
    execAsync(
      `${iexecPath} wallet import ${PRIVATE_KEY3} --password 'my local pass phrase' --keystoredir local ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

test(
  'iexec wallet show --keystoredir local --wallet-address',
  () => expect(
    execAsync(
      `${iexecPath} wallet show --password 'my local pass phrase' --keystoredir local --wallet-address ${ADDRESS3} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

// sendETH
test('iexec wallet sendETH', async () => {
  const raw = await execAsync(
    `${iexecPath} wallet sendETH 1 --to ${ADDRESS2} --force --password test --wallet-address ${ADDRESS} --raw`,
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
    `${iexecPath} wallet sendRLC 1000000000 --to ${ADDRESS2} --force --password test --wallet-address ${ADDRESS} --raw`,
  );
  const res = JSON.parse(raw);
  expect(res.ok).toBe(true);
  expect(res.from).toBe(ADDRESS);
  expect(res.to).toBe(ADDRESS2);
  expect(res.amount).toBe('1000000000');
  expect(res.txHash).not.toBe(undefined);
}, 10000);

// unecrypted wallet
test(
  '[common] iexec wallet import --unencrypted',
  () => expect(
    execAsync(
      `${iexecPath} wallet import ${PRIVATE_KEY2} --unencrypted ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

test(
  'iexec wallet show (unencrypted wallet.json)',
  () => expect(
    execAsync(`${iexecPath} wallet show ${saveRaw()}`),
  ).resolves.not.toBe(1),
  10000,
);

test('iexec wallet sweep (unencrypted wallet.json)', async () => {
  const raw = await execAsync(
    `${iexecPath} wallet sweep --to ${ADDRESS} --force --raw`,
  );
  const res = JSON.parse(raw);
  await execAsync('mv wallet.json wallet.back');
  expect(res.ok).toBe(true);
  expect(res.from).toBe(ADDRESS2);
  expect(res.to).toBe(ADDRESS);
  expect(res.sendERC20TxHash).not.toBe(undefined);
  expect(res.sendNativeTxHash).not.toBe(undefined);
  expect(res.errors).toBe(undefined);
}, 15000);

test('[sidechain] edit chain.json use sidechain', async () => {
  const chains = await loadJSONFile('chain.json');
  chains.chains.dev.hub = nativeHubAddress;
  chains.chains.dev.native = true;
  await saveJSONToFile(chains, 'chain.json');
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

test('[sidechain] iexec wallet show (+ wallet from address)', async () => {
  const raw = await execAsync(
    `${iexecPath} wallet show --password test --wallet-address ${ADDRESS} --raw`,
  );
  const res = JSON.parse(raw);
  expect(res.ok).toBe(true);
  expect(res.balance.ETH.substr(0, 2)).toBe(res.balance.nRLC.substr(0, 2));
  expect(res.balance.nRLC.substr(0, 2)).not.toBe('0');
});

test('[sidechain] iexec wallet sendETH', async () => {
  const raw = await execAsync(
    `${iexecPath} wallet sendETH 0.1 --to ${ADDRESS2} --password test --wallet-address ${ADDRESS} --force --raw`,
  ).catch(e => e.message);
  const res = JSON.parse(raw);
  expect(res.ok).toBe(false);
}, 10000);

test('[sidechain] iexec wallet sendRLC', async () => {
  const raw = await execAsync(
    `${iexecPath} wallet sendRLC 1000000000 --to ${ADDRESS2} --password test --wallet-address ${ADDRESS} --force --raw`,
  );
  const res = JSON.parse(raw);
  expect(res.ok).toBe(true);
  expect(res.from).toBe(ADDRESS);
  expect(res.to).toBe(ADDRESS2);
  expect(res.amount).toBe('1000000000');
  expect(res.txHash).not.toBe(undefined);
}, 10000);

test('[sidechain] iexec account deposit 1000 (+ wallet)', async () => {
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
  const raw = await execAsync(
    `${iexecPath} account deposit ${amount} --password test --wallet-address ${ADDRESS} --raw`,
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
  expect(initialWalletBalance.sub(bnAmount).gte(finalWalletBalance)).toBe(true);
  expect(initialAccountBalance.add(bnAmount).eq(finalAccountBalance)).toBe(
    true,
  );
}, 30000);

test('[sidechain] iexec account withdraw 500 (+ wallet)', async () => {
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
    `${iexecPath} account withdraw ${amount} --password test --wallet-address ${ADDRESS} --raw`,
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
  expect(initialWalletBalance.add(bnAmount).gte(finalWalletBalance)).toBe(true);
  expect(initialAccountBalance.sub(bnAmount).eq(finalAccountBalance)).toBe(
    true,
  );
  // expect(initialWalletBalance.lt(finalWalletBalance)).toBe(true);
}, 30000);

test('[sidechain] iexec wallet sweep (unencrypted wallet.json)', async () => {
  await execAsync('mv wallet.back wallet.json');
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

test('[sidechain] iexec wallet sweep (empty unencrypted wallet.json)', async () => {
  const raw = await execAsync(
    `${iexecPath} wallet sweep --to ${ADDRESS} --force --raw`,
  );
  await execAsync('rm wallet.json');
  const res = JSON.parse(raw);
  expect(res.ok).toBe(true);
  expect(res.from).toBe(ADDRESS2);
  expect(res.to).toBe(ADDRESS);
  expect(res.sendERC20TxHash).toBe(undefined);
  expect(res.sendNativeTxHash).toBe(undefined);
  expect(res.errors.length).toBe(1);
}, 15000);

// schema-validator
test('[common] iexec registry validate app (invalid iexec.json)', () => expect(execAsync(`${iexecPath} registry validate app`)).rejects.toThrow());

test('[common] iexec registry validate dataset (invalid iexec.json)', () => expect(
  execAsync(`${iexecPath} registry validate dataset`),
).rejects.toThrow());

test('[common] iexec registry validate workerpool (invalid iexec.json)', () => expect(
  execAsync(`${iexecPath} registry validate workerpool`),
).rejects.toThrow());

test('[common] iexec registry validate app', async () => {
  await execAsync('cp ./inputs/validator/iexec-app.json iexec.json');
  expect(execAsync(`${iexecPath} registry validate app`)).resolves.not.toBe(1);
});

test('[common] iexec registry validate dataset', async () => {
  await execAsync('cp ./inputs/validator/iexec-dataset.json iexec.json');
  expect(execAsync(`${iexecPath} registry validate dataset`)).resolves.not.toBe(
    1,
  );
});

test('[common] iexec registry validate workerpool', async () => {
  await execAsync('cp ./inputs/validator/iexec-workerpool.json iexec.json');
  expect(
    execAsync(`${iexecPath} registry validate workerpool`),
  ).resolves.not.toBe(1);
});
