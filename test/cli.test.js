const { exec } = require('child_process');
const Promise = require('bluebird');

const execAsync = Promise.promisify(exec);

test('iexec init', () => {
  process.chdir('test');
  return expect(execAsync('iexec init --force')).resolves.not.toBe(1);
});

test('iexec wallet create', () =>
  expect(execAsync('iexec wallet create --force')).resolves.not.toBe(1));

test(
  'iexec wallet show',
  () => expect(execAsync('iexec wallet show')).resolves.not.toBe(1),
  10000,
);

test('iexec account login', () =>
  expect(execAsync('iexec account login --force')).resolves.not.toBe(1));

test(
  'iexec account show',
  () =>
    expect(execAsync('iexec account show --chain kovan')).resolves.not.toBe(1),
  10000,
);

test('iexec app init', () =>
  expect(execAsync('iexec app init')).resolves.not.toBe(1));

test('iexec app count', () =>
  expect(execAsync('iexec app count --chain kovan')).resolves.not.toBe(1));

test('iexec dataset init', () =>
  expect(execAsync('iexec dataset init')).resolves.not.toBe(1));

test('iexec workerpool init', () =>
  expect(execAsync('iexec workerpool init')).resolves.not.toBe(1));

test('iexec category init', () =>
  expect(execAsync('iexec category init')).resolves.not.toBe(1));

test('iexec order init --sell', () =>
  expect(execAsync('iexec order init --sell')).resolves.not.toBe(1));

test('iexec order init --buy', () =>
  expect(execAsync('iexec order init --buy')).resolves.not.toBe(1));

test('iexec upgrade', () =>
  expect(execAsync('iexec upgrade')).resolves.not.toBe(1));
