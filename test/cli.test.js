// const fs = require('fs-extra');
const { exec } = require('child_process');
const Promise = require('bluebird');

const execAsync = Promise.promisify(exec);

test('iexec init', () =>
  expect(execAsync('node /home/victor/code/github.com/iExecBlockchainComputing/iexec-sdk/src/iexec.js init --force')).resolves.not.toBe(1));

test('iexec wallet create', () =>
  expect(execAsync('node /home/victor/code/github.com/iExecBlockchainComputing/iexec-sdk/src/iexec.js wallet create --force')).resolves.not.toBe(1));

test(
  'iexec wallet show',
  () =>
    expect(execAsync('node /home/victor/code/github.com/iExecBlockchainComputing/iexec-sdk/src/iexec.js wallet show')).resolves.not.toBe(1),
  10000,
);

test('iexec account login', () =>
  expect(execAsync('node /home/victor/code/github.com/iExecBlockchainComputing/iexec-sdk/src/iexec.js account login --force')).resolves.not.toBe(1));

test(
  'iexec account show',
  () =>
    expect(execAsync('node /home/victor/code/github.com/iExecBlockchainComputing/iexec-sdk/src/iexec.js account show --chain kovan')).resolves.not.toBe(1),
  10000,
);

test('iexec app init', () =>
  expect(execAsync('node /home/victor/code/github.com/iExecBlockchainComputing/iexec-sdk/src/iexec.js app init')).resolves.not.toBe(1));

test('iexec dataset init', () =>
  expect(execAsync('node /home/victor/code/github.com/iExecBlockchainComputing/iexec-sdk/src/iexec.js dataset init')).resolves.not.toBe(1));

test('iexec workerpool init', () =>
  expect(execAsync('node /home/victor/code/github.com/iExecBlockchainComputing/iexec-sdk/src/iexec.js workerpool init')).resolves.not.toBe(1));

test('iexec category init', () =>
  expect(execAsync('node /home/victor/code/github.com/iExecBlockchainComputing/iexec-sdk/src/iexec.js category init')).resolves.not.toBe(1));

test('iexec order init --sell', () =>
  expect(execAsync('node /home/victor/code/github.com/iExecBlockchainComputing/iexec-sdk/src/iexec.js order init --sell')).resolves.not.toBe(1));

test('iexec order init --buy', () =>
  expect(execAsync('node /home/victor/code/github.com/iExecBlockchainComputing/iexec-sdk/src/iexec.js order init --buy')).resolves.not.toBe(1));

test('iexec upgrade', () =>
  expect(execAsync('node /home/victor/code/github.com/iExecBlockchainComputing/iexec-sdk/src/iexec.js upgrade')).resolves.not.toBe(1));

afterAll(() => console.log('finished'));
