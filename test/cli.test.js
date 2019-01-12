const { exec } = require('child_process');
const Promise = require('bluebird');
const ethers = require('ethers');
const fs = require('fs-extra');
const path = require('path');

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

test('iexec init', async () => {
  const block4 = await ethRPC.getBlock(4);
  const { creates } = await ethRPC.getTransaction(block4.transactions[0]);
  console.log('hubAddress', creates);
  hubAddress = creates;
  process.chdir('test');
  return expect(
    execAsync(`${iexecPath} init --password test --force`),
  ).resolves.not.toBe(1);
}, 10000);

// CHAIN.JSON
test('edit chain.json', () => expect(
  execAsync(`sed -i '/"hub"/c"hub": "${hubAddress}",' chain.json`)
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
    execAsync(`${iexecPath} wallet create --password test --force`),
  ).resolves.not.toBe(1),
  10000,
);

test(
  'iexec wallet import',
  () => expect(
    execAsync(
      `${iexecPath} wallet import ${PRIVATE_KEY} --password test --force --raw > walletImport_stdout.json`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

test(
  'iexec wallet show (+ wallet from address)',
  () => expect(
    execAsync(
      `${iexecPath} wallet show --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

test('iexec wallet show (+ wallet from file name)', async () => {
  const { fileName } = await loadJSONFile('walletImport_stdout.json');
  const walletFile = fileName.split('/')[fileName.split('/').length - 1];
  return expect(
    execAsync(
      `${iexecPath} wallet show --password test --wallet-file ${walletFile}`,
    ),
  ).resolves.not.toBe(1);
}, 10000);

test(
  'iexec wallet show (wrong password)',
  () => expect(
    execAsync(
      `${iexecPath} wallet show --password fail --wallet-address ${ADDRESS}`,
    ),
  ).rejects.not.toBe(1),
  10000,
);

test(
  'iexec wallet show (missing wallet file)',
  () => expect(
    execAsync(
      `${iexecPath} wallet show --password fail --wallet-address ${ADDRESS2}`,
    ),
  ).rejects.not.toBe(1),
  10000,
);

test(
  'iexec wallet show [address]',
  () => expect(execAsync(`${iexecPath} wallet show ${ADDRESS}`)).resolves.not.toBe(
    1,
  ),
  10000,
);

// INFO
test('iexec info', () => expect(execAsync(`${iexecPath} info`)).resolves.not.toBe(1));

// ACCOUNT
test(
  'iexec account login',
  () => expect(
    execAsync(
      `${iexecPath} account login --force --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test(
  'iexec account show (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} account show --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test(
  'iexec account show [address]',
  () => expect(execAsync(`${iexecPath} account show ${ADDRESS}`)).resolves.not.toBe(
    1,
  ),
  10000,
);
test(
  'iexec account deposit 1000 (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} account deposit 1000 --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  20000,
);
test(
  'iexec account withdraw 1000 (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} account withdraw 1000 --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

// APP
test('iexec app init (no wallet)', () => expect(execAsync(`${iexecPath} app init`)).resolves.not.toBe(1));
test(
  'iexec app init (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} app init --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test(
  'iexec app deploy (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} app deploy --password test --wallet-address ${ADDRESS} --raw > appDeploy_stdout.json`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test(
  'iexec app show 1 (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} app show 1 --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test(
  'iexec app show 1 --user [address]',
  () => expect(
    execAsync(`${iexecPath} app show 1 --user ${ADDRESS}`),
  ).resolves.not.toBe(1),
  10000,
);
test(
  'iexec app count (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} app count --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test(
  'iexec app count --user [address]',
  () => expect(
    execAsync(`${iexecPath} app count --user ${ADDRESS}`),
  ).resolves.not.toBe(1),
  10000,
);

// DATASET
test('iexec dataset init (no wallet)', () => expect(execAsync(`${iexecPath} dataset init`)).resolves.not.toBe(1));
test(
  'iexec dataset init (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} dataset init --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test(
  'iexec dataset deploy (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} dataset deploy --password test --wallet-address ${ADDRESS} --raw > datasetDeploy_stdout.json`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test(
  'iexec dataset show 1 (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} dataset show 1 --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test('iexec dataset show 1 --user [address]', () => expect(
  execAsync(`${iexecPath} dataset show 1 --user ${ADDRESS}`),
).resolves.not.toBe(1));
test(
  'iexec dataset count (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} dataset count --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test(
  'iexec dataset count --user [address]',
  () => expect(
    execAsync(`${iexecPath} dataset count --user ${ADDRESS}`),
  ).resolves.not.toBe(1),
  10000,
);

// WORKERPOOL
test('iexec workerpool init (no wallet)', () => expect(execAsync(`${iexecPath} workerpool init`)).resolves.not.toBe(1));
test(
  'iexec workerpool init (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} workerpool init --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test(
  'iexec workerpool deploy (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} workerpool deploy --password test --wallet-address ${ADDRESS} --raw > workerpoolDeploy_stdout.json`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test(
  'iexec workerpool show 1 (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} workerpool show 1 --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test(
  'iexec workerpool show 1 --user [address]',
  () => expect(
    execAsync(
      `${iexecPath} workerpool show --password test --user ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test(
  'iexec workerpool count (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} workerpool count --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test(
  'iexec workerpool count --user',
  () => expect(
    execAsync(`${iexecPath} workerpool count --user ${ADDRESS}`),
  ).resolves.not.toBe(1),
  10000,
);

// CATEGORY
test('iexec category init', () => expect(execAsync(`${iexecPath} category init`)).resolves.not.toBe(1));
test(
  'iexec category create (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} category create --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test('iexec category show 1', () => expect(execAsync(`${iexecPath} category show 1`)).resolves.not.toBe(1));
test('iexec category count', () => expect(execAsync(`${iexecPath} category count`)).resolves.not.toBe(1));

// ORDER
test('iexec order init', () => expect(execAsync(`${iexecPath} order init`)).resolves.not.toBe(1));
test('iexec order init --app', () => expect(execAsync(`${iexecPath} order init --app`)).resolves.not.toBe(1));
test('iexec order init --dataset', () => expect(execAsync(`${iexecPath} order init --dataset`)).resolves.not.toBe(1));
test('iexec order init --workerpool', () => expect(execAsync(`${iexecPath} order init --workerpool`)).resolves.not.toBe(
  1,
));
test('iexec order init --request', () => expect(execAsync(`${iexecPath} order init --request`)).resolves.not.toBe(1));
test(
  'iexec order init --request (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} order init --request --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

// edit order
test('edit requestOrder app iexec.json => use deployed app', async () => {
  const { address } = await loadJSONFile('appDeploy_stdout.json');
  return expect(
    execAsync(
      `sed -i 's/"app": "0x0000000000000000000000000000000000000000",/"app": "${address}",/' iexec.json`,
    ),
  ).resolves.not.toBe(1);
});
test('edit requestOrder dataset iexec.json => use deployed dataset', async () => {
  const { address } = await loadJSONFile('datasetDeploy_stdout.json');
  return expect(
    execAsync(
      `sed -i 's/"dataset": "0x0000000000000000000000000000000000000000",/"dataset": "${address}",/' iexec.json`,
    ),
  ).resolves.not.toBe(1);
});
test('edit requestOrder workerpool iexec.json => use deployed workerpool', async () => {
  const { address } = await loadJSONFile('workerpoolDeploy_stdout.json');
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
      `${iexecPath} order sign --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  20000,
);
test(
  'iexec order sign --app (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} order sign --app --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test(
  'iexec order sign --dataset (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} order sign --dataset --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test(
  'iexec order sign --workerpool (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} order sign --workerpool --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test(
  'iexec order sign --request (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} order sign --request --password test --wallet-address ${ADDRESS}`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

test(
  'iexec order fill (+ wallet)',
  () => expect(
    execAsync(
      `${iexecPath} order fill --password test --wallet-address ${ADDRESS} --raw > 'orderFill_stdout.json'`,
    ),
  ).resolves.not.toBe(1),
  10000,
);

// DEAL
test('iexec deal show', async () => {
  const { dealid } = await loadJSONFile('orderFill_stdout.json');
  return expect(
    execAsync(
      `${iexecPath} deal show ${dealid} --raw > 'dealShow_stdout.json' `,
    ),
  ).resolves.not.toBe(1);
});

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
test('iexec wallet import --keystoredir [path]', () => expect(
  execAsync(
    `${iexecPath} wallet import ${PRIVATE_KEY2} --password customPath --keystoredir temp/iexecSDKTest`,
  ),
).resolves.not.toBe(1));

test('iexec wallet show --keystoredir [path] --wallet-address', () => expect(
  execAsync(
    `${iexecPath} wallet show --password customPath --keystoredir temp/iexecSDKTest --wallet-address ${ADDRESS2}`,
  ),
).resolves.not.toBe(1));

// keystoredir local
test('iexec wallet import --keystoredir local', () => expect(
  execAsync(
    `${iexecPath} wallet import ${PRIVATE_KEY3} --password 'my local pass phrase'  --keystoredir local`,
  ),
).resolves.not.toBe(1));

test('iexec wallet show --keystoredir local --wallet-address', () => expect(
  execAsync(
    `${iexecPath} wallet show --password 'my local pass phrase' --keystoredir local --wallet-address ${ADDRESS3}`,
  ),
).resolves.not.toBe(1));

// unecrypted wallet
test('iexec wallet import --unencrypted', () => expect(
  execAsync(`${iexecPath} wallet import ${PRIVATE_KEY2} --unencrypted`),
).resolves.not.toBe(1));

test('iexec wallet show (unencrypted wallet.json)', () => expect(execAsync(`${iexecPath} wallet show`)).resolves.not.toBe(1));

test('remove unencrypted wallet.json', () => expect(execAsync('rm wallet.json')).resolves.not.toBe(1));
