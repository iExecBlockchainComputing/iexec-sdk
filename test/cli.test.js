const fs = require('fs-extra');
const { exec } = require('child_process');
const Promise = require('bluebird');

const execAsync = Promise.promisify(exec);

test(
  'iexec init',
  () => expect(execAsync('iexec init')).resolves.not.toBe(1),
  10000,
);

test('iexec wallet create', () => {
  process.chdir('iexec-init');
  return expect(execAsync('iexec wallet create')).resolves.not.toBe(1);
});

test(
  'iexec wallet show',
  () => expect(execAsync('iexec wallet show')).resolves.not.toBe(1),
  10000,
);

test('iexec account login', () =>
  expect(execAsync('iexec account login')).resolves.not.toBe(1));

test(
  'iexec account show',
  () => expect(execAsync('iexec account show')).resolves.not.toBe(1),
  10000,
);

test(
  'iexec compile',
  () => expect(execAsync('iexec compile')).resolves.not.toBe(1),
  20000,
);

test('iexec truffle version', () =>
  expect(execAsync('iexec truffle version')).resolves.not.toBe(1));

test('iexec server version', () =>
  expect(execAsync('iexec server version')).resolves.not.toBe(1));

test('iexec upgrade', () =>
  expect(execAsync('iexec upgrade')).resolves.not.toBe(1));

afterAll(() => fs.remove('iexec-init'));
