const { exec } = require('child_process');
const semver = require('semver');
const Promise = require('bluebird');
const ethers = require('ethers');
const fs = require('fs-extra');
const path = require('path');

console.log('Node version:', process.version);

const { DRONE } = process.env;
const execAsync = Promise.promisify(exec);

const iexecPath = DRONE ? 'iexec' : 'node ../src/iexec.js';
const ethereumHost = DRONE ? 'ethereum' : 'localhost';
const ethereumURL = `http://${ethereumHost}:8545`;
const chainName = 'dev';
let hubAddress;
const ethRPC = new ethers.providers.JsonRpcProvider(ethereumURL);

const loadJSONFile = async (fileName) => {
  const filePath = path.join(process.cwd(), fileName);
  const fileJSON = await fs.readFile(filePath, 'utf8');
  const file = JSON.parse(fileJSON);
  return file;
};

const PRIVATE_KEY = '0xeb7877df435d1edf3f2dc94bf6784f20592d5d3235ef86a44002f2f6e58efd09';
const ADDRESS = '0xC08C3def622Af1476f2Db0E3CC8CcaeAd07BE3bB';
const PRIVATE_KEY2 = '0xd0c5f29f0e7ebe1d3217096fb06130e217758c90f361d3c52ea26c2a0ecc99fb';
const ADDRESS2 = '0x650ae1d365369129c326Cd15Bf91793b52B7cf59';
const PRIVATE_KEY3 = '0xcfae38ce58f250c2b5bd28389f42e720c1a8db98ef8eeb0bd4aef2ddf9d56076';
const ADDRESS3 = '0xA540FCf5f097c3F996e680F5cb266629600F064A';

let testNum = 0;
const saveRaw = () => {
  testNum += 1;
  return `--raw > out/${testNum}_out 2>&1`;
};

execAsync('rm -r test/out').catch(e => console.log(e.message));
execAsync('mkdir test/out').catch(e => console.log(e.message));

test('iexec init', async () => {
  const block4 = await ethRPC.getBlock(4);
  const { creates } = await ethRPC.getTransaction(block4.transactions[0]);
  console.log('hubAddress', creates);
  hubAddress = creates;
  process.chdir('test');
  return expect(
    execAsync(`${iexecPath} init --password test --force ${saveRaw()}`),
  ).resolves.not.toBe(1);
}, 10000);

// CHAIN.JSON
test('edit chain.json', () => expect(
  execAsync(`sed -i '/"hub"/c"hub": "${hubAddress}"' chain.json`)
    .then(
      execAsync(`sed -i '/"default"/c"default": "${chainName}",' chain.json`),
    )
    .then(
      execAsync(`sed -i '/"host"/c"host": "${ethereumURL}",' chain.json`),
    ),
).resolves.not.toBe(1));

test(
  'iexec wallet create',
  () => expect(
    execAsync(
      `${iexecPath} wallet create --password test --force ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

test(
  'iexec wallet import',
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
test('iexec info', () => expect(execAsync(`${iexecPath} info ${saveRaw()}`)).resolves.not.toBe(1));

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
test(
  'iexec account deposit 1000 (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} account deposit 1000 --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  20000,
);
test(
  'iexec account withdraw 1000 (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} account withdraw 1000 --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  15000,
);

// APP
test(
  'iexec app init (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} app init --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test('iexec app init (no wallet)', () => expect(execAsync(`${iexecPath} app init ${saveRaw()}`)).resolves.not.toBe(1));
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
  'iexec dataset init (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} dataset init --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test('iexec dataset init (no wallet)', () => expect(execAsync(`${iexecPath} dataset init ${saveRaw()}`)).resolves.not.toBe(
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
  'iexec workerpool init (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} workerpool init --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test('iexec workerpool init (no wallet)', () => expect(execAsync(`${iexecPath} workerpool init`)).resolves.not.toBe(1));
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
test('iexec category init', () => expect(execAsync(`${iexecPath} category init`)).resolves.not.toBe(1));
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
test('iexec order init', () => expect(execAsync(`${iexecPath} order init ${saveRaw()}`)).resolves.not.toBe(
  1,
));
test('iexec order init --app', () => expect(
  execAsync(`${iexecPath} order init --app ${saveRaw()}`),
).resolves.not.toBe(1));
test('iexec order init --dataset', () => expect(
  execAsync(`${iexecPath} order init --dataset ${saveRaw()}`),
).resolves.not.toBe(1));
test('iexec order init --workerpool', () => expect(
  execAsync(`${iexecPath} order init --workerpool ${saveRaw()}`),
).resolves.not.toBe(1));
test('iexec order init --request', () => expect(
  execAsync(`${iexecPath} order init --request ${saveRaw()}`),
).resolves.not.toBe(1));
test(
  'iexec order init --request (+ wallet)',
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
test('iexec tee init', async () => expect(execAsync(`${iexecPath} tee init ${saveRaw()}`)).resolves.not.toBe(1));

if (semver.gt('v10.12.0', process.version)) {
  test('iexec tee generate-beneficiary-keys', async () => expect(
    execAsync(`${iexecPath} tee generate-beneficiary-keys ${saveRaw()}`),
  ).rejects.not.toBe(1));
} else {
  test('iexec tee generate-beneficiary-keys', async () => expect(
    execAsync(
      `${iexecPath} tee generate-beneficiary-keys --force ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1));
}

test('iexec tee decrypt-results --force (wrong beneficiary key)', async () => expect(
  execAsync(
    `${iexecPath} tee decrypt-results inputs/encryptedResults/encryptedResults.zip --force ${saveRaw()}`,
  ),
).rejects.not.toBe(1));

test('iexec tee decrypt-results --beneficiary-keystoredir <path>', async () => expect(
  execAsync(
    `${iexecPath} tee decrypt-results inputs/encryptedResults/encryptedResults.zip --beneficiary-keystoredir inputs/beneficiaryKeys/ ${saveRaw()}`,
  ),
).resolves.not.toBe(1));

test('iexec tee decrypt-results --beneficiary-keystoredir <path> --beneficiary-key-file <fileName> --force ', async () => expect(
  execAsync(
    `${iexecPath} tee decrypt-results inputs/encryptedResults/encryptedResults.zip --beneficiary-keystoredir inputs/beneficiaryKeys/ --beneficiary-key-file 0xC08C3def622Af1476f2Db0E3CC8CcaeAd07BE3bB_key  --force ${saveRaw()}`,
  ),
).resolves.not.toBe(1));

// // Uncomment when update schema-validator
// test.skip('iexec registry validate app', () => expect(execAsync(`${iexecPath} registry validate app`)).resolves.not.toBe(1));
// test.skip('iexec registry validate dataset', () => expect(execAsync(`${iexecPath} registry validate dataset`)).resolves.not.toBe(
//   1,
// ));
// test.skip('iexec registry validate workerpool', () => expect(
//   execAsync(`${iexecPath} registry validate workerpool`),
// ).resolves.not.toBe(1));

// // Uncomment when reimplemented
// test.skip('iexec order count', () => expect(execAsync(`${iexecPath} order count`)).resolves.not.toBe(1));
//

// keystoredir custom
test(
  'iexec wallet import --keystoredir [path]',
  () => expect(
    execAsync(
      `${iexecPath} wallet import ${PRIVATE_KEY2} --password customPath --keystoredir temp/iexecSDKTest ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

test(
  'iexec wallet show --keystoredir [path] --wallet-address',
  () => expect(
    execAsync(
      `${iexecPath} wallet show --password customPath --keystoredir temp/iexecSDKTest --wallet-address ${ADDRESS2} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

// keystoredir local
test(
  'iexec wallet import --keystoredir local',
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
test(
  'iexec wallet sendETH',
  () => expect(
    execAsync(
      `${iexecPath} wallet sendETH 1 --to ${ADDRESS2} --force --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

// sendRLC
test(
  'iexec wallet sendRLC',
  () => expect(
    execAsync(
      `${iexecPath} wallet sendRLC 1000 --to ${ADDRESS2} --force --password test --wallet-address ${ADDRESS} ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

// unecrypted wallet
test(
  'iexec wallet import --unencrypted',
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

test(
  'iexec wallet sweep (unencrypted wallet.json)',
  () => expect(
    execAsync(
      `${iexecPath} wallet sweep --to ${ADDRESS} --force ${saveRaw()}`,
    ),
  ).resolves.not.toBe(1),
  15000,
);

test('remove unencrypted wallet.json', () => expect(execAsync('rm wallet.json')).resolves.not.toBe(1));
