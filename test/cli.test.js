const { exec } = require('child_process');
const Promise = require('bluebird');

const { DRONE } = process.env;
const execAsync = Promise.promisify(exec);

const iexecPath = DRONE ? 'iexec' : 'node ../src/iexec.js';

test('iexec init', () => {
  process.chdir('test');
  return expect(execAsync(`${iexecPath} init --force`)).resolves.not.toBe(1);
});

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

test(
  'iexec wallet show',
  () => expect(execAsync(`${iexecPath} wallet show`)).resolves.not.toBe(1),
  10000,
);

test('iexec account login', () => expect(execAsync(`${iexecPath} account login --force`)).resolves.not.toBe(1));

// Uncomment when PoCo v3 deployed
test.skip(
  'iexec account show',
  () => expect(execAsync(`${iexecPath} account show`)).resolves.not.toBe(1),
  10000,
);

test('iexec app init', () => expect(execAsync(`${iexecPath} app init`)).resolves.not.toBe(1));

test('iexec order init', () => expect(execAsync(`${iexecPath} order init`)).resolves.not.toBe(1));
test('iexec order init --app', () => expect(execAsync(`${iexecPath} order init --app`)).resolves.not.toBe(1));
test('iexec order init --data', () => expect(execAsync(`${iexecPath} order init --data`)).resolves.not.toBe(1));
test('iexec order init --pool', () => expect(execAsync(`${iexecPath} order init --pool`)).resolves.not.toBe(1));
test('iexec order init --user', () => expect(execAsync(`${iexecPath} order init --user`)).resolves.not.toBe(1));

// Uncomment when PoCo v3 deployed
test.skip('iexec order sign', () => expect(execAsync(`${iexecPath} order sign`)).resolves.not.toBe(1));
test.skip('iexec order sign --app', () => expect(execAsync(`${iexecPath} order sign --app`)).resolves.not.toBe(1));
test.skip('iexec order sign --data', () => expect(execAsync(`${iexecPath} order sign --data`)).resolves.not.toBe(1));
test.skip('iexec order sign --pool', () => expect(execAsync(`${iexecPath} order sign --pool`)).resolves.not.toBe(1));
test.skip('iexec order sign --user', () => expect(execAsync(`${iexecPath} order sign --user`)).resolves.not.toBe(1));

// Uncomment when update schema-validator
test.skip('iexec registry validate app', () => expect(execAsync(`${iexecPath} registry validate app`)).resolves.not.toBe(1));
test.skip('iexec registry validate dataset', () => expect(execAsync(`${iexecPath} registry validate dataset`)).resolves.not.toBe(
  1,
));
test.skip('iexec registry validate workerpool', () => expect(
  execAsync(`${iexecPath} registry validate workerpool`),
).resolves.not.toBe(1));

// Uncomment when PoCo v3 deployed
test.skip('iexec app count', () => expect(execAsync(`${iexecPath} app count`)).resolves.not.toBe(1));

test('iexec dataset init', () => expect(execAsync(`${iexecPath} dataset init`)).resolves.not.toBe(1));

test('iexec workerpool init', () => expect(execAsync(`${iexecPath} workerpool init`)).resolves.not.toBe(1));

test('iexec category init', () => expect(execAsync(`${iexecPath} category init`)).resolves.not.toBe(1));

// Uncomment when reimplemented
test.skip('iexec order count', () => expect(execAsync(`${iexecPath} order count`)).resolves.not.toBe(1));

// Uncomment when reimplemented
test.skip('iexec workerpool count', () => expect(execAsync(`${iexecPath} app count`)).resolves.not.toBe(1));

// Uncomment when reimplemented
test.skip('iexec orderbook show', () => expect(execAsync(`${iexecPath} orderbook show`)).resolves.not.toBe(1));

// Uncomment when PoCo v3 deployed
test.skip('iexec info', () => expect(execAsync(`${iexecPath} info`)).resolves.not.toBe(1));
