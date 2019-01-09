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

test('iexec init', async () => {
  const block4 = await ethRPC.getBlock(4);
  const { creates } = await ethRPC.getTransaction(block4.transactions[0]);
  console.log('hubAddress', creates);
  hubAddress = creates;
  process.chdir('test');
  return expect(execAsync(`${iexecPath} init --force`)).resolves.not.toBe(1);
});

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

test('iexec wallet create', () => expect(execAsync(`${iexecPath} wallet create --force`)).resolves.not.toBe(1));

test(
  'iexec wallet encrypt',
  () => expect(
    execAsync(`${iexecPath} wallet encrypt --password toto --force`),
  ).resolves.not.toBe(1),
  10000,
);

test(
  'iexec wallet decrypt',
  () => expect(
    execAsync(`${iexecPath} wallet decrypt --password toto --force`),
  ).resolves.not.toBe(1),
  10000,
);

test('iexec wallet show', () => expect(execAsync(`${iexecPath} wallet show`)).resolves.not.toBe(1));

// REPLACE WALLET
test('edit wallet.json', () => expect(
  execAsync(
    'sed -i \'/"privateKey"/c"privateKey": "0xeb7877df435d1edf3f2dc94bf6784f20592d5d3235ef86a44002f2f6e58efd09",\' wallet.json',
  ),
).resolves.not.toBe(1));

// INFO
test('iexec info', () => expect(execAsync(`${iexecPath} info`)).resolves.not.toBe(1));

// ACCOUNT
test('iexec account login', () => expect(execAsync(`${iexecPath} account login --force`)).resolves.not.toBe(1));
test('iexec account show', () => expect(execAsync(`${iexecPath} account show`)).resolves.not.toBe(1));
test(
  'iexec account deposit 1000',
  () => expect(execAsync(`${iexecPath} account deposit 1000`)).resolves.not.toBe(1),
  15000,
);
test(
  'iexec account withdraw 1000',
  () => expect(execAsync(`${iexecPath} account withdraw 1000`)).resolves.not.toBe(
    1,
  ),
  10000,
);

// APP
test('iexec app init', () => expect(execAsync(`${iexecPath} app init`)).resolves.not.toBe(1));
test(
  'iexec app deploy',
  () => expect(
    execAsync(`${iexecPath} app deploy --raw > appDeploy_stdout.json`),
  ).resolves.not.toBe(1),
  10000,
);
test('iexec app show 1', () => expect(execAsync(`${iexecPath} app show 1`)).resolves.not.toBe(1));
test('iexec app count', () => expect(execAsync(`${iexecPath} app count`)).resolves.not.toBe(1));

// DATASET
test('iexec dataset init', () => expect(execAsync(`${iexecPath} dataset init`)).resolves.not.toBe(1));
test(
  'iexec dataset deploy',
  () => expect(
    execAsync(
      `${iexecPath} dataset deploy --raw > datasetDeploy_stdout.json`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test('iexec dataset show 1', () => expect(execAsync(`${iexecPath} dataset show 1`)).resolves.not.toBe(1));
test('iexec dataset count', () => expect(execAsync(`${iexecPath} dataset count`)).resolves.not.toBe(1));

// WORKERPOOL
test('iexec workerpool init', () => expect(execAsync(`${iexecPath} workerpool init`)).resolves.not.toBe(1));
test(
  'iexec workerpool deploy',
  () => expect(
    execAsync(
      `${iexecPath} workerpool deploy --raw > workerpoolDeploy_stdout.json`,
    ),
  ).resolves.not.toBe(1),
  10000,
);
test('iexec workerpool show 1', () => expect(execAsync(`${iexecPath} workerpool show 1`)).resolves.not.toBe(1));
test('iexec workerpool count', () => expect(execAsync(`${iexecPath} workerpool count`)).resolves.not.toBe(1));

// CATEGORY
test('iexec category init', () => expect(execAsync(`${iexecPath} category init`)).resolves.not.toBe(1));
test(
  'iexec category create',
  () => expect(execAsync(`${iexecPath} category create`)).resolves.not.toBe(1),
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

test('iexec order sign', () => expect(execAsync(`${iexecPath} order sign`)).resolves.not.toBe(1));
test('iexec order sign --app', () => expect(execAsync(`${iexecPath} order sign --app`)).resolves.not.toBe(1));
test('iexec order sign --dataset', () => expect(execAsync(`${iexecPath} order sign --dataset`)).resolves.not.toBe(1));
test('iexec order sign --workerpool', () => expect(execAsync(`${iexecPath} order sign --workerpool`)).resolves.not.toBe(
  1,
));
test('iexec order sign --request', () => expect(execAsync(`${iexecPath} order sign --request`)).resolves.not.toBe(1));

test(
  'iexec order fill',
  () => expect(
    execAsync(`${iexecPath} order fill --raw > 'orderFill_stdout.json'`),
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
