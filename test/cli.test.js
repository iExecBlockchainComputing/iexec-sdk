const { exec } = require('child_process');
const Promise = require('bluebird');

const { DRONE } = process.env;
const execAsync = Promise.promisify(exec);

const iexecPath = DRONE ? 'iexec' : 'node ../src/iexec.js';

test('iexec init', () => {
  process.chdir('test');
  return expect(execAsync(`${iexecPath} init --force`)).resolves.not.toBe(1);
});

test('iexec wallet create', () =>
  expect(execAsync(`${iexecPath} wallet create --force`)).resolves.not.toBe(1));

test(
  'iexec wallet show',
  () => expect(execAsync(`${iexecPath} wallet show`)).resolves.not.toBe(1),
  10000,
);

test('iexec account login', () =>
  expect(execAsync(`${iexecPath} account login --force`)).resolves.not.toBe(1));

test(
  'iexec account show',
  () => expect(execAsync(`${iexecPath} account show`)).resolves.not.toBe(1),
  10000,
);

test('iexec app init', () =>
  expect(execAsync(`${iexecPath} app init`)).resolves.not.toBe(1));

test('iexec app count', () =>
  expect(execAsync(`${iexecPath} app count`)).resolves.not.toBe(1));

test('iexec dataset init', () =>
  expect(execAsync(`${iexecPath} dataset init`)).resolves.not.toBe(1));

test('iexec workerpool init', () =>
  expect(execAsync(`${iexecPath} workerpool init`)).resolves.not.toBe(1));

test('iexec category init', () =>
  expect(execAsync(`${iexecPath} category init`)).resolves.not.toBe(1));

test('iexec order init --sell', () =>
  expect(execAsync(`${iexecPath} order init --sell`)).resolves.not.toBe(1));

test('iexec order init --buy', () =>
  expect(execAsync(`${iexecPath} order init --buy`)).resolves.not.toBe(1));

test('iexec upgrade', () =>
  expect(execAsync(`${iexecPath} upgrade`)).resolves.not.toBe(1));
